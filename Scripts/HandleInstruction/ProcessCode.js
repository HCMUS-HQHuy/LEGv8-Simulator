import * as currentInstruction from "./Compile/currentInstruction.js"
import * as formatCode from "./Compile/formatCode.js"

import * as generateSignal from "./InstructionCycle/generateSignal.js"
import {state} from "./InstructionCycle/animationSpeed.js"
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

let instructionPos = -1;
let Components = null;
let isFinish = true;

async function execute(results) {
    if (validateParsedResults(results, "log-box") != true) {
		state.executing = false;
		return;
	}
	if (instructionPos === -1) {
		Components = generateSignal.initialize(results);
		instructionPos = 0;
	}

	isFinish = false;
	while (isFinish === false) {
		console.log(`instructionPos: ${instructionPos}`);
		currentInstruction.update(instructionPos, results[instructionPos]);
		instructionPos = await generateSignal.start(Components); // This triggers the signal generation
		if (instructionPos === -1 || state.stepByStepMode === 1) {
			isFinish = true;
			state.executing = false;
		}
		
	}
}

export function trigger() {
	let results = null;
	document.getElementById('compile-btn').addEventListener('click', function(event) {
        event.preventDefault();
		results = compileCode();
	});
	state.executing = false;
	document.getElementById('start-stop-animation').addEventListener('click', function(event) {
		event.preventDefault();
		if (state.executing === true) 
			state.executing = false;
		else state.executing = true;

		if (isFinish === true) {
			execute(results);
		}
	});
	
	// state.executing = true;
	// results = compileCode();
	// execute(results);
}