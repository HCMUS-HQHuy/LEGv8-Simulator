import * as ZoomDragAndDrop from "./HandleFrame/ZoomDragAndDrop1.js"
import * as SwitchThemes from "./HandleOutLook/Themes1.js"
import * as instructionLine from "./HandleOutLook/InstructionCode1.js"
import * as handleReceivInstruction from "./HandleInstruction/FormSubmit1.js"

document.addEventListener('DOMContentLoaded', function() {
	SwitchThemes.trigger();
	ZoomDragAndDrop.trigger();
	instructionLine.trigger();

	// LOGIC BEGIN
	handleReceivInstruction.trigger();

	// END LOGIC
});