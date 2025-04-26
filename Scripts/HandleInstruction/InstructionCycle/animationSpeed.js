
export let SPEED_ANIMATION = 500;
export const state = {
	executing: false
};

export function trigger() {
	const rangeSlider = document.getElementById('range-slider');
	const rangeValue = document.getElementById('range-value');
	
	rangeSlider.addEventListener('input', () => {
		if (state.executing) {
			rangeSlider.value = SPEED_ANIMATION;
			return;
		}

		rangeValue.textContent = rangeSlider.value;
		SPEED_ANIMATION = rangeSlider.value;
		const value = (rangeSlider.value - rangeSlider.min) / (rangeSlider.max - rangeSlider.min) * 100;
		rangeSlider.style.background = `linear-gradient(to right, #4CAF50 ${value}%, #ddd ${value}%)`;
	});
}