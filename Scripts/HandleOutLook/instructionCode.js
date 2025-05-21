

export function trigger() {
	const textarea = document.getElementById("instructionCode");
	const lineNumbers = document.getElementById("lineNumbers");

	function updateLineNumbers() {
		const lines = textarea.value.split("\n").length;
		lineNumbers.innerHTML = "";
		for(let i = 1; i <= lines + 1; i++) 
			lineNumbers.innerHTML += `<div id = lineId${i - 1}>${i.toString(10).padStart(2, ' ')}</div>`
	}

	// Đồng bộ scroll giữa số dòng và textarea
	textarea.addEventListener("scroll", () => {
		lineNumbers.scrollTop = textarea.scrollTop;
	});

	textarea.addEventListener("input", updateLineNumbers);

	// Gọi lúc load trang
	updateLineNumbers();
}