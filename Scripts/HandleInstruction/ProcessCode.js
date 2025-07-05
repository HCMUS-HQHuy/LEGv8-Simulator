import * as currentInstruction from "./Compile/currentInstruction.js"
import * as formatCode from "./Compile/formatCode.js"

import * as generateSignal from "./InstructionCycle/generateSignal.js"
import {state, setDURATION_ANIMATION, resetDURATION_ANIMATION, DURATION_ANIMATION} from "./InstructionCycle/animationSpeed.js"
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

function removeAllContent() {
	for (let i = 0; i <= 3; i++) {
		document.getElementById(`mux-${i}-0-selected`).style.visibility = "hidden";
		document.getElementById(`mux-${i}-1-selected`).style.visibility = "hidden";
	}
	document.getElementById('instruction-memory-read-address-value').textContent='';
	document.getElementById('instruction-memory-instruction-[31-0]-value').textContent = '';
	document.getElementById('register-Read1-value').textContent = '';
	document.getElementById('register-Read2-value').textContent = '';
	document.getElementById('register-WriteReg-value').textContent = '';
	document.getElementById('register-WriteData-value').textContent = '';
	document.getElementById('register-ReadData1-value').textContent = '';
	document.getElementById('register-ReadData2-value').textContent = '';
	document.getElementById('add-2-input-1-value').textContent = '';
	document.getElementById('add-2-input-2-value').textContent = '';
	document.getElementById('add-2-output-value').textContent = '';
	document.getElementById('data-memory-address-value').textContent = '';
	document.getElementById('data-read-data-value').textContent = '';
	document.getElementById('data-memory-write-data-value').textContent = '';
}

function clearAll() {
	resetAnimation();
	instructionPos = -1;
	state.executing = false;
	ComponentsBackup = null;
	Components = null;
	isFinish = true;
	currentInstruction.update(-1);
	document.getElementById('pc-value-text').textContent = '0xF000';
	
	const flagNames = ['N', 'Z', 'V', 'C'];
	flagNames.forEach(flagName => {
		document.getElementById(flagName).innerText = '0';
		document.getElementById(`add-2-${flagName}-value`).textContent = '0';
		const parentRow = document.getElementById(flagName).closest('tr');
		parentRow.style.backgroundColor = "";
		parentRow.style.color = "";
	});
	setTimeout(()=>{
		state.currentStep = 6;
		removeAllContent();
	}, 2);

	for (let i = 0; i <= 30; i++) {
		const id = 'X' + i.toString().padStart(2, '0');
		const el = document.getElementById(id);
		if (el) el.textContent = '0x00000000';
	}
	const xzr = document.getElementById('XZR');
	if (xzr) xzr.textContent = '0x00000000';

	// 3. Clear all data memory cells
	const memoryCells = document.querySelectorAll('#data-memory-table-values td');
	memoryCells.forEach(cell => {
		cell.textContent = '0x0000';
	});

}

async function nextStep(results) {
	if (instructionPos === -1) {
		console.warn('warn instructionPos:', instructionPos);
		return -1;
	}
	removeAllContent();
	ComponentsBackup = cloneComponents(Components)
	currentInstruction.update(results[instructionPos]);
	return await generateSignal.start(Components);
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
		instructionPos = await nextStep(results);
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
		generateSignal.initialize(null, instructionPos, Components);
		document.getElementById('start-stop-animation').click();
	});

	document.getElementById('next-button').addEventListener('click', async function(event) {
		event.preventDefault();
		state.executing = false;
		isFinish = true;
		generateSignal.initialize(null, instructionPos, Components);
		setDURATION_ANIMATION(1);
		state.executing = true;
		console.log('instructionPos1', instructionPos);
		instructionPos = await nextStep(results);
		console.log('instructionPos2', instructionPos);
		state.executing = false;
		resetDURATION_ANIMATION();
		console.warn("DURATION_ANIMATION", DURATION_ANIMATION);
	});

}