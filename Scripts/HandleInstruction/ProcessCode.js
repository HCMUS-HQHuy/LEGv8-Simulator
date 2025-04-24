import * as parsedOutputTable from "./Compile/parsedOutputTable.js"
import * as currentInstruction from "./Compile/currentInstruction.js"
import * as formatCode from "./Compile/formatCode.js"
import * as fetch from "./InstructionCycle/fetch.js"
import * as decode from "./InstructionCycle/decode.js"
import * as execute from "./InstructionCycle/execute.js"


function processCode() {
	const results = formatCode.getResult();
	if (results == null) {
		console.error("formatcode: Have some problem!");
		return;
	}
	parsedOutputTable.update(results);
	

	currentInstruction.update(results[0]);
	const parsedInstruction = results[0].parsed;
	fetch.trigger(decode.trigger(parsedInstruction, execute.trigger(parsedInstruction)));
}

export function trigger() {
	codeForm.addEventListener('submit', function(event) {
        event.preventDefault();
		processCode();		
	});

	const restartButton = document.getElementById('start-animation');
	restartButton.addEventListener('click', function(event) {
		event.preventDefault();
		processCode();	
	});
}

