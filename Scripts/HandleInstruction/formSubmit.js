import {encodeLegv8Instruction, parseLegv8Instruction} from "./parsecode.js"
import * as handleSignal from "./signal.js"


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

export function trigger() {
	// Get references to the form and the output area
	const codeForm = document.getElementById('codeForm');
	const instructionTextarea = document.getElementById('instructionCode');

	updatePCDisplay(currentPC); // Hiển thị giá trị PC ban đầu

	// Add an event listener for the 'submit' event on the form
	codeForm.addEventListener('submit', function(event) {
		currentPC = INITIALIZED_VALUE_PC;
		updatePCDisplay(currentPC);

		event.preventDefault();
		const allCode = instructionTextarea.value;
		const codeLines = allCode.split(/\r?\n/);
		
		let results = []; // Array to hold parsed results

		// 3. Process each line
		console.log("--- Processing Input ---");
		codeLines.forEach((line, index) => {
			const trimmedLine = line.trim(); // Remove leading/trailing whitespace

			// Optional: Skip empty lines or comment lines
			if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith(';')) {
				console.log(`Line ${index + 1}: Skipped (empty or comment)`);
				return; // Move to the next line
			}
			console.log(`Line ${index + 1}: "${trimmedLine}"`);

			// --- LẤY GIÁ TRỊ PC HIỆN TẠI TRƯỚC KHI TĂNG ---
			const pcValueForFetch = currentPC;

			// --- TĂNG VÀ CẬP NHẬT PC DISPLAY ---
			currentPC += PC_INCREMENT;
			updatePCDisplay(currentPC); // Cập nhật hiển thị với giá trị MỚI
			console.log(`PC incremented to: 0x${currentPC.toString(16).toUpperCase().padStart(8,'0')}`);

			const parsedInstruction = parseLegv8Instruction(trimmedLine);
			if (parsedInstruction) {
				results.push({ lineNumber: index + 1, parsed: parsedInstruction });
				console.log(`Parsed Line ${index + 1}:`, parsedInstruction);
			} else {
				console.log(`Line ${index + 1}: Parser returned null/undefined`);
			}

			// 1. Dọn dẹp tín hiệu từ chu kỳ trước
			handleSignal.clearAllDisplaysAndSignals(); // Hàm mới để dọn dẹp tất cả

			// 2. Tạo Animation cho PC đi đến Mem Addr (NEW)
			handleSignal.animatePCToMemory(pcValueForFetch); 

			// 3. Tạo tín hiệu điều khiển
			const controlSignals = handleSignal.generateControlSignals(parsedInstruction);
			
			const fetchDelay = 1000; // Giả sử 1 giây để PC đến và memory đọc

			setTimeout(() => {
				console.log("--- Fetch complete, processing instruction fields and signals ---");
	
				// 4.1 Hiển thị Control Signals Nodes (KHÔNG BẮT ĐẦU ANIMATION VỘI)
				if (controlSignals) {
					handleSignal.displayControlSignalNodes(controlSignals, false); // Thêm cờ false để không tự bắt đầu
				} else {
					console.warn(`No control signals generated for line ${firstLineIndex + 1}.`);
					 handleSignal.displayControlSignalNodes(null, false); // Xóa node cũ
				}
	
				// 4.2 Hiển thị Data Signals Nodes (Lệnh và các phần) (KHÔNG BẮT ĐẦU ANIMATION VỘI)
				// Hàm displayDataSignalNodes cần mã máy 32-bit
				handleSignal.displayDataSignalNodes(parsedInstruction, encodeLegv8Instruction(parseLegv8Instruction), false); // Thêm mã máy và cờ false
	
				// 4.3 Bắt đầu đồng loạt các animation (Control và Data)
				handleSignal.startAllSignalAnimations(); // Hàm mới để bắt đầu cả control và data
	
			}, fetchDelay);

			console.log("--- Processing Complete for Instruction ---");
		});

		// Display the results in the output area
		// parsedOutput.textContent = JSON.stringify(results, null, 2); // Pretty-print JSON output
		updateParsedOutputTable(results);
	});
}

function updateParsedOutputTable(data) {
	const tbody = document.getElementById("parsedOutputTable");
	if (tbody == null) console.log("[WARNING] tbody is null");
	tbody.innerHTML = ""; // Clear previous

	data.forEach(entry => {
		const { lineNumber, parsed } = entry;
		const { mnemonic, type, structuredOperands = {}, error } = parsed || {};
		const { Rd = "", Rn = "", Rm = "" } = structuredOperands;

		const row = document.createElement("tr");
		row.innerHTML = `
		<td>${lineNumber}</td>
		<td>${mnemonic || ""}</td>
		<td>${type || ""}</td>
		<td>${Rd}</td>
		<td>${Rn}</td>
		<td>${Rm}</td>
		<td>${error || ""}</td>
		`;
		tbody.appendChild(row);
	});
}
