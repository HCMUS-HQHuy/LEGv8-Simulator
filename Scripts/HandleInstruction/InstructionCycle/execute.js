import { createNodeWithAnimation, startSignalAnimation } from "./animation.js";

const signalNodesGroup = document.getElementById('control-signal-nodes');

const DEFAULT_ANIMATION_DURATION = 2;

export function trigger(state) {
	return () => {
		const controlSignals = state.Control;
		if (!controlSignals) {
			console.warn("controlSignals is null!");
			return;
		}

		const onEndCallbacks = {
			Reg2Loc: [() => {
				
				document.getElementById("mux-1-0-background").style.display = 'block';

				signalNodesGroup.appendChild(createNodeWithAnimation({ 
					value: state.Mux1.output,
					fieldName: 'reg2loc-mux-to-reg',
					onEndCallback: [
						()=>{document.getElementById('read2').textContent = state.Register.Read2;}
					],
					pathId: 'mux-1-to-register-path',
					duration: DEFAULT_ANIMATION_DURATION,
					className: 'data-node',
					shapeType: 'rect'
				}));
				startSignalAnimation(signalNodesGroup);
			}],
			ALUSrc:   null,
			MemtoReg: null,
			RegWrite: null,
			MemRead:  null,
			MemWrite: null,
			Branch:   null,
			UncondBranch: null,
			ALUOp: null
		}

		displayControlSignalNodes(controlSignals, onEndCallbacks); // Hàm này giờ chỉ tạo node ẩn
		startControlSignalAnimation();
	};
}

// (displayControlSignalNodes cập nhật để nhận cờ `startNow`)
function displayControlSignalNodes(signals, onEndCallbacks) {

	if (!signals || !signalNodesGroup) {
		if (signalNodesGroup) { // Xóa node cũ nếu tín hiệu là null
			while (signalNodesGroup.firstChild) signalNodesGroup.removeChild(signalNodesGroup.firstChild);
		}
		return;
	}

	for (const [signalName, value] of Object.entries(signals)) {
		signalNodesGroup.appendChild(createNodeWithAnimation({ 
			value: value,
			fieldName: signalName,
			onEndCallback: onEndCallbacks[signalName],
			pathId: `control-${signalName.toLowerCase()}-path`,
			duration: DEFAULT_ANIMATION_DURATION,
			className: "signal-control-unit",
			shapeType: 'circle'
		}));
	}
	console.log(`Control signal nodes created (hidden).`);
}

function startControlSignalAnimation() {
	if (!signalNodesGroup) {
		console.error("SVG group 'control-signal-nodes' not found! Cannot start animation.");
		return;
	}
	const animations = signalNodesGroup.querySelectorAll('animateMotion');
	if (animations.length === 0) {
		console.log("No signal nodes found to animate.");
		return;
	}
	console.log(`Starting animation for ${animations.length} control signals.`);
	animations.forEach(anim => {
		const parentGroup = anim.closest('g');
		if (parentGroup) {
			parentGroup.setAttribute('visibility', 'visible');
			anim.beginElement();
		} else {
			console.warn(`Could not find parent group for animation element:`, anim);
		}
	});
}