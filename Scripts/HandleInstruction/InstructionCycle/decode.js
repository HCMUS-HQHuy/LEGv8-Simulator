import {startSignalAnimation, createNodeWithAnimation} from "./animation.js"

const dataSignalNodesGroup = document.getElementById('data-signal-nodes');

// Path cho các trường cụ thể (lấy từ SVG)
const IMEM_OPCODE_TO_CONTROL_PATH_ID = "instruction-memory-to-control-path";
const IMEM_RN_TO_REG_PATH_ID = "instruction-memory-to-read-register-1-path"; // Instruction [9-5]
const IMEM_RM_TO_REG_PATH_ID = "instruction-memory-to-mux-1-0-path"; // Instruction [20-16]
const IMEM_RT_TO_REG_PATH_ID = "instruction-memory-to-mux-1-1-path"; // Dùng tạm path này, bạn cần path đúng đến Reg2 (cho load/store/CBZ)
const IMEM_RD_TO_REG_PATH_ID = "instruction-memory-to-write-register-path"; // Instruction [4-0]
const IMEM_IMM_TO_SIGN_EXTEND_PATH_ID = "instruction-memory-to-sign-extend-path"; // Cần điều chỉnh
const IMEM_BRANCH_ADDR_TO_SHIFT_PATH_ID = "instruction-memory-to-alu-control-path"; // Dùng tạm path này, bạn cần path đến shift left 2
const IMEM_FUNC_TO_ALU_CONTROL_PATH_ID = "instruction-memory-to-alu-control-path"; // Chưa hiểu đoạn này.

const DEFAULT_ANIMATION_DURATION = 2; // giây

export function trigger(instruction, opcodeArrivalCallback) {
	return () => {
		console.log("--- PC animation finished, creating and starting Data Signals (incl. Opcode) ---");
		displayDataSignalNodes(instruction, opcodeArrivalCallback);
		startSignalAnimation(dataSignalNodesGroup);
	};
}

/**
 * Hiển thị data signal nodes
 * @param {object} parsedInstruction - Lệnh đã parse.
 * @param {string} encodedInstruction - Mã máy 32-bit.
 * @param {boolean} [startNow=true] - Có bắt đầu animation ngay không.
 */
function displayDataSignalNodes(instruction, opcodeArrivalCallback) {
	dataSignalNodesGroup.appendChild(createNodeWithAnimation({
		value: instruction.Instruction31_21, 
		fieldName: `Op31-21`,
		onEndCallback: [opcodeArrivalCallback],
		pathId: IMEM_OPCODE_TO_CONTROL_PATH_ID,
		duration: DEFAULT_ANIMATION_DURATION, 
		className: 'parsed-node',
		shapeType: 'rect'
	}));

	dataSignalNodesGroup.appendChild(createNodeWithAnimation({
		value: instruction.Instruction09_05, 
		fieldName: `Rn9-5`,
		onEndCallback: [()=>{document.getElementById('read1').textContent = instruction.Instruction09_05}],
		pathId: IMEM_RN_TO_REG_PATH_ID,
		duration: DEFAULT_ANIMATION_DURATION, 
		className: 'parsed-node',
		shapeType: 'rect'
	}));
    
	dataSignalNodesGroup.appendChild(createNodeWithAnimation({
		value: instruction.Instruction20_16, 
		fieldName: `Rm20-16-to-mux0`,
		onEndCallback: [()=>{document.getElementById('mux-1-0').textContent = instruction.Instruction20_16}],
		pathId: IMEM_RM_TO_REG_PATH_ID,
		duration: DEFAULT_ANIMATION_DURATION, 
		className: 'parsed-node',
		shapeType: 'rect'
	}));
	dataSignalNodesGroup.appendChild(createNodeWithAnimation({
		value: instruction.Instruction04_00, 
		fieldName: `Rd4-0-to-write-reg`,
		onEndCallback: [()=>{document.getElementById('write-reg').textContent = instruction.Instruction04_00}],
		pathId: IMEM_RD_TO_REG_PATH_ID,
		duration: DEFAULT_ANIMATION_DURATION, 
		className: 'parsed-node',
		shapeType: 'rect'
	}));

	dataSignalNodesGroup.appendChild(createNodeWithAnimation({
		value: instruction.Instruction04_00, 
		fieldName: `Rd4-0-to-mux1`, // to mux
		onEndCallback: [()=>{document.getElementById('mux-1-1').textContent = instruction.Instruction04_00}],
		pathId: IMEM_RT_TO_REG_PATH_ID,
		duration: DEFAULT_ANIMATION_DURATION, 
		className: 'parsed-node',
		shapeType: 'rect'
	}));

	dataSignalNodesGroup.appendChild(createNodeWithAnimation({
		value: instruction.Instruction31_21, 
		fieldName: `ALUOp`,
		onEndCallback: null,
		pathId: IMEM_FUNC_TO_ALU_CONTROL_PATH_ID,
		duration: DEFAULT_ANIMATION_DURATION, 
		className: 'parsed-node',
		shapeType: 'rect'
	}));

    console.log("Data signal nodes created.");
}
