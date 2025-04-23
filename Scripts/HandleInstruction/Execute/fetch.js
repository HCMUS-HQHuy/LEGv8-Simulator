import * as handleSignal from "../signal.js"
import {encodeLegv8Instruction} from "../Compile/parser.js"

// --- PC State ---
const INITIALIZED_VALUE_PC = 15;
let currentPC = INITIALIZED_VALUE_PC; // Initial PC value
const PC_INCREMENT = 4;

/**
 * Updates the PC value displayed in the SVG.
 */
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
	
	// --- Định nghĩa callback sẽ chạy KHI PC đến Instruction Memory ---
	const pcFetchCallback = () => {
		console.log("--- PC animation finished, creating and starting Data Signals (incl. Opcode) ---");

		// 2.1 Mã hóa lại hoặc lấy mã máy đã lưu
		const encodedInstructionForData = encodeLegv8Instruction(parsedInstruction);
			if(!encodedInstructionForData || encodedInstructionForData.error){
				console.error("Cannot proceed without encoded instruction.");
				return;
			}


		// 2.2 Hiển thị Data Signals Nodes (ẩn) - Bao gồm cả Opcode
		handleSignal.displayDataSignalNodes(parsedInstruction, encodedInstructionForData);

		// 2.3 Tìm animation của Opcode để gắn callback xử lý control signals
		const opcodeFieldName = `Op [31-21]`; // Phải khớp với tên dùng trong createDataNodeElement
		const opcodeAnimId = `data-anim-${opcodeFieldName.replace(/\[|\]|-/g, '_')}`;
		const opcodeAnimation = document.getElementById(opcodeAnimId);

		if (opcodeAnimation) {
			// Gắn listener một lần duy nhất để tránh gọi lại nhiều lần nếu có lỗi
			// opcodeAnimation.addEventListener('endEvent', null, { once: true });
			console.log(`Attached end event listener to Opcode animation (${opcodeAnimId})`);
		} else {
			console.error(`Could not find Opcode animation element with ID: ${opcodeAnimId}. Control signals will not be triggered.`);
			// Có thể gọi opcodeArrivalCallback ngay lập tức ở đây nếu muốn mô phỏng zero-delay?
			// opcodeArrivalCallback();
		}

		// 2.4 Bắt đầu TẤT CẢ animation cho Data Signals (Opcode, Rn, Rm...)
		handleSignal.startDataSignalAnimation();
	};
	// --- Kết thúc định nghĩa pcFetchCallback ---

	// 2. Tạo Animation cho PC đi đến Mem Addr và TRUYỀN CALLBACK vào
	handleSignal.animatePCToMemory(0, pcFetchCallback);

	console.log("--- Processing Complete for Instruction ---");
}