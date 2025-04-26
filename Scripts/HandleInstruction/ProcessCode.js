import * as parsedOutputTable from "./Compile/parsedOutputTable.js"
import * as currentInstruction from "./Compile/currentInstruction.js"
import * as animate from "./InstructionCycle/animation.js"
import * as formatCode from "./Compile/formatCode.js"

import * as generateSignal from "./InstructionCycle/generateSignal.js"

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

async function playAnimationsSequentially() {
	for (let i = 0; i < dataSignalNodesGroup.length; i++) {
		const success = animate.startSignalAnimation(dataSignalNodesGroup[i]);
		if (success === false) break;
		await new Promise(resolve => setTimeout(resolve, 2000)); // chờ 2 giây
		console.log("HELLO!\n");
	}
	console.log("HERE!\n");
}

async function processCode() {
	const results = formatCode.getResult();
	if (results == null) {
		console.error("formatcode: Have some problem!");
		return;
	}
	parsedOutputTable.update(results);
	currentInstruction.update(results[0]);

	// const parsedInstruction = results[0].parsed;
	// fetch.trigger(state, decode.trigger(state, execute.trigger(state)));
	
	// const components = run.getComponents(parsedInstruction);
	console.log(`results: ${results[0].assemblyInstruction}`);
	const Components = generateSignal.initialize(results);

	while (true) {
		console.log("---------------START----------------");
		const index = generateSignal.start(Components);
		if (index == -1) break;
		await new Promise(playAnimationsSequentially);
		console.log("---------------END----------------");
	}
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

