const startButton = document.getElementById('startButton');
const dotAnimation = document.getElementById('dotAnimationPcAdd');
startButton.addEventListener('click', () => {
	  document.getElementById("point").setAttribute("visibility", "visible");
	  const aim = document.getElementById("animationDot");
	  aim.beginElement();
});

const content = document.getElementById('zoomContent');
  const frame = document.getElementById('zoomFrame');
  let scale = 1;

  frame.addEventListener('wheel', function(e) {
	if (e.ctrlKey) {
	  e.preventDefault(); // Ngăn không cho browser zoom
	  const delta = e.deltaY;
	  const zoomFactor = 0.1;

	  if (delta > 0) {
		scale = Math.max(0.1, scale - zoomFactor);
	  } else {
		scale = Math.min(5, scale + zoomFactor);
	  }

	  content.style.transform = `scale(${scale})`;
	}
  }, { passive: false });