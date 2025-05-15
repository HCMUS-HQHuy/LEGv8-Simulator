import * as currentInstruction from "./Compile/currentInstruction.js"
import * as formatCode from "./Compile/formatCode.js"

import * as generateSignal from "./InstructionCycle/generateSignal.js"
import {state} from "./InstructionCycle/animationSpeed.js"

function compileCode() {
	const results = formatCode.getResult();
	if (results == null) {
		console.error("formatcode: Have some problem!");
		return;
	}
	return results;
}

async function execute(results) {
	if (results == null) {
		console.warn("formatcode: Have some problem!");
		return;
	}
	const Components = generateSignal.initialize(results);
	console.log("---------------START----------------");
	state.executing = true;
	let instructionPos = 0;
	while (state.executing) {
		currentInstruction.update(results[instructionPos]);
		instructionPos = await new Promise((promise) => {
			generateSignal.start(Components, promise); // This triggers the signal generation
		});
		if (instructionPos === -1)
			state.executing = false;
	}
	console.log("---------------END----------------");
}

export function trigger() {
	let results = null;
	document.getElementById('parseInstructions').addEventListener('click', function(event) {
        event.preventDefault();
		results = compileCode();
	});
	
	document.getElementById('compile-btn').addEventListener('click', function(event) {
        event.preventDefault();
		results = compileCode();
	});
	console.log(state);
	document.getElementById('start-stop-animation').addEventListener('click', function(event) {
		event.preventDefault();
		if (state.executing === false)
			execute(results);
	});
	
	document.getElementById('execute').addEventListener('click', function(event) {
		event.preventDefault();
		if (state.executing === false)
			execute(results);
	});
}