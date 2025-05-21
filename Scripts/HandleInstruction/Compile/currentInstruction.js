import {encodeLegv8Instruction} from "./parser.js"

const assemblyInstruction = document.getElementById('assembly-instruction');
const machineLangugageInstruction = document.getElementById('machine-language-instruction');

export function update(index, line) {
	updateHighlight(index)
	if (line == null) {
		console.warn("line code in update CurentInstruction is null");
		assemblyInstruction.innerText = "";
		machineLangugageInstruction.innerText = "";
		return;
	}
	assemblyInstruction.innerText = line.assemblyInstruction;
	machineLangugageInstruction.innerText = encodeLegv8Instruction(line.parsed);
}
let prevIndex = -1
function updateHighlight(nextLineIndex) {
	let tmp = document.getElementById(`lineId${prevIndex}`);
	if (tmp) {
		tmp.innerText = `${prevIndex}`
		tmp.style.color = `var(--line-number-color)`;
	}
	tmp = document.getElementById(`lineId${nextLineIndex + 1}`);
	if (tmp){
		tmp.innerText = `▶${nextLineIndex + 1}`
		tmp.style.color = `red`;
		prevIndex = nextLineIndex + 1;
	} else prevIndex = -1;
};