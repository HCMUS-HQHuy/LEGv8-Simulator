import {encodeLegv8Instruction, parseLegv8Instruction} from "./parsecode.js"
import * as handleSignal from "./signal.js"

export function trigger() {
	// Get references to the form and the output area
	const codeForm = document.getElementById('codeForm');
	const instructionTextarea = document.getElementById('instructionCode');

	// Add an event listener for the 'submit' event on the form
	codeForm.addEventListener('submit', function(event) {
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

			const parsedInstruction = parseLegv8Instruction(trimmedLine);
			if (parsedInstruction) {
				results.push({ lineNumber: index + 1, parsed: parsedInstruction });
				console.log(`Parsed Line ${index + 1}:`, parsedInstruction);
			} else {
				console.log(`Line ${index + 1}: Parser returned null/undefined`);
			}

			// 2. Tạo tín hiệu điều khiển
			const controlSignals = handleSignal.generateControlSignals(parsedInstruction);
			
			// 3. Tạo và hiển thị các node tín hiệu trên SVG
			handleSignal.displayControlSignalNodes(controlSignals);

			// 4. Bắt đầu animation
			// Có thể thêm độ trễ nhỏ để đảm bảo SVG được cập nhật
			setTimeout(handleSignal.startControlSignalAnimation, 100); // Trễ 100ms

			// 2. Gọi hàm mã hóa
			const encodedAdd = encodeLegv8Instruction(parsedInstruction);
			// 3. In kết quả
			console.log(`Instruction: ADD X9, X20, X21`);
			if (encodedAdd.error) {
				console.error("Encoding Error:", encodedAdd.error);
			} else {
				console.log("Decimal Fields : 1112 21 0 20 9"); // From example text
				console.log("Binary Fields  :", "10001011000", "10101", "000000", "10100", "01001"); // From example text
				console.log("Encoded Binary :", encodedAdd);
				// Thêm khoảng trắng để dễ so sánh với ví dụ
				const formattedBinary = `${encodedAdd.substring(0, 11)} ${encodedAdd.substring(11, 16)} ${encodedAdd.substring(16, 22)} ${encodedAdd.substring(22, 27)} ${encodedAdd.substring(27, 32)}`;
				console.log("Formatted Binary:", formattedBinary);
			}
		});
		console.log("--- Processing Complete ---");

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
