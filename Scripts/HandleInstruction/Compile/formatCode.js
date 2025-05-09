import {parseLegv8Instruction, buildLabelTable} from "./parser.js"


export function getResult() {
	const instructionTextarea = document.getElementById('instructionCode');
	const codeLines = instructionTextarea.value.split(/\r?\n/);

	const labelTable = buildLabelTable(codeLines);
	const results = [];

	for (let i = 0; i < codeLines.length; i++) {
		const trimmedLine = codeLines[i].replace(/(\/\/|;).*/, '').trim();

		// Bỏ qua dòng trống hoặc comment
		if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith(';')) {
			continue;
		}

		// Kiểm tra xem dòng này có định nghĩa nhãn và lệnh trên cùng dòng không
		const labelMatch = trimmedLine.match(/^([a-zA-Z_][a-zA-Z0-9_]*):(.*)$/);
		let instructionPart = trimmedLine;
	
		if (labelMatch) {
			instructionPart = labelMatch[2].trim(); // Lấy phần lệnh sau nhãn
			if (!instructionPart) { // Nếu chỉ có nhãn trên dòng này
				// console.log(`Line ${i+1} is label only: ${labelMatch[1]}`);
				continue; // Bỏ qua, nhãn đã được xử lý
			}
		}
		

		const parsedInstruction = parseLegv8Instruction(instructionPart, labelTable);

		if (!parsedInstruction || parsedInstruction.error) {
			console.error(`Error parsing line ${i + 1}: ${parsedInstruction?.error || 'Parser returned null'}`);
			return null;
		}

		results.push({
			lineNumber: i + 1,
			assemblyInstruction: instructionPart,
			parsed: parsedInstruction
		});

		console.log(`Line ${i + 1}: "${instructionPart}"`);
		console.log(`Parsed Line ${i + 1}:`, parsedInstruction);
	}

	return results;
}