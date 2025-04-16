import controlSignalTable from "./defineSignal.js";
import signalDestinations from "./signalDestinations.js";


const svgNS = "http://www.w3.org/2000/svg";
const signalNodesGroup = document.getElementById('control-signal-nodes');
const ALUOP_VISUAL_OFFSET_X = 8;
const ALUOP_VISUAL_OFFSET_Y = 0;

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
 * *** SỬA ĐỔI: Thêm lại tham số 'offset' và áp dụng transform ***
 * @param {string} signalName - Tên tín hiệu.
 * @param {0 | 1} value - Giá trị tín hiệu.
 * @param {string} pathId - ID của thẻ <path> gốc (chữ thường).
 * @param {number} [duration=2] - Thời gian animation.
 * @param {{x: number, y: number} | null} [offset=null] - Khoảng dịch chuyển CỐ ĐỊNH {x, y}.
 * @returns {SVGGElement | null} Phần tử <g> chứa node và animation.
 */
function createSignalNodeElement(signalName, value, pathId, duration = 5, offset = null) {
    // *** KIỂM TRA PATH GỐC ***
    const pathElement = document.getElementById(pathId); // Chỉ cần kiểm tra path gốc
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
    nodeGroup.setAttribute('visibility', 'hidden');

    if (offset && (offset.x !== 0 || offset.y !== 0)) {
        nodeGroup.setAttribute('transform', `translate(${offset.x}, ${offset.y})`);
    }

    // Tạo vòng tròn nền (giữ nguyên)
    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('r', '8');
    circle.setAttribute('fill', value === 1 ? '#FF4136' : '#0074D9');
    circle.setAttribute('stroke', 'black');
    circle.setAttribute('stroke-width', '1');

    // Tạo text hiển thị (giữ nguyên)
    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('font-size', '10');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('fill', 'white');
    text.textContent = value.toString();

    // Tạo animation (giữ nguyên, không có rotate)
    const animateMotion = document.createElementNS(svgNS, 'animateMotion');
    animateMotion.setAttribute('id', animationId);
    animateMotion.setAttribute('dur', `${duration}s`);
    animateMotion.setAttribute('begin', 'indefinite');
    animateMotion.setAttribute('fill', 'freeze');

    // *** === BẮT ĐẦU THAY ĐỔI BƯỚC 2 (Phần 2) === ***
    animateMotion.addEventListener('endEvent', () => {
        // Tra cứu ID đích từ bảng ánh xạ
        const destinationId = signalDestinations[signalName];

        if (destinationId) {
            // Nếu tìm thấy ID đích, log thông tin chi tiết hơn
            console.log(`Signal '${signalName}' (value: ${value}) reached destination element with ID: '${destinationId}'`);
            // Bước tiếp theo: Thay vì log, chúng ta sẽ tìm phần tử SVG đích và cập nhật nó.
        } else {
            // Nếu không có ID đích được định nghĩa cho tín hiệu này
            console.warn(`Signal '${signalName}' (value: ${value}) finished, but no destination ID is defined in signalDestinations.`);
        }
    });
    // *** === KẾT THÚC THAY ĐỔI BƯỚC 2 (Phần 2) === ***

    // *** LUÔN THAM CHIẾU ĐẾN PATH GỐC ***
    const mpath = document.createElementNS(svgNS, 'mpath');
    mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${pathId}`);

    animateMotion.appendChild(mpath);
    nodeGroup.appendChild(circle);
    nodeGroup.appendChild(text);
    nodeGroup.appendChild(animateMotion); // Animation gắn vào group đã được offset

    return nodeGroup;
}

/**
 * Hiển thị các node tín hiệu điều khiển trên datapath.
 * *** SỬA ĐỔI: Loại bỏ tạo path ảo, tính toán offset cố định ***
 * @param {object} signals - Đối tượng tín hiệu trả về từ generateControlSignals.
 */
export function displayControlSignalNodes(signals) {
    if (!signals) {
        console.log("No control signals generated to display.");
        return;
    }
    if (!signalNodesGroup) {
        console.error("SVG group 'control-signal-nodes' not found! Cannot display signals.");
        return;
    }

    // --- Chỉ cần dọn dẹp node cũ ---
    while (signalNodesGroup.firstChild) {
        signalNodesGroup.removeChild(signalNodesGroup.firstChild);
    }
    // --- KHÔNG CẦN clearTemporaryPaths() ---

    // --- KHÔNG CẦN Tạo path ảo ---

    for (const [signalName, value] of Object.entries(signals)) {
        let pathIdToUse; // Sẽ luôn là path gốc
        let nodeOffset = null; // Offset cố định
        const lowerCaseSignalName = signalName.toLowerCase();
        const originalAluOpPathId = 'control-aluop-path'; // ID gốc trong SVG

        // --- Xử lý ALUOp1/ALUOp0 để gán offset cố định ---
        if (lowerCaseSignalName === 'aluop1') {
            pathIdToUse = originalAluOpPathId;
            // Offset node 1 (ví dụ: sang trái/lên trên)
            nodeOffset = { x: -ALUOP_VISUAL_OFFSET_X, y: -ALUOP_VISUAL_OFFSET_Y };
        } else if (lowerCaseSignalName === 'aluop0') {
            pathIdToUse = originalAluOpPathId;
            // Offset node 0 (ví dụ: sang phải/xuống dưới)
            nodeOffset = { x: ALUOP_VISUAL_OFFSET_X, y: ALUOP_VISUAL_OFFSET_Y };
        }
        // --- Xử lý tín hiệu khác ---
        else {
            pathIdToUse = `control-${lowerCaseSignalName}-path`;
            // Không cần offset cho các tín hiệu khác
        }

        // --- Tạo node với offset cố định (nếu có) và path gốc ---
        const nodeElement = createSignalNodeElement(signalName, value, pathIdToUse, 2, nodeOffset);
        if (nodeElement) {
            signalNodesGroup.appendChild(nodeElement);
        }
    }
     console.log("Control signal nodes created (using fixed transform offset for ALUOp).");
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