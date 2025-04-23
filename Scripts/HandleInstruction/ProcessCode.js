import * as parsedOutputTable from "./Compile/parsedOutputTable.js"
import * as formatCode from "./Compile/formatCode.js"
import * as fetching from "./Execute/fetch.js"

export function trigger() {
	codeForm.addEventListener('submit', function(event) {
        event.preventDefault();

		const results = formatCode.getResult();
		if (results == null) {
			console.error("formatcode: Have some problem!");
			return;
		}
		parsedOutputTable.update(results);
		
		// // --- LẤY GIÁ TRỊ PC HIỆN TẠI TRƯỚC KHI TĂNG ---
		// const pcValueForFetch = currentPC;
		// console.log(`PC incremented to: 0x${currentPC.toString(16).toUpperCase().padStart(8,'0')}`);
		const parsedInstruction = results[0].parsed;
		fetching.trigger(parsedInstruction);
		
	});

	const restartButton = document.getElementById('start-animation');
	restartButton.addEventListener('click', function(event) {
		event.preventDefault();

		const results = formatCode.getResult();
		if (results == null) {
			console.error("formatcode: Have some problem!");
			return;
		}
		parsedOutputTable.update(results);
		
		// // --- LẤY GIÁ TRỊ PC HIỆN TẠI TRƯỚC KHI TĂNG ---
		// const pcValueForFetch = currentPC;
		// console.log(`PC incremented to: 0x${currentPC.toString(16).toUpperCase().padStart(8,'0')}`);
		const parsedInstruction = results[0].parsed;
		fetching.trigger(parsedInstruction);
	});
}

