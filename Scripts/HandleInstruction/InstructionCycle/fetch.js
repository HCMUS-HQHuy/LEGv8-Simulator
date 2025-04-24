// import * as handleSignal from "../signal.js"
import {startSignalAnimation, createNodeWithAnimation} from "./animation.js"

const dataSignalNodesGroup = document.getElementById('data-signal-nodes');
const dataSignalNodesFetchGroup = document.getElementById('data-signal-nodes-fetch');

// --- PATH IDs CHO FETCH (Lấy từ SVG bạn cung cấp) ---
const PC_TO_IMEM_PATH_ID = "pc-to-instruction-memory-path";

const FETCH_ANIMATION_DURATION = 2; // giây (cho PC -> Mem)

// --- PC State ---
const INITIALIZED_VALUE_PC = 15;
let currentPC = INITIALIZED_VALUE_PC; // Initial PC value
const PC_INCREMENT = 4;

function updatePCDisplay(value) { // Nhận giá trị để hiển thị
	const pcTextElement = document.getElementById('pc-value-text');
	if (pcTextElement) {
		const hexValue = value.toString(16).toUpperCase().padStart(8, '0');
		pcTextElement.textContent = `0x${hexValue}`;
	} else {
		console.warn("PC display element ('pc-value-text') not found.");
	}
}

export function trigger(pcFetchCallback) {
	updatePCDisplay(currentPC);

	animatePCToMemory(currentPC, pcFetchCallback);
	animatePCToAddALU(currentPC);
	console.log("--- Processing Complete for Instruction ---");
}

function animatePCToAddALU(pcValue) {
	const onEndCallback = () => {
		dataSignalNodesFetchGroup.appendChild(createNodeWithAnimation({
			value: `0x${(pcValue + PC_INCREMENT).toString(16).toUpperCase().padStart(8, '0')}`,
			fieldName: "PC_Increase",
			onEndCallback: null,
			pathId: "ALU-add-0-to-mux-0-0-path",
			duration:  FETCH_ANIMATION_DURATION, 
			className: 'data-node',
			shapeType: 'rect'
		}));
		startSignalAnimation(dataSignalNodesFetchGroup);
	};

	dataSignalNodesFetchGroup.appendChild(createNodeWithAnimation({
		value: `0x${(PC_INCREMENT).toString(16).toUpperCase().padStart(8, '0')}`,
		fieldName: "Const-To-Add-Value",
		onEndCallback: [onEndCallback],
		pathId: "const-4-to-ALU-add-0-path",
		duration:  FETCH_ANIMATION_DURATION, 
		className: 'data-node',
		shapeType: 'rect'
	}));

	dataSignalNodesFetchGroup.appendChild(createNodeWithAnimation({
		value: `0x${pcValue.toString(16).toUpperCase().padStart(8, '0')}`,
		fieldName: "PC-To-Add-Value",
		onEndCallback: [onEndCallback],
		pathId: "pc-to-ALU-add-0-path",
		duration:  FETCH_ANIMATION_DURATION,
		className: 'data-node',
		shapeType: 'rect'
	}));
	startSignalAnimation(dataSignalNodesFetchGroup);
}

/**
 * Tạo và bắt đầu animation cho PC đi đến Instruction Memory
 */
function animatePCToMemory(pcValue, pcFetchCallback) {
	const hexValue = `0x${pcValue.toString(16).toUpperCase().padStart(8, '0')}`;

	const showAddress = () => {
		const ele = document.getElementById('read-address-instruction-memory');
		if (ele) {
			ele.textContent = `0x${hexValue}`;
		} else {
			console.warn("Element ('read-address-instrsuction-memory') not found.");
		}
	};

	dataSignalNodesGroup.appendChild(createNodeWithAnimation({
		value: hexValue,
		fieldName: "PC_Addr",
		onEndCallback: [pcFetchCallback, showAddress],
		pathId: PC_TO_IMEM_PATH_ID,
		duration:  FETCH_ANIMATION_DURATION,
		className: 'data-node',
		shapeType: 'rect'
	}));
	startSignalAnimation(dataSignalNodesGroup);
}
