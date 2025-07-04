import * as currentInstruction from "./Compile/currentInstruction.js"
import * as formatCode from "./Compile/formatCode.js"

import * as generateSignal from "./InstructionCycle/generateSignal.js"
import {state} from "./InstructionCycle/animationSpeed.js"
import { validateParsedResults } from "../HandleOutLook/logBox.js"
import { resetAnimation } from "./InstructionCycle/animation.js"
import { cloneComponents } from "./Compile/Define/components.js"


let instructionPos = -1;
let Components = null;
let ComponentsBackup = null;
let isFinish = true;

function compileCode() {
	const results = formatCode.getResult();
	if (results == null) {
		console.error("formatcode: Have some problem!");
		return;
	}
	validateParsedResults(results);
	return results;
}

function turnoffMux() {
	for (let i = 0; i <= 3; i++) {
		document.getElementById(`mux-${i}-0-selected`).style.visibility = "hidden";
		document.getElementById(`mux-${i}-1-selected`).style.visibility = "hidden";
	}
}

function clearAll() {
	resetAnimation();
	instructionPos = -1;
	state.executing = false;
	setTimeout(()=>{state.currentStep = 6;}, 2);
	ComponentsBackup = null;
	Components = null;
	isFinish = true;
	currentInstruction.update(-1);
	turnoffMux();
}

async function execute(results) {
    if (validateParsedResults(results, "log-box") != true) {
		state.executing = false;
		return;
	}
	if (instructionPos === -1) {
		Components = generateSignal.initialize(results);
		ComponentsBackup = cloneComponents(Components)
		instructionPos = 0;
	}

	isFinish = false;
	while (isFinish === false) {
		turnoffMux();
		ComponentsBackup = cloneComponents(Components)
		currentInstruction.update(results[instructionPos]);
		instructionPos = await generateSignal.start(Components);
		if (instructionPos >= Components.InstructionMemory.instruction.length) {
			currentInstruction.update(Number(instructionPos));
			isFinish = true;
			state.executing = false;
		}
		
	}
}

export function trigger() {
	let results = null;
	state.executing = false;

	document.getElementById('compile-btn').addEventListener('click', function(event) {
        event.preventDefault();
		clearAll();
		instructionPos = -1;
		results = compileCode();
	});
	document.getElementById('start-animation').addEventListener('click', function(event) {
		event.preventDefault();
		if (state.executing === true) 
			return;
		document.getElementById('start-stop-animation').click();
	});
	document.getElementById('start-stop-animation').addEventListener('click', function(event) {
		event.preventDefault();
		if (state.executing === true) 
			state.executing = false;
		else state.executing = true;

		if (isFinish === true) {
			execute(results);
		}
	});

	document.getElementById('replay-all-botton').addEventListener('click', function(event) {
		event.preventDefault();
		console.log("Stop/Replay All button clicked.");
		instructionPos = -1;
		state.executing = false;
		isFinish = true;
		document.getElementById('start-stop-animation').click();
	});

	document.getElementById('replay-one-botton').addEventListener('click', function(event) {
		event.preventDefault();
		console.log("Stop/Replay one button clicked.");
		state.executing = false;
		isFinish = true;
		generateSignal.initialize(null, true);
		document.getElementById('start-stop-animation').click();
	});
}