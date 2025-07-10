
export function trigger() {
	const themeToggle = document.getElementById("themeToggle");

	// Khởi tạo mặc định dark mode
	document.body.classList.add("dark");

	themeToggle.addEventListener("click", () => {
	if (document.body.classList.contains("dark")) {
		document.body.classList.remove("dark");
		document.body.classList.add("light");
		themeToggle.textContent = "🌙";
	} else {
		document.body.classList.remove("light");
		document.body.classList.add("dark");
		themeToggle.textContent = "🔆";
	}
	});
}