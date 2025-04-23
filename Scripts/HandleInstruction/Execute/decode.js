import * as handleSignal from "../signal.js"

export function trigger() {
	
	// 1. Dọn dẹp tín hiệu từ chu kỳ trước
	handleSignal.clearAllDisplaysAndSignals();

		// --- Định nghĩa callback sẽ chạy KHI OPCODE đến Control Unit ---
	const opcodeArrivalCallback = () => {
		console.log("--- Opcode animation finished, generating and starting Control Signals ---");

		// 3.1 Tính toán Control Signals
		const controlSignals = handleSignal.generateControlSignals(parsedInstruction);

		// 3.2 Hiển thị Control Signals Nodes (ẩn)
		if (controlSignals) {
			handleSignal.displayControlSignalNodes(controlSignals); // Hàm này giờ chỉ tạo node ẩn
		} else {
				console.warn(`No control signals generated.`);
				handleSignal.displayControlSignalNodes(null); // Xóa node cũ nếu có
		}

		// 3.3 Bắt đầu animation cho Control Signals
		handleSignal.startControlSignalAnimation();
	};
	// --- Kết thúc định nghĩa opcodeArrivalCallback ---


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
			opcodeAnimation.addEventListener('endEvent', opcodeArrivalCallback, { once: true });
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
	handleSignal.animatePCToMemory(pcValueForFetch, pcFetchCallback);

	console.log("--- Processing Complete for Instruction ---");
	// Display the results in the output area
	// parsedOutput.textContent = JSON.stringify(results, null, 2); // Pretty-print JSON output
}