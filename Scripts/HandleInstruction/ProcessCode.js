import * as currentInstruction from "./Compile/currentInstruction.js"
import * as animate from "./InstructionCycle/animation.js"
import * as formatCode from "./Compile/formatCode.js"

import * as generateSignal from "./InstructionCycle/generateSignal.js"
import {DURATION_ANIMATION, state} from "./InstructionCycle/animationSpeed.js"

// const dataSignalNodesGroup = [
// 	document.getElementById('data-signal-nodes0'),
// 	document.getElementById('data-signal-nodes1'),
// 	document.getElementById('data-signal-nodes2'),
// 	document.getElementById('data-signal-nodes3'),
// 	document.getElementById('data-signal-nodes4'),
// 	document.getElementById('data-signal-nodes5'),
// 	document.getElementById('data-signal-nodes6'),
// 	document.getElementById('data-signal-nodes7'),
// 	document.getElementById('data-signal-nodes8'),
// 	document.getElementById('data-signal-nodes9')
// ];

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
	currentInstruction.update(results[0]);
	console.log(`results: ${results.length}`);
	const Components = generateSignal.initialize(results);

	console.log("---------------START----------------");
	state.executing = true;
	while (state.executing) {
		await new Promise((promise) => {
			generateSignal.start(Components, promise); // This triggers the signal generation
		});
		console.warn("FINISH AN INSTRUCTION");
	}
	state.executing = false;
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

	document.getElementById('start-animation').addEventListener('click', function(event) {
		event.preventDefault();
		execute(results);
	});
	
	document.getElementById('execute').addEventListener('click', function(event) {
		event.preventDefault();
		execute(results);
	});

	document.getElementById('stop-animation').addEventListener('click',function(event) {
		event.preventDefault();
		state.executing = false;
	});
}