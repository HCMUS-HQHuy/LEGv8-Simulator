document.getElementById('myForm').addEventListener('submit', async function(e) {
	e.preventDefault();
	const message = document.getElementById('message').value;

	const newDiv = document.createElement('div');
	newDiv.className = "node";
	document.getElementById('result').innerText = "Bạn vừa nhập: " + message;
	document.getElementById('path').appendChild(newDiv);
});

function movePoint(A, B, point) {
	return new Promise((resolve) => {
		const step = 1;
		console.log(A, B);
		const deltaX = B.left - A.left;
		const deltaY = B.top - A.top;
	
		const steps = Math.max(Math.abs(deltaX), Math.abs(deltaY)) / step;
		
		let currentStep = 0;

		const interval = setInterval(() => {
			const newLeft = A.left + (deltaX * (currentStep / steps));
			const newTop = A.top + (deltaY * (currentStep / steps));
			point.style.left = newLeft + 'px'; 
			point.style.top = newTop + 'px';
			if (currentStep >= steps) {
				clearInterval(interval);
				resolve();
			}
			currentStep++;
		}, 20);
	})
}

const point = document.querySelector('.point');  // Chọn phần tử điểm

let A = { left: 0, top: 100};  // Vị trí A (bắt đầu)
let B = { left: 0, top: 0};  // Vị trí B (kết thúc)

async function moveSequence() {
  // Di chuyển từ A đến B
  await movePoint(A, B, point); 

  // Di chuyển từ A đến B lần tiếp theo
  A = { left: 0, top: 0};  // Vị trí A (bắt đầu)
  B = { left: 100, top: 0};  // Vị trí B (kết thúc)
  await movePoint(A, B, point); 
}

moveSequence();

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