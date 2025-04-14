function drawLine(x1, y1, x2, y2) {
	const line = document.createElement('div');  // Tạo một phần tử div mới cho mỗi đường thẳng
	const length = Math.sqrt((x2 - x1)**2 + (y2 - y1)**2);
	const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

	// Thêm đường thẳng vào container
	line.style.width = length + 'px';
	line.style.top = y1 + 'px';
	line.style.left = x1 + 'px';
	line.style.transform = `rotate(${angle}deg)`;

	line.style.position = 'absolute';
	line.style.height = '2px';  // Độ dày đường thẳng
	line.style.backgroundColor = 'red';

	document.getElementById('lines-container').appendChild(line);  // Thêm đường thẳng vào container
}

  // Hàm async để gọi bất đồng bộ các đường thẳng
  async function drawAllLines() {
	drawLine(100, 100, 300, 200); // Vẽ đường từ (100, 100) đến (300, 200)
	drawLine(100, 200, 400, 200); // Vẽ đường từ (100, 200) đến (400, 200)
	drawLine(200, 300, 500, 400); // Vẽ đường từ (200, 300) đến (500, 400)
	console.log('Tất cả các đường đã được vẽ!');
  }

  drawAllLines();
  