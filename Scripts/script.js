import * as handleReceivInstruction from "./InstructionHandle/FormSubmit.js"
import * as ZoomDragAndDrop from "./HandleFrame/ZoomDragAndDrop.js"
import * as SwitchThemes from "./HandleOutLook/Themes.js"
import * as instructionLine from "./HandleOutLook/InstructionCode.js"

document.addEventListener('DOMContentLoaded', function() {
	SwitchThemes.trigger();
	ZoomDragAndDrop.trigger();
	instructionLine.trigger();

	// LOGIC BEGIN
	handleReceivInstruction.trigger();

	// END LOGIC
});