
/**
 * Updates the PC value displayed in the SVG.
 */
function updatePCDisplay(value) { // Nhận giá trị để hiển thị
	// *** GIẢ ĐỊNH: ID của text hiển thị PC là "pc-value-text" ***
	const pcTextElement = document.getElementById('pc-value-text');
	if (pcTextElement) {
		// Hiển thị dưới dạng Hex 8 chữ số (cho địa chỉ 32-bit)
		const hexValue = value.toString(16).toUpperCase().padStart(8, '0');
		pcTextElement.textContent = `0x${hexValue}`;
	} else {
		console.warn("PC display element ('pc-value-text') not found.");
	}
}

export function trigger() {

}