import * as parsedOutputTable from "./Compile/parsedOutputTable.js"
import * as formatCode from "./Compile/formatCode.js"
import * as fetch from "./Execute/fetch.js"
import * as decode from "./Execute/decode.js"
import * as execute from "./Execute/execute.js"

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
		fetch.trigger(decode.trigger(parsedInstruction, execute.trigger(parsedInstruction)));
		
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
		fetch.trigger(parsedInstruction);
	});
}

