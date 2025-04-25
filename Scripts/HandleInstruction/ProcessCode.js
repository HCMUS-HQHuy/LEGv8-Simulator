import * as parsedOutputTable from "./Compile/parsedOutputTable.js"
import * as currentInstruction from "./Compile/currentInstruction.js"
import * as animate from "./InstructionCycle/animation.js"
import * as formatCode from "./Compile/formatCode.js"
import * as fetch from "./InstructionCycle/fetch.js"
import * as decode from "./InstructionCycle/decode.js"
import * as execute from "./InstructionCycle/execute.js"
import * as run from "./Compile/processState.js"


function processCode() {
	const results = formatCode.getResult();
	if (results == null) {
		console.error("formatcode: Have some problem!");
		return;
	}
	parsedOutputTable.update(results);
	currentInstruction.update(results[0]);

	const parsedInstruction = results[0].parsed;
	const state = run.generateState(parsedInstruction);
	fetch.trigger(state, decode.trigger(state, execute.trigger(state)));

	const intervalId = setInterval(() => {
		if (animate.startSignalAnimation() == false) {
			clearInterval(intervalId); // dừng interval
		}
	}, 2050);
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

