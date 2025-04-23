

export function trigger() {
	const textarea = document.getElementById("instructionCode");
	const lineNumbers = document.getElementById("lineNumbers");

	function updateLineNumbers() {
	const lines = textarea.value.split("\n").length;
	lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => `${i + 1}`).join("<br>");
	}

	// Đồng bộ scroll giữa số dòng và textarea
	textarea.addEventListener("scroll", () => {
	lineNumbers.scrollTop = textarea.scrollTop;
	});

	textarea.addEventListener("input", updateLineNumbers);

	// Gọi lúc load trang
	updateLineNumbers();
}