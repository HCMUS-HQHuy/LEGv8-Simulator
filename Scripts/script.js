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

/* Fullscreen mode ở đây */
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


/* Xử lý nhấn vào component để xem thông tin */
const instructionMemoryGroup = document.getElementById('instruction-memory');
const registerGroup = document.getElementById('register');
const ALUGroup = document.getElementById('add-2');
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

    });

    document.getElementById(groupId).addEventListener('click', function handleClickOutside() {
        const groupElement = document.getElementById(groupId);
        groupElement.setAttribute('transform', 'translate(-500, -500)');
    });
}

component_selected(instructionMemoryGroup, "instruction-memory-selected", 10, 10, 1.5)
component_selected(registerGroup, "register-selected", 10, 10, 1.5)
component_selected(ALUGroup, "add-2-selected", 10, 85, 1.5)
component_selected(dataMemoryGroup, "data-memory-selected", 10, 10, 1.5)


/* Adding highlight on each row */
document.addEventListener('DOMContentLoaded', () => {
    const instructionCode = document.getElementById('instructionCode');
    const lineNumbersDiv = document.getElementById('lineNumbers');
    const highlightOverlay = document.getElementById('highlightOverlay');
    const parseButton = document.getElementById('parseInstructions');
    // Use optional chaining (?) in case these elements don't exist
    const parseButtonFrame = document.getElementById('compile-btn');
    // const executeButton = document.getElementById('execute');
    // const executeButtonFrame = document.getElementById('start-animation');

    let currentHighlightIndex = -1;
    let lineCount = 0;
    let cachedLineHeight = 0;
    let cachedPaddingTop = 0;

    // --- Function to calculate or retrieve necessary CSS values ---
    function calculateMetrics() {
        const styles = window.getComputedStyle(instructionCode);
        const fontSz = parseFloat(styles.fontSize);
        let lineH = styles.lineHeight;
        if (lineH === 'normal') {
            cachedLineHeight = fontSz * 1.185; // Estimate
        } else if (lineH.endsWith('px')) {
            cachedLineHeight = parseFloat(lineH);
        } else if (lineH.endsWith('em')) {
             cachedLineHeight = parseFloat(lineH) * fontSz;
        } else {
             cachedLineHeight = parseFloat(lineH) * fontSz; // Unitless multiplier
        }
        cachedPaddingTop = parseFloat(styles.paddingTop);
    }

    // --- Function to position the highlight overlay ---
    function positionHighlightOverlay(index) {
        if (index >= 0 && index < lineCount && cachedLineHeight > 0) {
            // Calculate based on textarea's scroll position
            const topPos = (index * cachedLineHeight) + cachedPaddingTop - instructionCode.scrollTop;
            highlightOverlay.style.height = `${cachedLineHeight}px`;
            highlightOverlay.style.top = `${topPos}px`;
        } else {
            highlightOverlay.style.height = '0px'; // Hide overlay
        }
    }

    // --- Function to clear all highlights ---
    function clearAllHighlights() {
        const highlightedNum = lineNumbersDiv.querySelector('.highlighted-number');
        if (highlightedNum) {
            highlightedNum.classList.remove('highlighted-number');
        }
        positionHighlightOverlay(-1); // Hide overlay
        currentHighlightIndex = -1;
    }

    // Sync lineNumbers scroll and overlay when TEXTAREA scrolls
    instructionCode.addEventListener('scroll', () => {
        // Update lineNumbers scroll position to match textarea
        // Use Math.round to avoid tiny floating point differences causing infinite loops
        if (Math.round(lineNumbersDiv.scrollTop) !== Math.round(instructionCode.scrollTop)) {
            lineNumbersDiv.scrollTop = instructionCode.scrollTop;
        }
        // Always reposition overlay based on the current scroll state
        positionHighlightOverlay(currentHighlightIndex);
    });

    // --- NEW: Sync textarea scroll when using mouse wheel over LINE NUMBERS ---
    lineNumbersDiv.addEventListener('wheel', (event) => {
        // Directly adjust the scroll position of the instructionCode textarea
        instructionCode.scrollTop += event.deltaY;

        // Prevent the default wheel action (scrolling the page if lineNumbers itself can't scroll)
        // This is often desired for a better UX in this scenario.
        event.preventDefault();

        // NOTE: We don't need to explicitly update lineNumbersDiv.scrollTop or the overlay here.
        // Changing instructionCode.scrollTop will trigger the 'scroll' event listener
        // on instructionCode, which already handles syncing lineNumbersDiv and the overlay.
    }, { passive: false }); // Use passive: false because we are calling preventDefault()


    // --- Button Click Handlers ---
    const handleParseClick = () => {
        // console.log('Parse clicked: Clearing highlights.');
        clearAllHighlights();
        // Add actual parsing logic here...
    };

    // Attach handlers to potentially multiple buttons
    if (parseButton) parseButton.addEventListener('click', handleParseClick);
    if (parseButtonFrame) parseButtonFrame.addEventListener('click', handleParseClick); // Handles frame button too

    // --- Initial setup ---
    calculateMetrics();
    window.addEventListener('resize', calculateMetrics); // Recalculate on resize
    // Ensure initial scroll is synced (usually 0)
    lineNumbersDiv.scrollTop = instructionCode.scrollTop;

});

window.addEventListener('DOMContentLoaded', function() {
  const flagsBox = document.querySelector('.flagsBox');
  const outputContainer = document.querySelector('.outputContainer');
  outputContainer.style.height = flagsBox.offsetHeight + 'px';
});

const helpButton = document.getElementById("help-button");
const helpGroups = document.querySelectorAll(".help-group");

let helpVisible = false;

function showHelpGroups() {
    helpGroups.forEach(g => g.style.display = "block");
    helpVisible = true;

    helpButton.style.setProperty('background-color', 'var(--button-hover-bg-color)');
    helpButton.style.setProperty('color', 'var(--button-hover-text-color)');

}

function hideHelpGroups() {
    helpGroups.forEach(g => g.style.display = "none");
    helpVisible = false;

    helpButton.style.setProperty('background-color', 'var(--frame-bg-color)');
    helpButton.style.setProperty('color', 'var(--button-text-color)');
}

helpButton.addEventListener("click", (event) => {
    event.stopPropagation(); // Ngăn click lan ra ngoài SVG
    if (!helpVisible) {
        showHelpGroups();
    } else {
        hideHelpGroups();
    }
});

document.addEventListener("click", () => {
    if (helpVisible) hideHelpGroups();
});

function adjustDataMemoryBoxHeight() {
  const flagsBox = document.querySelector('.flagsBox');
  const registersBox = document.querySelector('.registersBox');
  const dataMemoryBox = document.querySelector('.dataMemoryBox');

  if (!flagsBox || !registersBox || !dataMemoryBox) return;

  // Reset height về 'auto' để lấy chiều cao thực
  flagsBox.style.height = 'auto';
  registersBox.style.height = 'auto';

  const maxHeight = Math.max(flagsBox.offsetHeight, registersBox.offsetHeight);
  dataMemoryBox.style.height = maxHeight + 'px';
}

window.addEventListener('load', adjustDataMemoryBoxHeight);
window.addEventListener('resize', adjustDataMemoryBoxHeight);

