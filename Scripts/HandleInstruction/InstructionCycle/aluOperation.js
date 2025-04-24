import { createNodeWithAnimation } from "./animation.js";

const dataToAluGroup = document.getElementById('data-to-alu');

const DEFAULT_ANIMATION_DURATION = 2;

export function sendDataToAlu(state) {
	dataToAluGroup.appendChild(createNodeWithAnimation({
		className: 'parsed-code',
		fieldName: 'data-to-alu',
		duration: DEFAULT_ANIMATION_DURATION,
		pathId: register-to-ALU-add-2-path,
		shapeType: 'rect',
		value: state.Register.ReadData1
	}));
}
