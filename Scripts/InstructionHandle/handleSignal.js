// Nội dung cho file: handleSignals.js

import controlSignalTable from "./defineSignal.js"; // Đảm bảo đường dẫn đúng

// --- Namespace SVG ---
const svgNS = "http://www.w3.org/2000/svg";

// --- Vị trí để thêm các node tín hiệu ---
const signalNodesGroup = document.getElementById('control-signal-nodes'); // Giả sử thẻ <g> này tồn tại trong HTML/SVG của bạn

/**
 * Tạo các tín hiệu điều khiển dựa trên lệnh đã được parse.
 * (Giữ nguyên như bạn đã cung cấp - không cần thay đổi logic này)
 * @param {object} parsedInstruction - Đối tượng lệnh đã được parse.
 * @returns {object | null} Một đối tượng với các tên tín hiệu điều khiển làm key
 *                           và giá trị 0 hoặc 1, hoặc null nếu lệnh không được hỗ trợ.
 */
export function generateControlSignals(parsedInstruction) {
    if (!parsedInstruction || parsedInstruction.error || !parsedInstruction.mnemonic) {
        console.error("Invalid or errored parsed instruction provided.");
        return null; // Không thể tạo tín hiệu nếu parse lỗi hoặc không có lệnh
    }

    const mnemonic = parsedInstruction.mnemonic; // Lấy tên lệnh
    const type = parsedInstruction.type;       // Lấy loại lệnh (R, D, CB, etc.)

    let instructionClass = null;

    // Xác định lớp lệnh dựa trên type hoặc mnemonic cụ thể từ bảng
    if (type === 'R' && controlSignalTable["R-format"]) {
         instructionClass = "R-format";
    } else if (mnemonic === 'LDUR' && controlSignalTable["LDUR"]) {
        instructionClass = "LDUR";
    } else if (mnemonic === 'STUR' && controlSignalTable["STUR"]) {
        instructionClass = "STUR";
    } else if (mnemonic === 'CBZ' && controlSignalTable["CBZ"]) {
         instructionClass = "CBZ";
    }
    // === Thêm điều kiện else if cho các lệnh khác bạn muốn hỗ trợ ===
    else {
        console.warn(`Control signals not defined for instruction: ${mnemonic} (Type: ${type})`);
        return null; // Trả về null nếu không tìm thấy định nghĩa tín hiệu
    }

    // Lấy các tín hiệu điều khiển từ bảng dựa trên lớp lệnh đã xác định
    const signals = controlSignalTable[instructionClass];

    // Trả về bản sao của đối tượng tín hiệu để tránh sửa đổi bảng gốc
    return { ...signals };
}


/**
 * Tạo SVG cho một node tín hiệu (0/1) và animation của nó.
 * *** SỬA ĐỔI: Đã xóa rotate="auto" để node không xoay ***
 * @param {string} signalName - Tên tín hiệu (e.g., "RegWrite").
 * @param {0 | 1} value - Giá trị tín hiệu (0 hoặc 1).
 * @param {string} pathId - ID của thẻ <path> (đã chuẩn hóa chữ thường) mà node sẽ di chuyển trên đó.
 * @param {number} duration - Thời gian animation (giây).
 * @returns {SVGGElement | null} Phần tử <g> chứa node và animation, hoặc null nếu path không tồn tại.
 */
