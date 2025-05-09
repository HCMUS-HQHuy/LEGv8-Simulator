import {encodeLegv8Instruction} from "./parser.js"

const assemblyInstruction = document.getElementById('assembly-instruction');
const machineLangugageInstruction = document.getElementById('machine-language-instruction');


export function update(line) {
	if (line == null) {
		console.warn("line code in update CurentInstruction is null");
		return;
	}
	assemblyInstruction.innerHTML = line.assemblyInstruction;
	machineLangugageInstruction.innerHTML = encodeLegv8Instruction(line.parsed);
}