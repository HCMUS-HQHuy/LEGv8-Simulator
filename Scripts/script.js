import * as handleReceivInstruction from "./InstructionHandle/FormSubmit.js"
import * as ZoomDragAndDrop from "./HandleFrame/ZoomDragAndDrop.js"
import * as SwitchThemes from "./HandleOutLook/Themes.js"
import * as instructionLine from "./HandleOutLook/InstructionCode.js"


// Wait for the HTML document to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
	SwitchThemes.trigger();
	ZoomDragAndDrop.trigger();
	handleReceivInstruction.trigger();
	instructionLine.trigger();
}); // End DOMContentLoaded listener