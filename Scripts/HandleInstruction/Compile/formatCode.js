import {parseLegv8Instruction} from "./parser.js"


export function getResult() {
	const instructionTextarea = document.getElementById('instructionCode');
	const allCode = instructionTextarea.value;
	const codeLines = allCode.split(/\r?\n/);
	let firstInstructionLine = null;
	let firstLineIndex = -1;

	// --- Tìm dòng lệnh đầu tiên hợp lệ ---
	for (let i = 0; i < codeLines.length; i++) {
		const trimmedLine = codeLines[i].trim();
		if (trimmedLine && !trimmedLine.startsWith('//') && !trimmedLine.startsWith(';')) {
			firstInstructionLine = trimmedLine;
			firstLineIndex = i;
			break;
		}
	}

	if (firstInstructionLine === null) { 
		console.warn("FirstInstructionLine is null"); 
		return null;
	}

	// --- LẤY GIÁ TRỊ PC HIỆN TẠI TRƯỚC KHI TĂNG ---
	console.log(`Line ${firstLineIndex + 1}: "${firstInstructionLine}"`);

	// --- PARSE LỆNH ---
	const parsedInstruction = parseLegv8Instruction(firstInstructionLine);
	let results = [];
	if (!parsedInstruction || parsedInstruction.error) {
		console.error(`Error parsing line ${firstLineIndex + 1}: ${parsedInstruction?.error || 'Parser returned null'}`);
		// Dọn dẹp nếu lỗi parse
		handleSignal.displayControlSignalNodes(null);
		handleSignal.displayDataSignalNodes(null); // Gọi hàm dọn dẹp data nodes
		return null;
	}
	results.push({ lineNumber: firstLineIndex + 1, assemblyInstruction: firstInstructionLine, parsed: parsedInstruction });
	console.log(`Parsed Line ${firstLineIndex + 1}:`, parsedInstruction);
	return results;
}