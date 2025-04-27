import * as ZoomDragAndDrop from "./HandleFrame/zoomDragAndDrop.js"
import * as SwitchThemes from "./HandleOutLook/themes.js"
import * as instructionLine from "./HandleOutLook/instructionCode.js"
import * as handleReceivInstruction from "./HandleInstruction/ProcessCode.js"
import * as animationSpeed from "./HandleInstruction/InstructionCycle/animationSpeed.js"
document.addEventListener('DOMContentLoaded', function() {
	SwitchThemes.trigger();
	ZoomDragAndDrop.trigger();
	instructionLine.trigger();

    animationSpeed.trigger();
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

document.addEventListener('keydown', (event) => {
    if (event.key === 'f' || event.key === 'F') { // Kiểm tra xem người dùng có nhấn phím 'F'
        if (!isFullscreen()) {
            enterFullscreen(); // Vào fullscreen
        } else {
            exitFullscreen();  // Thoát fullscreen
        }
        updateButtonState(); // Cập nhật trạng thái nút
    }
});

// Xử lý sự kiện click vào nút
fullscreenBtn.addEventListener('click', () => {
    if (!isFullscreen()) {
        enterFullscreen();
    } else {
        exitFullscreen();
    }
    // Cập nhật trạng thái nút ngay sau khi click (có thể không cần nếu có listener bên dưới)
    updateButtonState();
});

// Lắng nghe sự kiện thay đổi trạng thái fullscreen
// (Quan trọng để xử lý khi người dùng nhấn ESC để thoát fullscreen)
document.addEventListener('fullscreenchange', updateButtonState);
document.addEventListener('webkitfullscreenchange', updateButtonState); // Chrome, Safari, Opera
document.addEventListener('mozfullscreenchange', updateButtonState);    // Firefox
document.addEventListener('MSFullscreenChange', updateButtonState);     // IE/Edge

// Cập nhật trạng thái nút khi tải trang lần đầu (phòng trường hợp đặc biệt)
updateButtonState();

const instructionMemoryGroup = document.getElementById('instruction-memory');
const registerGroup = document.getElementById('register');
const signExtendGroup = document.getElementById('sign-extend');
const ALUGroup = document.getElementById('add-2');
const shiftLeft2Group = document.getElementById('shift-left-2');
const dataMemoryGroup = document.getElementById('data-memory');

let clonedGroupPrevious = null;

function component_selected(group, groupId, posX, posY, scale) {
    group.addEventListener('click', (event) => {
        // Nếu có bản sao trước đó, xóa nó
        if (clonedGroupPrevious) {
            clonedGroupPrevious.setAttribute('transform', 'translate(-500, -500)');
            clonedGroupPrevious = null;
        }

        // Phóng to và di chuyển bản sao đến vị trí (10, 10) và scale 2
        clonedGroupPrevious = document.getElementById(groupId);
        document.getElementById(groupId).setAttribute('transform', `translate(${posX}, ${posY}) scale(${scale})`);  // Di chuyển và phóng to gấp 2 lần

        // Lắng nghe sự kiện click trên toàn bộ document
        event.stopPropagation();
        // Lắng nghe sự kiện click trên toàn bộ document để xóa bản sao nếu click ra ngoài
        document.addEventListener('click', function handleClickOutside(event) {
            // Kiểm tra nếu click ra ngoài clonedGroup
            if (!document.getElementById(groupId).contains(event.target)) {
                document.getElementById(groupId).setAttribute('transform', 'translate(-500, -500)');
                document.removeEventListener('click', handleClickOutside);  // Loại bỏ sự kiện để không bị gọi lại
            }
        });
    });
}

component_selected(instructionMemoryGroup, "instruction-memory-selected", 10, 10, 1.5)
component_selected(registerGroup, "register-selected", 10, 10, 1.5)
component_selected(signExtendGroup, "sign-extend-selected", 295, 70, 1.5)
component_selected(ALUGroup, "add-2-selected", 10, 85, 1.5)
component_selected(shiftLeft2Group, "shift-left-2-selected", 295, 70, 1.5)
component_selected(dataMemoryGroup, "data-memory-selected", 10, 10, 1.5)