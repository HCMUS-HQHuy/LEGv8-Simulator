import * as ZoomDragAndDrop from "./HandleFrame/zoomDragAndDrop.js"
import * as SwitchThemes from "./HandleOutLook/themes.js"
import * as instructionLine from "./HandleOutLook/instructionCode.js"
import * as handleReceivInstruction from "./HandleInstruction/ProcessCode.js"

document.addEventListener('DOMContentLoaded', function() {
	SwitchThemes.trigger();
	ZoomDragAndDrop.trigger();
	instructionLine.trigger();

	// LOGIC BEGIN
	handleReceivInstruction.trigger();

	// END LOGIC
});

const frameBox = document.querySelector('.frame');
const fullscreenBtn = frameBox.querySelector('#fullscreen-btn');

// Hàm kiểm tra xem trình duyệt có đang ở chế độ fullscreen không
function isFullscreen() {
    return document.fullscreenElement ||      // Chuẩn
	document.webkitFullscreenElement || // Chrome, Safari, Opera
	document.mozFullScreenElement ||    // Firefox
	document.msFullscreenElement;       // IE/Edge
}

// Hàm để vào chế độ fullscreen
function enterFullscreen() {
    if (frameBox.requestFullscreen) {
        frameBox.requestFullscreen();
    } else if (frameBox.webkitRequestFullscreen) { /* Safari */
        frameBox.webkitRequestFullscreen();
    } else if (frameBox.mozRequestFullScreen) { /* Firefox */
        frameBox.mozRequestFullScreen();
    } else if (frameBox.msRequestFullscreen) { /* IE11 */
        frameBox.msRequestFullscreen();
    }
}

// Hàm để thoát chế độ fullscreen
function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { /* Safari */
        document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) { /* Firefox */
        document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) { /* IE11 */
        document.msExitFullscreen();
    }
}

// Hàm cập nhật trạng thái nút (Text và chức năng)
function updateButtonState() {
    if (isFullscreen()) {
        fullscreenBtn.textContent = '✖'; // Đổi text thành Exit
        fullscreenBtn.title = 'Exit fullscreen';
    } else {
        fullscreenBtn.textContent = '⛶'; // Đổi text thành Fullscreen
        fullscreenBtn.title = 'Toggle fullscreen'
    }
}

// Xử lý sự kiện click vào nút
fullscreenBtn.addEventListener('click', () => {
    if (!isFullscreen()) {
        enterFullscreen();
    } else {
        exitFullscreen();
    }
    // Cập nhật trạng thái nút ngay sau khi click (có thể không cần nếu có listener bên dưới)
    // updateButtonState(); // Tạm thời comment vì sự kiện change sẽ xử lý
});

// Lắng nghe sự kiện thay đổi trạng thái fullscreen
// (Quan trọng để xử lý khi người dùng nhấn ESC để thoát fullscreen)
document.addEventListener('fullscreenchange', updateButtonState);
document.addEventListener('webkitfullscreenchange', updateButtonState); // Chrome, Safari, Opera
document.addEventListener('mozfullscreenchange', updateButtonState);    // Firefox
document.addEventListener('MSFullscreenChange', updateButtonState);     // IE/Edge

// Cập nhật trạng thái nút khi tải trang lần đầu (phòng trường hợp đặc biệt)
updateButtonState();
