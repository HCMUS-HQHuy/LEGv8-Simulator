import * as ZoomDragAndDrop from "./HandleFrame/zoomDragAndDrop2.js"
import * as SwitchThemes from "./HandleOutLook/themes.js"
import * as instructionLine from "./HandleOutLook/instructionCode.js"
import * as handleReceivInstruction from "./HandleInstruction/formSubmit.js"

document.addEventListener('DOMContentLoaded', function() {
	SwitchThemes.trigger();
	ZoomDragAndDrop.trigger();
	instructionLine.trigger();

	// LOGIC BEGIN
	handleReceivInstruction.trigger();

	// END LOGIC
});