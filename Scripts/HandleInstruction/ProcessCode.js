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

let stepByStepMode = 0;
let instructionPos = -1;
let Components = null;

async function execute(results) {
    if (validateParsedResults(results, "log-box") != true)
		return;
	
	state.executing = true;

	if (instructionPos === -1) {
		Components = generateSignal.initialize(results);
		instructionPos = 0;
	}

	while (state.executing) {
		console.log(`instructionPos: ${instructionPos}`);
		currentInstruction.update(instructionPos, results[instructionPos]);
		instructionPos = await new Promise((promise) => {
			generateSignal.start(Components, promise); // This triggers the signal generation
		});
		if (instructionPos === -1 || stepByStepMode === 1) {
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
	document.getElementById('start-stop-animation').addEventListener('click', function(event) {
		event.preventDefault();
		if (state.executing === false) {
			execute(results);
		}
	});

	document.getElementById('step-by-step-mode-button').addEventListener('click', function(event) {
		event.preventDefault();
		stepByStepMode ^= 1;
		if (stepByStepMode) {
			document.getElementById('step-by-step-mode-button').style.setProperty('background-color', 'var(--button-hover-bg-color)');
			document.getElementById('step-by-step-mode-button').style.setProperty('color', 'var(--button-hover-text-color)');
		}
		else {
			document.getElementById('step-by-step-mode-button').style.setProperty('background-color', 'var(--button-bg-color)');
			document.getElementById('step-by-step-mode-button').style.setProperty('color', 'var(--button-text-color)');
		}
	});
}