function createSignalNodeElement(signalName, value, pathId, duration = 5) {
    const pathElement = document.getElementById(pathId);
    if (!pathElement) {
        console.warn(`SVG Path Element with ID "${pathId}" (lowercase expected) not found. Cannot create animation node for signal "${signalName}". Check SVG ID definition.`);
        return null;
    }

    const nodeGroupId = `node-${signalName}`;
    const animationId = `anim-${signalName}`;

     const existingNode = document.getElementById(nodeGroupId);
     if (existingNode) {
         existingNode.remove();
     }

    const nodeGroup = document.createElementNS(svgNS, 'g');
    nodeGroup.setAttribute('id', nodeGroupId);
    nodeGroup.setAttribute('visibility', 'hidden'); // Ẩn ban đầu

    // Tạo vòng tròn nền
    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('r', '8');
    circle.setAttribute('fill', value === 1 ? '#FF4136' : '#0074D9');
    circle.setAttribute('stroke', 'black');
    circle.setAttribute('stroke-width', '1');

    // Tạo text hiển thị 0 hoặc 1
    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('font-size', '10');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('fill', 'white');
    text.textContent = value.toString();

    // Tạo animation
    const animateMotion = document.createElementNS(svgNS, 'animateMotion');
    animateMotion.setAttribute('id', animationId);
    animateMotion.setAttribute('dur', `${duration}s`);
    animateMotion.setAttribute('begin', 'indefinite');
    animateMotion.setAttribute('fill', 'freeze');
    // --- DÒNG NÀY ĐÃ BỊ XÓA hoặc COMMENT ---
    // animateMotion.setAttribute('rotate', 'auto');
    // Bằng cách xóa dòng trên, node sẽ không tự động xoay theo hướng của path nữa.

    // Tạo mpath để liên kết với đường path
    const mpath = document.createElementNS(svgNS, 'mpath');
    mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${pathId}`);

    // Gắn kết các phần tử
    animateMotion.appendChild(mpath);
    nodeGroup.appendChild(circle);
    nodeGroup.appendChild(text);
    nodeGroup.appendChild(animateMotion);

    return nodeGroup;
}


// ... (hàm displayControlSignalNodes giữ nguyên từ phiên bản trước - dùng pathId chữ thường) ...

export function displayControlSignalNodes(signals) {
    if (!signals) {
        console.log("No control signals generated to display.");
        return;
    }
     if (!signalNodesGroup) {
        console.error("SVG group 'control-signal-nodes' not found! Cannot display signals.");
        return;
     }

    while (signalNodesGroup.firstChild) {
        signalNodesGroup.removeChild(signalNodesGroup.firstChild);
    }

    for (const [signalName, value] of Object.entries(signals)) {
        let pathId;
        const lowerCaseSignalName = signalName.toLowerCase();

        if (lowerCaseSignalName === 'aluop1' || lowerCaseSignalName === 'aluop0') {
            pathId = 'control-aluop-path';
        }
        else {
            pathId = `control-${lowerCaseSignalName}-path`;
        }

        const nodeElement = createSignalNodeElement(signalName, value, pathId); // Gọi hàm đã sửa
        if (nodeElement) {
            signalNodesGroup.appendChild(nodeElement);
        }
    }
}

// ... (hàm startControlSignalAnimation giữ nguyên) ...
export function startControlSignalAnimation() {
     if (!signalNodesGroup) {
        console.error("SVG group 'control-signal-nodes' not found! Cannot start animation.");
        return;
     }

    const animations = signalNodesGroup.querySelectorAll('animateMotion');
    if (animations.length === 0) {
        console.log("No signal nodes found to animate.");
        return;
    }

    console.log(`Starting animation for ${animations.length} control signals.`);
    animations.forEach(anim => {
        const parentGroup = anim.closest('g');
        if (parentGroup) {
            parentGroup.setAttribute('visibility', 'visible');
            anim.beginElement();
        } else {
            console.warn(`Could not find parent group for animation element:`, anim);
        }
    });
}

// --- Ví dụ cách sử dụng (Giả sử bạn có hàm parseLegv8Instruction) ---
/*
async function runSimulation(instructionLine) {
    try {
        // Giả sử hàm này trả về object như { mnemonic: 'LDUR', type: 'D', ... } hoặc { error: ... }
        const parsed = parseLegv8Instruction(instructionLine);

        if (parsed && !parsed.error) {
            const signals = generateControlSignals(parsed);
            if (signals) {
                displayControlSignalNodes(signals);
                // Có thể đợi một chút trước khi bắt đầu animation nếu muốn
                // await new Promise(resolve => setTimeout(resolve, 100));
                startControlSignalAnimation();
            } else {
                // Xóa các node cũ nếu lệnh không hợp lệ hoặc không được hỗ trợ
                 while (signalNodesGroup.firstChild) {
                    signalNodesGroup.removeChild(signalNodesGroup.firstChild);
                }
            }
        } else {
            console.error("Failed to parse instruction:", instructionLine, parsed?.error);
             // Xóa các node cũ nếu parse lỗi
             while (signalNodesGroup.firstChild) {
                signalNodesGroup.removeChild(signalNodesGroup.firstChild);
            }
        }
    } catch (error) {
        console.error("Error during simulation step:", error);
         // Xóa các node cũ nếu có lỗi xảy ra
         while (signalNodesGroup.firstChild) {
            signalNodesGroup.removeChild(signalNodesGroup.firstChild);
        }
    }
}

// Gọi hàm ví dụ:
// runSimulation("LDUR X1, [X2, #12]");
// runSimulation("ADD X3, X4, X5");
// runSimulation("CBZ X1, label");

*/