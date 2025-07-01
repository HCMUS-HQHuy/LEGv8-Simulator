let TimestampState = -1;
let canClear = true;
export function setTimestamp(value) {
    TimestampState = value;
    canClear = true;
}

const svgNS = "http://www.w3.org/2000/svg";
let parentGroup = document.getElementById("data-signal-nodes");
let rootpath = document.getElementById('root-path');

export function resetAnimation() {
    if (rootpath != null) {
        rootpath.remove();
        const PathNew = document.createElementNS(svgNS, 'g');
        PathNew.setAttribute('id', "root-path");
        document.getElementById("container-data-signal-nodes").appendChild(PathNew);
    }
    if (parentGroup != null) {
        parentGroup.remove();
        const parentGroupNew = document.createElementNS(svgNS, 'g');
        parentGroupNew.setAttribute('id', "data-signal-nodes");
        document.getElementById("container-data-signal-nodes").appendChild(parentGroupNew);
    }
    rootpath = document.getElementById('root-path');
    parentGroup = document.getElementById("data-signal-nodes");
}

export function startSignalAnimation(id) {
	const animation = document.getElementById(`data-anim-${id}`);
	const signalNode = document.getElementById(`data-node-${id}`);
	if (animation == null || signalNode == null) {
		console.warn(`No id:${id} data signal nodes found to animate.`);
		return false;
	}
    signalNode.setAttribute('visibility', 'visible');
    animation.beginElement();
    return true;
}

function cloneAndModifyPath(pathId) {
  const original = document.getElementById(pathId);
  if (!original) return;
  const clone = original.cloneNode(true);
  clone.id = pathId + '-new-clone';
  clone.classList.add('svg-clone-color'); // Add class for tracking
  clone.style.stroke = 'var(--actived-line)';
  clone.style['stroke-width'] = 5;
  rootpath.appendChild(clone);
}

function clearClonedPaths(duration) {
    if (!canClear) return;
    canClear = false;
    setTimeout(() => {
        canClear = true;
    }, duration/2);

    const clones = rootpath.querySelectorAll('.svg-clone-color');
    clones.forEach(el => el.remove());
}

export function createNodeWithAnimation({value, fieldName, onEndCallback, pathId, duration, className, shapeType}) {
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

    animateMotion.addEventListener('beginEvent', () => {
        clearClonedPaths(duration);
        cloneAndModifyPath(pathId);
        cloneAndModifyPath(pathId + '-clone');
        cloneAndModifyPath(pathId + '-circle');
    });

    const currentTimestamp = TimestampState;
    animateMotion.addEventListener('endEvent', (event) => {
        clearClonedPaths(duration);
        shape.style.fill = 'gray';
        shape.style.opacity = '0.6';
        if (currentTimestamp == TimestampState && Array.isArray(onEndCallback)) {
            onEndCallback.forEach(cb => {
                if (typeof cb === 'function') {
                    cb();
                }
                else console.warn("onEndCallback list contains a non-function");
            });
        }

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
            const radius = Math.max(bbox.width, bbox.height) / 2.2;
            shape.setAttribute('r', radius + paddingX);   // Cập nhật bán kính
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
