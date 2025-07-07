import {encodeLegv8Instruction} from "./parser.js"

const assemblyInstruction = document.getElementById('assembly-instruction');
const machineLangugageInstruction = document.getElementById('machine-language-instruction');

export function update(line) {
	if (line == null) {
        console.warn("line code in update CurentInstruction is null");
		assemblyInstruction.innerText = "";
		machineLangugageInstruction.innerText = "";
		return;
	}
    if (Number.isInteger(line)) {
        assemblyInstruction.innerText = "Assembly Instruction";
	    machineLangugageInstruction.innerText = "Machine Language Instruction";
        updateHighlight(line+1);
        return;
    }
    updateHighlight(line.lineNumber)
	assemblyInstruction.innerText = line.parsed.instruction;
	machineLangugageInstruction.innerText = encodeLegv8Instruction(line.parsed, (line.instructionIndex - 1) << 2);
}

let prevLineNumber = -1;
function updateHighlight(currentLineNumber) {
	const prevElement = document.getElementById(`lineId${prevLineNumber}`);
    if (prevElement) {
        prevElement.innerHTML = `${prevLineNumber} `; //   là một khoảng trắng mỏng
        prevElement.style.color = ''; // Dùng '' để reset về CSS mặc định
        prevElement.style.fontWeight = 'normal';
    }

	const nextElement = document.getElementById(`lineId${currentLineNumber}`);
    if (nextElement) {
        nextElement.innerHTML = `>${currentLineNumber}<`; // Dùng > < để bao quanh
        nextElement.style.color = 'red';
        nextElement.style.fontWeight = 'bold';
        prevLineNumber = currentLineNumber;
    } else {
        prevLineNumber = -1;
    }
};