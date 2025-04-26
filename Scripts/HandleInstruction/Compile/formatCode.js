import {parseLegv8Instruction} from "./parser.js"


export function getResult() {
	const instructionTextarea = document.getElementById('instructionCode');
	const allCode = instructionTextarea.value;
	const codeLines = allCode.split(/\r?\n/);
	let results = [], i = -1;
	while (i + 1 < codeLines.length) {
		i++;
		
		let firstLineIndex = -1;
		let firstInstructionLine = null;
		// --- Tìm dòng lệnh đầu tiên hợp lệ ---
		for (; i < codeLines.length; i++) {
			const trimmedLine = codeLines[i].trim();
			if (trimmedLine && !trimmedLine.startsWith('//') && !trimmedLine.startsWith(';')) {
				firstInstructionLine = trimmedLine;
				firstLineIndex = i;
				break;
			}
		}

		if (firstInstructionLine === null) { 
			break;
		}
		console.log(`Line ${firstLineIndex + 1}: "${firstInstructionLine}"`);
	
		const parsedInstruction = parseLegv8Instruction(firstInstructionLine);
		if (!parsedInstruction || parsedInstruction.error) {
			console.error(`Error parsing line ${firstLineIndex + 1}: ${parsedInstruction?.error || 'Parser returned null'}`);
			return null;
		}
		results.push({ lineNumber: firstLineIndex + 1, assemblyInstruction: firstInstructionLine, parsed: parsedInstruction });
		console.log(`Parsed Line ${firstLineIndex + 1}:`, parsedInstruction);
	}
	return results;
}