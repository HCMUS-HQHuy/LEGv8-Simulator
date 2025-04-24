import { sendDataToAlu } from "./aluOperation.js";
import { createNodeWithAnimation, startSignalAnimation } from "./animation.js";

const dataSignalNodesGroup = document.getElementById('data-signal-nodes');

const DEFAULT_ANIMATION_DURATION = 2;

export function trigger(state) {
	if (!dataSignalNodesGroup) {
		console.error("SVG group 'control-signal-nodes' not found! Cannot start animation.");
		return;
	}

	return () => {
		const controlSignals = state.Control;
		if (!controlSignals) {
			console.warn("controlSignals is null!");
			return;
		}

		const onEndCallbacks = {
			Reg2Loc: [() => {
				
				document.getElementById("mux-1-0-background").style.display = 'block';

				dataSignalNodesGroup.appendChild(createNodeWithAnimation({ 
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
				startSignalAnimation();
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
	if (!signals) return;

	for (const [signalName, value] of Object.entries(signals)) {
		dataSignalNodesGroup.appendChild(createNodeWithAnimation({ 
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
	const animations = dataSignalNodesGroup.querySelectorAll('animateMotion');
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