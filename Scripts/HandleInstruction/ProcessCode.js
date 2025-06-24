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
let ComponentsBackup = null;
let isFinish = true;

async function execute(results) {
    if (validateParsedResults(results, "log-box") != true) {
		state.executing = false;
		return;
	}
	if (instructionPos === -1) {
		Components = generateSignal.initialize(results);
		ComponentsBackup = JSON.stringify(Components)
		instructionPos = 0;
	}

	isFinish = false;
	while (isFinish === false) {
		console.log(`instructionPos: ${instructionPos}`);
		ComponentsBackup = JSON.stringify(Components)
		currentInstruction.update(results[instructionPos]);
		instructionPos = await generateSignal.start(Components); // This triggers the signal generation
		if (instructionPos >= Components.InstructionMemory.instruction.length) {
			isFinish = true;
			state.executing = false;
		}
		
	}
}

// Ẩn tất cả step ban đầu
const stepIds = ["step_1", "step_2", "step_3", "step_4", "step_5"];
function hideAllSteps() {
	stepIds.forEach(id => {
		const el = document.getElementById(id);
		if (el) el.style.display = "none";
	});
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

		if (state.stepByStepMode === 0) {
			hideAllSteps();
		}
	});

	document.getElementById('replay-all-botton').addEventListener('click', function(event) {
		hideAllSteps();

		event.preventDefault();
		console.log("Stop/Replay All button clicked.");
		instructionPos = -1;
		state.executing = false;
		isFinish = true;
		document.getElementById('start-stop-animation').click();
		console.log("Simulation state set to not executing.");
	});

	document.getElementById('replay-one-botton').addEventListener('click', function(event) {
		hideAllSteps();

		event.preventDefault();
		console.log("Stop/Replay one button clicked.");
		state.executing = false;
		isFinish = true;
		generateSignal.initialize(null, true);
		Components = JSON.parse(ComponentsBackup);
		document.getElementById('start-stop-animation').click();
		console.log("Simulation state set to not executing.");
	});
	
	// state.executing = true;
	// results = compileCode();
	// execute(results);
}