// import * as handleSignal from "../signal.js"
import {createNodeWithAnimation} from "./animation.js"

const dataSignalNodesGroup = document.getElementById('data-signal-nodes');

// --- PATH IDs CHO FETCH (Lấy từ SVG bạn cung cấp) ---
const PC_TO_IMEM_PATH_ID = "pc-to-instruction-memory-path";

const FETCH_ANIMATION_DURATION = 2; // giây (cho PC -> Mem)

function updatePCDisplay(value) { // Nhận giá trị để hiển thị
	const pcTextElement = document.getElementById('pc-value-text');
	if (pcTextElement) {
		pcTextElement.textContent = `0x${value.toString(16).toUpperCase()}`;
	} else {
		console.warn("PC display element ('pc-value-text') not found.");
	}
}

export function trigger(state, pcFetchCallback) {
	updatePCDisplay(state.PC.OldValue);

	animatePCToMemory(state, pcFetchCallback);
	animatePCToAddALU(state);
	console.log("--- Processing Complete for Instruction ---");
}

function animatePCToAddALU(state) {
	// const onEndCallback = () => {
	// 	dataSignalNodesGroup.appendChild(createNodeWithAnimation({
	// 		value: `0x${PC.Newvalue.toString(16).toUpperCase().padStart(8, '0')}`,
	// 		fieldName: "PC_Increase",
	// 		onEndCallback: null,
	// 		pathId: "ALU-add-0-to-mux-0-0-path",
	// 		duration:  FETCH_ANIMATION_DURATION, 
	// 		className: 'data-node',
	// 		shapeType: 'rect'
	// 	}));
	// };

	dataSignalNodesGroup.appendChild(createNodeWithAnimation({
		value: state.Add0.input1,
		fieldName: "PC-To-Add0-Value",
		onEndCallback: null,
		pathId: "pc-to-ALU-add-0-path",
		duration:  FETCH_ANIMATION_DURATION,
		className: 'data-node',
		shapeType: 'rect'
	}));

	dataSignalNodesGroup.appendChild(createNodeWithAnimation({
		value: state.Add0.input2,
		fieldName: "Const-To-Add0-Value",
		onEndCallback: null,
		pathId: "const-4-to-ALU-add-0-path",
		duration:  FETCH_ANIMATION_DURATION, 
		className: 'data-node',
		shapeType: 'rect'
	}));

	dataSignalNodesGroup.appendChild(createNodeWithAnimation({
		value: state.Add1.input1,
		fieldName: "PC-To-Add1-Value",
		onEndCallback: [()=>{
			document.getElementById("add-1-1").textContent=state.Add1.input1;
		}],
		pathId: "pc-to-ALU-add-1-path",
		duration:  FETCH_ANIMATION_DURATION,
		className: 'data-node',
		shapeType: 'rect'
	}));

}

/**
 * Tạo và bắt đầu animation cho PC đi đến Instruction Memory
 */
function animatePCToMemory(state, pcFetchCallback) {

	const showAddress = () => {
		const ele = document.getElementById('read-address-instruction-memory');
		if (ele) {
			ele.textContent = state.InstructionMemory.ReadAddress;
		} else {
			console.warn("Element ('read-address-instrsuction-memory') not found.");
		}
	};

	dataSignalNodesGroup.appendChild(createNodeWithAnimation({
		value: state.InstructionMemory.ReadAddress,
		fieldName: "PC_Addr",
		onEndCallback: [pcFetchCallback, showAddress],
		pathId: PC_TO_IMEM_PATH_ID,
		duration:  FETCH_ANIMATION_DURATION,
		className: 'data-node',
		shapeType: 'rect'
	}));
}
