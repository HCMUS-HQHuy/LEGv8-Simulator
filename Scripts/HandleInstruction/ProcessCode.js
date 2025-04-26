import * as parsedOutputTable from "./Compile/parsedOutputTable.js"
import * as currentInstruction from "./Compile/currentInstruction.js"
import * as animate from "./InstructionCycle/animation.js"
import * as formatCode from "./Compile/formatCode.js"

import * as generateSignal from "./InstructionCycle/generateSignal.js"
import {SPEED_ANIMATION} from "./InstructionCycle/animationSpeed.js"

const dataSignalNodesGroup = [
	document.getElementById('data-signal-nodes0'),
	document.getElementById('data-signal-nodes1'),
	document.getElementById('data-signal-nodes2'),
	document.getElementById('data-signal-nodes3'),
	document.getElementById('data-signal-nodes4'),
	document.getElementById('data-signal-nodes5'),
	document.getElementById('data-signal-nodes6'),
	document.getElementById('data-signal-nodes7'),
	document.getElementById('data-signal-nodes8'),
	document.getElementById('data-signal-nodes9')
];

async function playAnimationsSequentially(promise) {
	for (let i = 0; i < dataSignalNodesGroup.length; i++) {
		const success = animate.startSignalAnimation(dataSignalNodesGroup[i]);
		if (success === false) break;
		await new Promise(resolve => setTimeout(resolve, SPEED_ANIMATION));
	}
	promise();
}

async function processCode() {
	const results = formatCode.getResult();
	if (results == null) {
		console.error("formatcode: Have some problem!");
		return;
	}
	parsedOutputTable.update(results);
	currentInstruction.update(results[0]);
	console.log(`results: ${results.length}`);
	const Components = generateSignal.initialize(results);

	console.log("---------------START----------------");
	while (true) {
		const index = generateSignal.start(Components);
		console.log(`index: ${index}`);
		if (index == -1) break;
		await new Promise((promise) => {
			playAnimationsSequentially(promise);
		});
	}
	console.log("---------------END----------------");
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

