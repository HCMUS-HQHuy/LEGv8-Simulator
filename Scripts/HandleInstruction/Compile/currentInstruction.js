import {encodeLegv8Instruction} from "./parser.js"

const assemblyInstruction = document.getElementById('assembly-instruction');
const machineLangugageInstruction = document.getElementById('machine-language-instruction');


export function update(line) {
	assemblyInstruction.innerHTML = line.assemblyInstruction;
	machineLangugageInstruction.innerHTML = encodeLegv8Instruction(line.parsed);
}