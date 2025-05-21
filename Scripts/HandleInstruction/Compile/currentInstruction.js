import {encodeLegv8Instruction} from "./parser.js"

const assemblyInstruction = document.getElementById('assembly-instruction');
const machineLangugageInstruction = document.getElementById('machine-language-instruction');

export function update(index, line) {
	updateHighlight(index)
	if (line == null) {
		console.warn("line code in update CurentInstruction is null");
		return;
	}
	assemblyInstruction.innerHTML = line.assemblyInstruction;
	machineLangugageInstruction.innerHTML = encodeLegv8Instruction(line.parsed);
}
let prevIndex = -1
function updateHighlight(nextLineIndex) {
	let tmp = document.getElementById(`lineId${prevIndex}`);
	if (tmp) tmp.style.color = `var(--line-number-color)`;
	tmp = document.getElementById(`lineId${nextLineIndex}`);
	if (tmp){
		tmp.style.color = `red`;
		prevIndex = nextLineIndex;
	} else prevIndex = -1;
	console.warn(prevIndex);
};