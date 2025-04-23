import {startDataSignalAnimation, createNodeWithAnimation} from "./animation.js"
import { encodeLegv8Instruction } from "../Compile/parser.js";

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

export function trigger(parsedInstruction, opcodeArrivalCallback = null) {

	if (!dataSignalNodesGroup) {
        console.warn("dataSignalNodesGroup is null!");
        return;
    }

	console.log("--- PC animation finished, creating and starting Data Signals (incl. Opcode) ---");
	const encodedInstructionForData = encodeLegv8Instruction(parsedInstruction);
	if(!encodedInstructionForData || encodedInstructionForData.error){
		console.error("Cannot proceed without encoded instruction.");
		return;
	}


	// 2.2 Hiển thị Data Signals Nodes (ẩn) - Bao gồm cả Opcode
	displayDataSignalNodes(parsedInstruction, encodedInstructionForData);

	// 2.3 Tìm animation của Opcode để gắn callback xử lý control signals
	const opcodeFieldName = `Op [31-21]`; // Phải khớp với tên dùng trong createDataNodeElement
	const opcodeAnimId = `data-anim-${opcodeFieldName.replace(/\[|\]|-/g, '_')}`;
	const opcodeAnimation = document.getElementById(opcodeAnimId);

	if (opcodeAnimation) {
		// Gắn listener một lần duy nhất để tránh gọi lại nhiều lần nếu có lỗi
		opcodeAnimation.addEventListener('endEvent', opcodeArrivalCallback, { once: true });
		console.log(`Attached end event listener to Opcode animation (${opcodeAnimId})`);
	} else {
		console.error(`Could not find Opcode animation element with ID: ${opcodeAnimId}. Control signals will not be triggered.`);
	}
	startDataSignalAnimation(dataSignalNodesGroup);
}


/**
 * Hiển thị data signal nodes
 * @param {object} parsedInstruction - Lệnh đã parse.
 * @param {string} encodedInstruction - Mã máy 32-bit.
 * @param {boolean} [startNow=true] - Có bắt đầu animation ngay không.
 */
function displayDataSignalNodes(parsedInstruction, encodedInstruction) {

    if (!parsedInstruction || parsedInstruction.error || !encodedInstruction) {
        console.log("No valid instruction/encoding to display data signals.");
		while (dataSignalNodesGroup.firstChild) dataSignalNodesGroup.removeChild(dataSignalNodesGroup.firstChild);
        return;
     }

    // --- Tách các trường từ mã máy 32-bit ---
    // Thứ tự bit theo LEGv8/ARMv8 thường là từ phải sang trái (LSB là bit 0)
    const opcode = encodedInstruction.substring(0, 11); // Bit 31-21 (11 bits)
    const rm     = encodedInstruction.substring(11, 16); // Bit 20-16 (5 bits) - Thường là Rm hoặc Rt
    const shamt  = encodedInstruction.substring(16, 22); // Bit 15-10 (6 bits)
    const rn     = encodedInstruction.substring(22, 27); // Bit 9-5  (5 bits) - Thường là Rn
    const rd     = encodedInstruction.substring(27, 32); // Bit 4-0  (5 bits) - Thường là Rd hoặc Rt

    console.log("Creating data signal nodes for:", parsedInstruction.mnemonic);

    // --- Tạo node cho các trường dựa trên đường dẫn đã định nghĩa ---
    // Gửi Opcode/phần đầu đến Control Unit

	dataSignalNodesGroup.appendChild(createNodeWithAnimation({
		value: opcode, 
		fieldName: `Op [31-21]`,
		onEndCallback: null,
		pathId: IMEM_OPCODE_TO_CONTROL_PATH_ID,
		FETCH_ANIMATION_DURATION: DEFAULT_ANIMATION_DURATION
	}));

    // Gửi Rn đến cổng đọc Register 1
    if (parsedInstruction.type === 'R' || parsedInstruction.type === 'D' || parsedInstruction.type === 'I') { // Rn dùng trong R, D, I
		dataSignalNodesGroup.appendChild(createNodeWithAnimation({
			value: rn, 
			fieldName: `Rn [9-5]`,
			onEndCallback: null,
			pathId: IMEM_RN_TO_REG_PATH_ID,
			FETCH_ANIMATION_DURATION: DEFAULT_ANIMATION_DURATION
		}));
    }
    // Gửi Rm đến cổng đọc Register 2 (cho R-type)
    if (IMEM_RM_TO_REG_PATH_ID && parsedInstruction.type === 'R') {
		dataSignalNodesGroup.appendChild(createNodeWithAnimation({
			value: rm, 
			fieldName: `Rm [20-16]`,
			onEndCallback: null,
			pathId: IMEM_RM_TO_REG_PATH_ID,
			FETCH_ANIMATION_DURATION: DEFAULT_ANIMATION_DURATION
		}));
    }
    // Gửi Rd đến cổng Write Register (cho R-type, I-type, LDUR)
    if (parsedInstruction.type === 'R' || parsedInstruction.type === 'I' || parsedInstruction.mnemonic === 'LDUR') {
		dataSignalNodesGroup.appendChild(createNodeWithAnimation({
			value: rd, 
			fieldName: `Rd [4-0]`,
			onEndCallback: null,
			pathId: IMEM_RD_TO_REG_PATH_ID,
			FETCH_ANIMATION_DURATION: DEFAULT_ANIMATION_DURATION
		}));
    }
    // Gửi Function/shamt đến ALU Control (cho R-type)
     if (parsedInstruction.type === 'R') {
		dataSignalNodesGroup.appendChild(createNodeWithAnimation({
			value: shamt, 
			fieldName: `Func/Shamt`,
			onEndCallback: null,
			pathId: IMEM_FUNC_TO_ALU_CONTROL_PATH_ID,
			FETCH_ANIMATION_DURATION: DEFAULT_ANIMATION_DURATION
		}));

    }
    console.log("Data signal nodes created.");
}
