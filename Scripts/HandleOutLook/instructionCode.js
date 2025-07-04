
 
const textarea = document.getElementById("instructionCode");
const lineNumbers = document.getElementById("lineNumbers");

export function updateLineNumbers() {
	const lines = textarea.value.split("\n").length;
	lineNumbers.innerHTML = "";
	for(let i = 1; i <= lines + 1; i++) 
		lineNumbers.innerHTML += `<div id = lineId${i}>${i}&#8201</div>`
}

export function trigger() {
	// Đồng bộ scroll giữa số dòng và textarea
	textarea.addEventListener("scroll", () => {
		lineNumbers.scrollTop = textarea.scrollTop;
	});

	textarea.addEventListener("input", updateLineNumbers);

	// Gọi lúc load trang
	updateLineNumbers();
}