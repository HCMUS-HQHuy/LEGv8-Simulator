import controlSignalTable from "./defineSignal.js";
import signalDestinations from "./signalDestinations.js";


const svgNS = "http://www.w3.org/2000/svg";
const signalNodesGroup = document.getElementById('control-signal-nodes');

/**
 * Tạo các tín hiệu điều khiển dựa trên lệnh đã được parse.
 * *** SỬA ĐỔI: Gộp ALUOp1 và ALUOp0 thành ALUOp ***
 * @param {object} parsedInstruction - Đối tượng lệnh đã được parse.
 * @returns {object | null} Một đối tượng với các tên tín hiệu điều khiển làm key
 *                           và giá trị 0 hoặc 1, hoặc null nếu lệnh không được hỗ trợ.
 */
export function generateControlSignals(parsedInstruction) {
    if (!parsedInstruction || parsedInstruction.error || !parsedInstruction.mnemonic) {
        console.error("Invalid or errored parsed instruction provided.");
        return null;
    }
    const mnemonic = parsedInstruction.mnemonic;
    const type = parsedInstruction.type;
    let instructionClass = null;

    // Xác định instructionClass như cũ...
    if (type === 'R' && controlSignalTable["R-format"]) { instructionClass = "R-format"; }
    else if (mnemonic === 'LDUR' && controlSignalTable["LDUR"]) { instructionClass = "LDUR"; }
    else if (mnemonic === 'STUR' && controlSignalTable["STUR"]) { instructionClass = "STUR"; }
    else if (mnemonic === 'CBZ' && controlSignalTable["CBZ"]) { instructionClass = "CBZ"; }
    else {
        console.warn(`Control signals not defined for instruction: ${mnemonic} (Type: ${type})`);
        return null;
    }

    // Lấy các tín hiệu gốc từ bảng
    const baseSignals = controlSignalTable[instructionClass];
    // Tạo bản sao để sửa đổi
    const finalSignals = { ...baseSignals };
    let finalAluControlSignalValue = null; // Giá trị 4-bit cuối cùng

    // *** GỘP ALUOp1 VÀ ALUOp0 (NẾU CÓ) ***
    if (finalSignals.hasOwnProperty('ALUOp1') && finalSignals.hasOwnProperty('ALUOp0')) {
        const aluOpCombined = `${finalSignals.ALUOp1}${finalSignals.ALUOp0}`;
        finalSignals.ALUOp = aluOpCombined;
        delete finalSignals.ALUOp1;
        delete finalSignals.ALUOp0;

        
        // Tính giá trị 4-bit dựa trên ALUOp và loại lệnh/mnemonic
        switch (aluOpCombined) {
            case "00": // LDUR, STUR
                finalAluControlSignalValue = "0010"; // add
                break;
            case "01": // CBZ
                finalAluControlSignalValue = "0111"; // pass input b (hoặc subtract nếu ALU làm vậy)
                break;
            case "10": // R-type
                switch (mnemonic) { // Cần mnemonic để phân biệt R-type
                    case 'ADD':
                        finalAluControlSignalValue = "0010"; // add
                        break;
                    case 'SUB':
                        finalAluControlSignalValue = "0110"; // subtract
                        break;
                    case 'AND':
                        finalAluControlSignalValue = "0000"; // AND
                        break;
                    case 'ORR':
                        finalAluControlSignalValue = "0001"; // OR
                        break;
                    // Thêm các lệnh R-type khác nếu cần
                    default:
                        console.warn(`Unknown R-type mnemonic '${mnemonic}' for ALUOp=10. Defaulting ALU control.`);
                        finalAluControlSignalValue = "XXXX"; // Hoặc một giá trị mặc định/lỗi
                }
                break;
            default:
                console.warn(`Unknown ALUOp combination: ${aluOpCombined}`);
                finalAluControlSignalValue = "XXXX"; // Giá trị lỗi
        }
    }
    else {
        // Trường hợp không có ALUOp1/0 (có thể xảy ra nếu bảng thay đổi)
         console.warn("ALUOp1 or ALUOp0 missing in base signals for", instructionClass);
         finalAluControlSignalValue = "XXXX";
    }

    // Thêm tín hiệu 4-bit cuối cùng vào kết quả
    finalSignals.finalAluControlSignal = finalAluControlSignalValue;
    console.log("Generated signals:", finalSignals);

    return finalSignals; // Trả về đối tượng signals đã được sửa đổi
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
function createSignalNodeElement(signalName, value, pathId, duration = 5) {
    // *** KIỂM TRA PATH GỐC ***
    const pathElement = document.getElementById(pathId);
    if (!pathElement) {
        console.warn(`SVG Path Element with ID "${pathId}" (lowercase expected) not found. Cannot create animation node for signal "${signalName}". Check SVG ID definition.`);
        return null;
    }
    const nodeGroupId = `node-${signalName}`;
    const animationId = `anim-${signalName}`;
    const existingNode = document.getElementById(nodeGroupId);
    if (existingNode) existingNode.remove();

    const nodeGroup = document.createElementNS(svgNS, 'g');
    nodeGroup.setAttribute('id', nodeGroupId);
    nodeGroup.setAttribute('visibility', 'hidden');

    // --- Tạo circle và text (điều chỉnh kích thước/màu sắc) ---
    const circle = document.createElementNS(svgNS, 'circle');
    const isMultiBit = typeof value === 'string' && value.length > 1;
    const radius = isMultiBit ? 10 : 8; // Lớn hơn cho multi-bit
    circle.setAttribute('r', String(radius));
    let fillColor = '#0074D9'; // Default blue (0)
    if (value === 1 || value === '1') { fillColor = '#FF4136'; }
    else if (isMultiBit && signalName === 'ALUOp') { fillColor = '#FF851B'; }
    else if (isMultiBit && signalName.startsWith(ALU_CONTROL_TO_ALU_NODE_ID_PREFIX)) { fillColor = '#2ECC40'; }
    circle.setAttribute('fill', fillColor);
    circle.setAttribute('stroke', 'black');
    circle.setAttribute('stroke-width', '1');

    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    const fontSize = isMultiBit ? 9 : 10;
    text.setAttribute('font-size', String(fontSize));
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('fill', 'white');
    text.textContent = (typeof value !== 'undefined' && value !== null) ? value.toString() : '?';
    // --- Hết tạo circle/text ---


    const animateMotion = document.createElementNS(svgNS, 'animateMotion');
    animateMotion.setAttribute('id', animationId);
    animateMotion.setAttribute('dur', `${duration}s`);
    animateMotion.setAttribute('begin', 'indefinite');
    animateMotion.setAttribute('fill', 'freeze');

    // XỬ LÝ SỰ KIỆN KẾT THÚC
    animateMotion.addEventListener('endEvent', () => {
        const destinationId = signalDestinations[signalName]; // Tra cứu đích gốc

        // Khi tín hiệu "ALUOp" kết hợp đến ALU Control
        if (signalName === 'ALUOp' && destinationId === 'ALU-control') {
            handleAluControlArrival(value); // Gọi hàm xử lý (truyền giá trị "10", "00", "01")
        }
        // Khi tín hiệu 4-bit cuối cùng đến ALU chính
        else if (signalName.startsWith(ALU_CONTROL_TO_ALU_NODE_ID_PREFIX)) {
             console.log(`Final ALU Control Signal '${value}' reached main ALU (add-2).`);
             // TODO: Logic cập nhật trạng thái/hình ảnh ALU chính ở đây
             // Ví dụ: tìm phần tử 'add-2' và thay đổi text bên trong nó?
             const mainAluElement = document.getElementById('add-2'); // Hoặc 'main-alu' nếu bạn đổi ID
             if (mainAluElement) {
                 let aluActionText = mainAluElement.querySelector('.alu-action-text'); // Thêm class này nếu muốn
                 if (!aluActionText) {
                     aluActionText = document.createElementNS(svgNS, 'text');
                     aluActionText.setAttribute('class', 'alu-action-text');
                     aluActionText.setAttribute('x', '60'); // Vị trí ví dụ
                     aluActionText.setAttribute('y', '110'); // Vị trí ví dụ
                     aluActionText.setAttribute('font-size', '10');
                     aluActionText.setAttribute('text-anchor', 'middle');
                     mainAluElement.appendChild(aluActionText);
                 }
                 // Tìm tên phép toán từ giá trị 4-bit
                 let operationName = 'Unknown';
                 if(value === "0010") operationName = 'ADD';
                 else if(value === "0110") operationName = 'SUB';
                 else if(value === "0000") operationName = 'AND';
                 else if(value === "0001") operationName = 'ORR';
                 else if(value === "0111") operationName = 'PASS B'; // Hoặc SUB?
                 aluActionText.textContent = `Op: ${operationName}`;
             }
        }
        // Xử lý các tín hiệu khác đến đích
        else if (destinationId) {
            console.log(`Signal '${signalName}' (value: ${value}) reached destination element with ID: '${destinationId}'`);
            // TODO: Logic tương tác với các phần tử đích khác
        }
        // Cảnh báo không có đích
        else {
            console.warn(`Signal '${signalName}' (value: ${value}) finished, but no destination ID defined.`);
        }
    });

    const mpath = document.createElementNS(svgNS, 'mpath');
    mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${pathId}`);

    animateMotion.appendChild(mpath);
    nodeGroup.appendChild(circle);
    nodeGroup.appendChild(text);
    nodeGroup.appendChild(animateMotion);

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

    // Lưu tín hiệu ALU cuối cùng vào biến tạm
    pendingFinalAluSignal = signals.finalAluControlSignal || null;
    if(pendingFinalAluSignal === null){
        console.warn("Could not determine final ALU control signal in displayControlSignalNodes.");
    }

    // clearAluControlDisplay(); // Reset trước khi tạo mới
    while (signalNodesGroup.firstChild) {
        signalNodesGroup.removeChild(signalNodesGroup.firstChild);
    }

    for (const [signalName, value] of Object.entries(signals)) {
        // Bỏ qua việc tạo node cho tín hiệu 4-bit ở đây, nó sẽ được tạo sau
        if (signalName === 'finalAluControlSignal') {
            continue;
        }

        let pathIdToUse;
        const lowerCaseSignalName = signalName.toLowerCase();
        pathIdToUse = `control-${lowerCaseSignalName}-path`; // Tìm path theo tên tín hiệu

        const nodeElement = createSignalNodeElement(
            signalName,
            value,
            pathIdToUse,
            2,
            null // Không offset
        );
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

// --- BIẾN TRẠNG THÁI ---
let pendingFinalAluSignal = null; // Lưu trữ tín hiệu ALU 4-bit cuối cùng
const ALU_CONTROL_DISPLAY_TEXT_ID = "alu-control-output-value";
const ALU_CONTROL_TO_ALU_NODE_ID_PREFIX = "node-ALUControlOutput-";
const ALU_CONTROL_TO_ALU_PATH_ID = "ALU-control-to-ALU-2-path";
const ALU_CONTROL_OUTPUT_DELAY = 500; // ms

/**
 * Hàm xóa text hiển thị giá trị trong ALU Control, animation cũ,
 * text phép toán trong ALU chính và reset biến tạm
 * *** SỬA ĐỔI: Thêm logic xóa text trong ALU chính ***
 */
function clearAluControlDisplay() {
    // Xóa text trong ALU Control
    const existingAluControlText = document.getElementById(ALU_CONTROL_DISPLAY_TEXT_ID);
    if (existingAluControlText) {
        existingAluControlText.remove();
    }
    // Xóa animation cũ từ ALU Control -> ALU
    const oldAnimNodes = signalNodesGroup.querySelectorAll(`g[id^="${ALU_CONTROL_TO_ALU_NODE_ID_PREFIX}"]`);
    oldAnimNodes.forEach(node => node.remove());

    // *** BẮT ĐẦU THAY ĐỔI MỚI ***
    // Xóa text hiển thị phép toán cũ trong ALU chính
    const mainAluElement = document.getElementById('add-2'); // Hoặc ID của ALU chính nếu khác
    if (mainAluElement) {
        const aluActionText = mainAluElement.querySelector('.alu-action-text'); // Tìm bằng class đã đặt
        if (aluActionText) {
            aluActionText.remove(); // Xóa đi
            console.log("Cleared previous ALU action text.");
        }
    }
    // *** KẾT THÚC THAY ĐỔI MỚI ***

    pendingFinalAluSignal = null; // Reset biến tạm
}

/**
 * Hàm xử lý khi tín hiệu ALUOp kết hợp đến ALU Control:
 * Hiển thị giá trị và kích hoạt animation mới đến ALU chính
 * @param {string} arrivedAluOpValue - Giá trị kết hợp (ví dụ: "10")
 */
function handleAluControlArrival(arrivedAluOpValue) {
    console.log(`Combined ALUOp signal arrived at ALU Control. Value: ${arrivedAluOpValue}`);

    const aluControlElement = document.getElementById("ALU-control");
    if (!aluControlElement) {
        console.error("ALU Control element with ID 'ALU-control' not found!");
        return;
    }

    // --- Hiển thị giá trị ALUOp (đã đến) bên trong ALU Control ---
    let displayText = document.getElementById(ALU_CONTROL_DISPLAY_TEXT_ID);
    if (!displayText) {
        displayText = document.createElementNS(svgNS, 'text');
        displayText.setAttribute('id', ALU_CONTROL_DISPLAY_TEXT_ID);
        displayText.setAttribute('x', '0'); // Chỉnh lại nếu cần
        displayText.setAttribute('y', '30'); // Chỉnh lại nếu cần
        displayText.setAttribute('text-anchor', 'middle');
        displayText.setAttribute('dominant-baseline', 'central');
        displayText.setAttribute('font-size', '12');
        displayText.setAttribute('font-weight', 'bold');
        displayText.setAttribute('fill', 'black');
        aluControlElement.appendChild(displayText);
    }
    displayText.textContent = arrivedAluOpValue; // Hiển thị "10", "00", "01"
    // --- Hết phần hiển thị ---

    // --- Lên lịch tạo animation mới ---
    setTimeout(() => {
        // Lấy giá trị 4-bit cuối cùng từ biến tạm
        const finalSignalToSend = pendingFinalAluSignal;

        if (finalSignalToSend === null) {
            console.error("Cannot send signal from ALU Control to ALU: pendingFinalAluSignal is null!");
            return;
        }

        console.log(`Sending final ALU control signal "${finalSignalToSend}" to ALU...`);
        const newNodeSignalName = `${ALU_CONTROL_TO_ALU_NODE_ID_PREFIX}${finalSignalToSend}`;

        // Tạo node mới với giá trị 4-bit cuối cùng
        const newNodeElement = createSignalNodeElement(
            newNodeSignalName,
            finalSignalToSend, // <<<--- SỬ DỤNG GIÁ TRỊ 4-BIT
            ALU_CONTROL_TO_ALU_PATH_ID,
            2, // duration
            null // offset
        );

        if (newNodeElement) {
            signalNodesGroup.appendChild(newNodeElement);
            const newAnimation = newNodeElement.querySelector('animateMotion');
            if (newAnimation) {
                const parentGroup = newAnimation.closest('g');
                if (parentGroup) parentGroup.setAttribute('visibility', 'visible');
                newAnimation.beginElement();
            }
        }
    }, ALU_CONTROL_OUTPUT_DELAY);
}

