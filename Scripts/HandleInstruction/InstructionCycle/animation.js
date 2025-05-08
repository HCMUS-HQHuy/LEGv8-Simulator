const parentGroup = document.getElementById("data-signal-nodes");

export function startSignalAnimation(id) {
	const animation = document.getElementById(`data-anim-${id}`);
	const signalNode = document.getElementById(`data-node-${id}`);
	if (animation == null || signalNode == null) {
		console.warn(`No id:${id} data signal nodes found to animate.`);
		return false;
	}
    console.log(`RUN: ${id}`);
    signalNode.setAttribute('visibility', 'visible');
    animation.beginElement();
    return true;
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

    if (value == null || value === "") {
        console.warn(`value is not valid! ${fieldName}, ${value}`);
        return;
    }

	if (!document.getElementById(pathId)) {
        console.warn(`Data Path Element ID "${pathId}" not found for field "${fieldName}".`);
        return null;
    }

	const nodeGroupId = `data-node-${fieldName}`;
    const animationId = `data-anim-${fieldName}`;
    
    const existingNode = document.getElementById(nodeGroupId);
    if (existingNode) existingNode.remove();

    const svgNS = "http://www.w3.org/2000/svg";

    // Tạo node mới (dùng hình chữ nhật cho địa chỉ)
    const nodeGroup = document.createElementNS(svgNS, 'g');
    nodeGroup.classList.add(className, fieldName, `value-${value}`);

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
    animateMotion.setAttribute('dur', `${duration}ms`);
    animateMotion.setAttribute('begin', 'indefinite');
    animateMotion.setAttribute('fill', 'freeze');

    // Xóa node sau khi animation kết thúc (không cần giữ lại ở đích)
    animateMotion.addEventListener('endEvent', (event) => {
        if (Array.isArray(onEndCallback)) {
            onEndCallback.forEach(cb => {
                if (typeof cb === 'function') {
                    cb();
                }
                else console.warn("onEndCallback list contains a non-function");
            });
        }

        event.target.closest('g')?.remove();
    });
    const mpath = document.createElementNS(svgNS, 'mpath');
    mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${pathId}`);

    animateMotion.appendChild(mpath);

    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('x', '0');
    text.setAttribute('y', '0');

    // Delay 1 frame để text được render, rồi đo
    requestAnimationFrame(() => {
        const bbox = text.getBBox();
        const paddingX = 5;
        const paddingY = 5;

        if (shapeType === 'circle') {
            const radius = Math.max(bbox.width, bbox.height) / 2;
            shape.setAttribute('r', radius + paddingX);   // Cập nhật bán kính
            shape.setAttribute('cx', 0);        // Tọa độ tâm theo trục x
            shape.setAttribute('cy', 0);        // Tọa độ tâm theo trục y
        }
        else if (shapeType === 'rect') {
            const width = bbox.width + paddingX * 2;
            const height = bbox.height + paddingY * 2;
            shape.setAttribute('width', width);
            shape.setAttribute('height', height);
            shape.setAttribute('x', -width / 2);
            shape.setAttribute('y', -height / 2);
        }
        else console.error(`shape ${shapeType} is not supported`);
    });

    nodeGroup.appendChild(shape);
    nodeGroup.appendChild(text);
    nodeGroup.appendChild(animateMotion);

    // return nodeGroup;
    parentGroup.appendChild(nodeGroup);
}

