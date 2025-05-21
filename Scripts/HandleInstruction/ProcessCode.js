import * as currentInstruction from "./Compile/currentInstruction.js"
import * as formatCode from "./Compile/formatCode.js"

import * as generateSignal from "./InstructionCycle/generateSignal.js"
import {state, switchIcon} from "./InstructionCycle/animationSpeed.js"
import { logParsingResults, validateParsedResults } from "../HandleOutLook/logBox.js"

function compileCode() {
	const results = formatCode.getResult();
	if (results == null) {
		console.error("formatcode: Have some problem!");
		return;
	}
	logParsingResults(results);
	return results;
}

async function execute(results) {
    if (validateParsedResults(results, "log-box") != true)
		return;
	switchIcon();
	const Components = generateSignal.initialize(results);
	console.log("---------------START----------------");
	state.executing = true;
	let instructionPos = 0;
	while (state.executing) {
		currentInstruction.update(instructionPos, results[instructionPos]);
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
	document.getElementById('compile-btn').addEventListener('click', function(event) {
        event.preventDefault();
		results = compileCode();
	});
	document.getElementById('start-stop-animation').addEventListener('click', function(event) {
		event.preventDefault();
		if (state.executing === false) {
			execute(results);
		} else switchIcon();
	});
}