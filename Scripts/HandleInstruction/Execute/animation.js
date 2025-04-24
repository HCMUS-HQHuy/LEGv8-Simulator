/**
 * Starts the animation for all data signal nodes. (NEW)
 */
export function startSignalAnimation(dataSignalNodesGroup) {
    if (dataSignalNodesGroup == null) {
        console.error("dataSignalNodesGroup is null");
        return null;
    }

	const animations = dataSignalNodesGroup.querySelectorAll('animateMotion');
	if (animations.length === 0) {
		console.log("No data signal nodes found to animate.");
		return;
	}
	console.log(`Starting animation for ${animations.length} data signals.`);
	animations.forEach(anim => {
		const parentGroup = anim.closest('g');
		if (parentGroup) {
			parentGroup.setAttribute('visibility', 'visible');
			anim.beginElement();
		} else {
			console.warn(`Could not find parent group for data animation element:`, anim);
		}
	});
}

export function createNodeWithAnimation({ 
    value, 
    fieldName,
    onEndCallback, 
    pathId, 
    duration,
    className,
    shapeType
}) {
	if (!pathId) {
        console.warn(`Path ID ${pathId} is not defined.`);
        return;
    }

	if (!document.getElementById(pathId)) {
        console.warn(`Data Path Element ID "${pathId}" not found for field "${fieldName}".`);
        return null;
    }

	const nodeGroupId = `data-node-${fieldName.replace(/\[|\]|-/g, '_')}`;
    const animationId = `data-anim-${fieldName.replace(/\[|\]|-/g, '_')}`;
    const existingNode = document.getElementById(nodeGroupId);
    if (existingNode) existingNode.remove();

    const svgNS = "http://www.w3.org/2000/svg";

    // Tạo node mới (dùng hình chữ nhật cho địa chỉ)
    const nodeGroup = document.createElementNS(svgNS, 'g');
    nodeGroup.classList.add(className, fieldName);

    nodeGroup.setAttribute('id', nodeGroupId);
    nodeGroup.setAttribute('visibility', 'hidden');

    // Tạo hình chữ nhật cho node
    const shape = document.createElementNS(svgNS, shapeType);

    // Tạo text hiển thị giá trị hex cho PC
    const text = document.createElementNS(svgNS, 'text');
    text.textContent = value;

    // Tạo hiệu ứng chuyển động cho node
    const animateMotion = document.createElementNS(svgNS, 'animateMotion');
    animateMotion.setAttribute('id', animationId);
    animateMotion.setAttribute('dur', `${duration}s`); // Thời gian fetch
    animateMotion.setAttribute('begin', 'indefinite');
    animateMotion.setAttribute('fill', 'freeze');

    // Xóa node sau khi animation kết thúc (không cần giữ lại ở đích)
    animateMotion.addEventListener('endEvent', (event) => {
        console.log(`PC value ${value} reached Instruction Memory.`);
        if (typeof onEndCallback === 'function') {
            onEndCallback(); // Gọi callback khi PC đến nơi
        }
        event.target.closest('g')?.remove(); // Tự hủy node sau khi xử lý xong
    });
    // Tạo mpath để di chuyển node dọc theo đường dẫn
    const mpath = document.createElementNS(svgNS, 'mpath');
    mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${pathId}`);

    // Thêm mpath vào animateMotion
    animateMotion.appendChild(mpath);

    // Thêm các phần tử con vào group
    nodeGroup.appendChild(shape);
    nodeGroup.appendChild(text);
    nodeGroup.appendChild(animateMotion);

    return nodeGroup;
}