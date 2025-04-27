const MAXIMUM_DURATION = 5000
const MININUM_DURATION = 500

export let DURATION_ANIMATION = 2000;
export const state = {
	executing: false
};

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

	let currentPercentage = 75;
	rangeSlider.addEventListener('input', () => {
		if (state.executing) {
			rangeSlider.value = currentPercentage;
			return;
		}
		currentPercentage = rangeSlider.value;
		rangeValue.textContent = currentPercentage;
		DURATION_ANIMATION = MAXIMUM_DURATION - currentPercentage * (MAXIMUM_DURATION - MININUM_DURATION) / 100;
		enable();
	});
}

function enable() {
	const rangeSlider = document.getElementById('range-slider');
	const value = (rangeSlider.value - rangeSlider.min) / (rangeSlider.max - rangeSlider.min) * 100;
	rangeSlider.style.background = `linear-gradient(to right, rgb(67, 161, 70) ${value}%, #ddd ${value}%)`;
	rangeSlider.style.setProperty('--thumb-color', "rgb(67, 161, 70)" );
}

function disable() {
	const rangeSlider = document.getElementById('range-slider');
	const value = (rangeSlider.value - rangeSlider.min) / (rangeSlider.max - rangeSlider.min) * 100;
	rangeSlider.style.background = `linear-gradient(to right,rgb(78, 92, 79) ${value}%, #ddd ${value}%)`;
	rangeSlider.style.setProperty('--thumb-color', "rgb(78, 92, 79)" );
}