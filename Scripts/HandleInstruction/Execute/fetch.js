// import * as handleSignal from "../signal.js"
import {startDataSignalAnimation, createNodeWithAnimation} from "./animation.js"

const dataSignalNodesGroup = document.getElementById('data-signal-nodes');
const dataSignalNodesFetchGroup = document.getElementById('data-signal-nodes-fetch');

// --- PATH IDs CHO FETCH (Lấy từ SVG bạn cung cấp) ---
const PC_TO_IMEM_PATH_ID = "pc-to-instruction-memory-path";

const FETCH_ANIMATION_DURATION = 3; // giây (cho PC -> Mem)

// --- PC State ---
const INITIALIZED_VALUE_PC = 15;
let currentPC = INITIALIZED_VALUE_PC; // Initial PC value
const PC_INCREMENT = 4;

function updatePCDisplay(value) { // Nhận giá trị để hiển thị
	// *** GIẢ ĐỊNH: ID của text hiển thị PC là "pc-value-text" ***
	const pcTextElement = document.getElementById('pc-value-text');
	if (pcTextElement) {
		// Hiển thị dưới dạng Hex 8 chữ số (cho địa chỉ 32-bit)
		const hexValue = value.toString(16).toUpperCase().padStart(8, '0');
		pcTextElement.textContent = `0x${hexValue}`;
	} else {
		console.warn("PC display element ('pc-value-text') not found.");
	}
}

export function trigger(parsedInstruction) {
	animatePCToMemory(0, parsedInstruction);
	animatePCToAddALU(0);
	console.log("--- Processing Complete for Instruction ---");
}

function animatePCToAddALU(pcValue) {
	const onEndCallback = () => {
		const tmp = pcValue + 4;
		dataSignalNodesFetchGroup.appendChild(createNodeWithAnimation({
			value: `0x${tmp.toString(16).toUpperCase().padStart(8, '0')}`,
			fieldName: "PC_Increase",
			onEndCallback: null,
			pathId: "ALU-add-0-to-mux-0-0-path",
			FETCH_ANIMATION_DURATION:  FETCH_ANIMATION_DURATION + 10
		}));
		startDataSignalAnimation(dataSignalNodesFetchGroup);
	};

	dataSignalNodesFetchGroup.appendChild(createNodeWithAnimation({
		value: `0x${(4).toString(16).toUpperCase().padStart(8, '0')}`,
		fieldName: "Const-To-Add-Value",
		onEndCallback: onEndCallback,
		pathId: "const-4-to-ALU-add-0-path",
		FETCH_ANIMATION_DURATION:  FETCH_ANIMATION_DURATION
	}));

	dataSignalNodesFetchGroup.appendChild(createNodeWithAnimation({
		value: `0x${pcValue.toString(16).toUpperCase().padStart(8, '0')}`,
		fieldName: "PC-To-Add-Value",
		onEndCallback: onEndCallback,
		pathId: "pc-to-ALU-add-0-path",
		FETCH_ANIMATION_DURATION:  FETCH_ANIMATION_DURATION
	}));
	startDataSignalAnimation(dataSignalNodesFetchGroup);
}

/**
 * Tạo và bắt đầu animation cho PC đi đến Instruction Memory
 */
function animatePCToMemory(pcValue, pcFetchCallback) {
	const hexValue = `0x${pcValue.toString(16).toUpperCase().padStart(8, '0')}`;

	dataSignalNodesGroup.appendChild(createNodeWithAnimation({
		value: hexValue,
		fieldName: "PC_Addr",
		onEndCallback: pcFetchCallback,
		pathId: PC_TO_IMEM_PATH_ID,
		FETCH_ANIMATION_DURATION:  FETCH_ANIMATION_DURATION
	}));
	startDataSignalAnimation(dataSignalNodesGroup);
}
