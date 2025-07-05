const MAXIMUM_DURATION = 5000
const MININUM_DURATION = 500

export let DURATION_ANIMATION = 2000;

export function setDURATION_ANIMATION(val) {
	DURATION_ANIMATION = val;
}

export function resetDURATION_ANIMATION() {
	const rangeSlider = document.getElementById('range-slider');
	const currentPercentage = rangeSlider.value;
	DURATION_ANIMATION = MAXIMUM_DURATION - currentPercentage * (MAXIMUM_DURATION - MININUM_DURATION) / 100;
}

export const state = {
	executing: false,
	stepByStepMode: false,
	currentStep: 0
};

const svgCanvas = document.getElementById('zoomFrame');
const StateInfor = {
	start: {
		icon: "⏹︎",
		title: "Start animation",
		call: () => svgCanvas.unpauseAnimations()  // wrapped in arrow function
	},
	stop: {
		icon: "▶",
		title: "Stop animation",
		call: () => svgCanvas.pauseAnimations()
	}
};

function switchIcon(stateCode) {
	const button = document.getElementById('start-stop-animation');
	button.innerText = StateInfor[stateCode].icon;
	button.title = StateInfor[stateCode].title;
	StateInfor[stateCode].call();
}

// Ẩn tất cả step ban đầu
const stepIds = ["step_1", "step_2", "step_3", "step_4", "step_5"];
function hideAllSteps() {
	stepIds.forEach(id => {
		const el = document.getElementById(id);
		if (el) el.style.display = "none";
	});
}

// Hiển thị step hiện tại
function showCurrentStep() {
	const id = stepIds[state.currentStep];
	const el = document.getElementById(id);
	if (el) el.style.display = "inline";
}

export function trigger() {
	const rangeSlider = document.getElementById('range-slider');
	const rangeValue = document.getElementById('range-value');

	Object.defineProperty(state, 'executing', {
		set(newVal) {
		  this._executing = newVal;
		  if (newVal === true) disable();
		  else enable();
		},
		get() {
		  return this._executing;
		}
	});

	Object.defineProperty(state, 'currentStep', {
		set(newVal) {
			if (newVal > 5)
				console.warn("new Val > 5 ?");
			this._currentStep = newVal;
			if (state.stepByStepMode) {
				hideAllSteps();
				showCurrentStep();
			}
		},
		get() {
		  return this._currentStep;
		}
	});

	let currentPercentage = 75;
	rangeSlider.addEventListener('input', () => {
		if (state.executing) {
			rangeSlider.value = currentPercentage;
			return;
		}
		currentPercentage = rangeSlider.value;
		rangeValue.textContent = `Speed: ${currentPercentage}%`;
		DURATION_ANIMATION = MAXIMUM_DURATION - currentPercentage * (MAXIMUM_DURATION - MININUM_DURATION) / 100;
		enable();
	});
	state.executing = false;
	state.stepByStepMode = 0;

	document.getElementById('step-by-step-mode-button').addEventListener('click', function(event) {
		event.preventDefault();
		state.stepByStepMode ^= 1;
		if (state.stepByStepMode) {
			hideAllSteps(); showCurrentStep();
			document.getElementById('step-by-step-mode-button').style.setProperty('background-color', 'var(--button-hover-bg-color)');
			document.getElementById('step-by-step-mode-button').style.setProperty('color', 'var(--button-hover-text-color)');
		}
		else {
			hideAllSteps();
			document.getElementById('step-by-step-mode-button').style.setProperty('background-color', 'var(--frame-bg-color)');
			document.getElementById('step-by-step-mode-button').style.setProperty('color', 'var(--button-text-color)');
		}
	});

}

function enable() {
	switchIcon("stop");
	const rangeSlider = document.getElementById('range-slider');
	const value = (rangeSlider.value - rangeSlider.min) / (rangeSlider.max - rangeSlider.min) * 100;
	rangeSlider.style.background = `linear-gradient(to right, rgb(67, 161, 70) ${value}%, #ddd ${value}%)`;
	rangeSlider.style.setProperty('--thumb-color', "rgb(67, 161, 70)" );
}

function disable() {
	switchIcon("start");
	const rangeSlider = document.getElementById('range-slider');
	const value = (rangeSlider.value - rangeSlider.min) / (rangeSlider.max - rangeSlider.min) * 100;
	rangeSlider.style.background = `linear-gradient(to right,rgb(78, 92, 79) ${value}%, #ddd ${value}%)`;
	rangeSlider.style.setProperty('--thumb-color', "rgb(78, 92, 79)" );
}