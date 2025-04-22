import controlSignalTable from "./defineSignal.js";
import signalDestinations from "./signalDestinations.js";


const svgNS = "http://www.w3.org/2000/svg";
const signalNodesGroup = document.getElementById('control-signal-nodes');

// loại lệnh (ADD / ORR / XOR / AND)
let mnemonic = null;

/**
 * Tạo các tín hiệu điều khiển dựa trên lệnh đã được parse.
 * @param {object} parsedInstruction - Đối tượng lệnh đã được parse.
 * @returns {object | null} Một đối tượng với các tên tín hiệu điều khiển làm key
 *                           và giá trị 0 hoặc 1, hoặc null nếu lệnh không được hỗ trợ.
 */
export function generateControlSignals(parsedInstruction) {
    if (!parsedInstruction || parsedInstruction.error || !parsedInstruction.mnemonic) {
        console.error("Invalid or errored parsed instruction provided.");
        return null;
    }
    mnemonic = parsedInstruction.mnemonic;
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
    const finalSignals = { ...controlSignalTable[instructionClass] };

    // *** GỘP ALUOp1 VÀ ALUOp0 (NẾU CÓ) ***
    if (finalSignals.hasOwnProperty('ALUOp1') === false || finalSignals.hasOwnProperty('ALUOp0') === false) {
        console.warn("ALUOp1 or ALUOp0 missing in base signals for", instructionClass);
        return;
    }
    
    finalSignals.ALUOp = `${finalSignals.ALUOp1}${finalSignals.ALUOp0}`;
    delete finalSignals.ALUOp1;
    delete finalSignals.ALUOp0;
    console.log("Generated signals:", finalSignals);

    return finalSignals; // Trả về đối tượng signals đã được sửa đổi
}

/**
 * Tạo SVG cho một node tín hiệu (0/1 hoặc chuỗi) và animation của nó.
 * *** SỬA ĐỔI: Thêm tham số finalAluValue và cập nhật listener ***
 * @param {string} signalName - Tên tín hiệu.
 * @param {string|number} value - Giá trị tín hiệu hiển thị (0, 1, "10", "0010", ...).
 * @param {string} pathId - ID của thẻ <path> gốc (chữ thường).
 * @param {number} [duration=5] - Thời gian animation.
 * @param {string | null} [finalAluValue=null] - Giá trị 4-bit cuối cùng (chỉ dùng cho ALUOp).
 */
function createSignalNodeElement(signalName, value, pathId, duration) {
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
            if (typeof value !== 'undefined' && value !== null) {
                handleAluControlArrival(value, getValueEndPath(value));
            } else { 
                console.log("undefined value in ALUOp-> ALU Control"); 
                return null; 
            }
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
 * *** SỬA ĐỔI: Truyền finalAluControlSignal khi tạo node ALUOp ***
 */
export function displayControlSignalNodes(signals) {
    if (!signals) {
        console.warn("No control signals generated to display.");
        return;
    }
    if (!signalNodesGroup) {
        console.error("SVG group 'control-signal-nodes' not found! Cannot display signals.");
        return;
    }

    clearAluControlDisplay(); // Reset trước khi tạo mới

    for (const [signalName, value] of Object.entries(signals)) {
        let pathIdToUse;
        const lowerCaseSignalName = signalName.toLowerCase();
        pathIdToUse = `control-${lowerCaseSignalName}-path`; // Tìm path theo tên tín hiệu

        const nodeElement = createSignalNodeElement(
            signalName,
            value,
            pathIdToUse,
            2
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


// *** THÊM BIẾN LƯU ID CỦA setTimeout ĐANG CHỜ ***
let activeAluControlTimeoutId = null;
const ALU_CONTROL_DISPLAY_TEXT_ID = "alu-control-output-value";
const ALU_CONTROL_TO_ALU_NODE_ID_PREFIX = "node-ALUControlOutput-";
const ALU_CONTROL_TO_ALU_PATH_ID = "ALU-control-to-ALU-2-path";
const ALU_CONTROL_OUTPUT_DELAY = 500; // ms

/**
 * Hàm xóa text hiển thị, animation cũ, text ALU và reset biến tạm,
 * *** SỬA ĐỔI: Hủy bỏ setTimeout đang chờ ***
 */
function clearAluControlDisplay() {
    // Xóa text trong ALU Control
    const existingAluControlText = document.getElementById(ALU_CONTROL_DISPLAY_TEXT_ID);
    if (existingAluControlText) existingAluControlText.remove();

    // Xóa animation cũ từ ALU Control -> ALU
    const oldAnimNodes = signalNodesGroup.querySelectorAll(`g[id^="${ALU_CONTROL_TO_ALU_NODE_ID_PREFIX}"]`);
    oldAnimNodes.forEach(node => node.remove());
    // Xóa text trong ALU chính
    const mainAluElement = document.getElementById('add-2');
    if (mainAluElement) {
        const aluActionText = mainAluElement.querySelector('.alu-action-text');
        if (aluActionText) aluActionText.remove();
    }

    // Hủy bỏ setTimeout đang chờ (vẫn cần thiết)
    if (activeAluControlTimeoutId) {
        clearTimeout(activeAluControlTimeoutId);
        activeAluControlTimeoutId = null;
        console.log("Cleared pending ALU Control output timeout.");
    }

    while (signalNodesGroup.firstChild) {
        signalNodesGroup.removeChild(signalNodesGroup.firstChild);
    }
}

/**
 * Hàm xử lý khi tín hiệu ALUOp kết hợp đến ALU Control.
 * *** SỬA ĐỔI: Nhận cả finalSignalToSend làm tham số ***
 * @param {string} arrivedAluOpValue - Giá trị ALUOp kết hợp (ví dụ: "10")
 * @param {string | null} finalSignalToSend - Tín hiệu 4-bit cuối cùng cần gửi đi (ví dụ: "0010")
 */
function handleAluControlArrival(arrivedAluOpValue, finalSignalToSend) {

    // Kiểm tra tham số đầu vào (phòng ngừa)
    if (typeof arrivedAluOpValue === 'undefined' || arrivedAluOpValue === null) {
        console.error("handleAluControlArrival called with invalid arrivedAluOpValue");
        return;
    }
    if (typeof finalSignalToSend === 'undefined' || finalSignalToSend === null) {
        console.error("handleAluControlArrival called with invalid finalSignalToSend");
        return;
    }

    console.log(`Combined ALUOp signal arrived at ALU Control. Value: ${arrivedAluOpValue}. Final signal to send: ${finalSignalToSend}`);

    const aluControlElement = document.getElementById("ALU-control");
    if (!aluControlElement) {
        console.error("ALU Control element with ID 'ALU-control' not found!");
        return;
    }


    // --- Hiển thị giá trị ALUOp ---
    let displayText = document.getElementById(ALU_CONTROL_DISPLAY_TEXT_ID);
    if (!displayText) {
        displayText = document.createElementNS(svgNS, 'text');
        // ... (set attributes) ...
        displayText.setAttribute('id', ALU_CONTROL_DISPLAY_TEXT_ID);
        displayText.setAttribute('x', '0'); displayText.setAttribute('y', '30');
        displayText.setAttribute('text-anchor', 'middle'); displayText.setAttribute('dominant-baseline', 'central');
        displayText.setAttribute('font-size', '12'); displayText.setAttribute('font-weight', 'bold');
        displayText.setAttribute('fill', 'black');
        aluControlElement.appendChild(displayText);
    }
    displayText.textContent = arrivedAluOpValue; // Hiển thị "10", "00", "01"
    // --- Hết phần hiển thị ---

    if (activeAluControlTimeoutId) {
        clearTimeout(activeAluControlTimeoutId); // Hủy timeout cũ nếu có
    }

    // --- Lên lịch tạo animation mới ---
    activeAluControlTimeoutId = setTimeout(() => {
        
        if (finalSignalToSend === "XXXX") { // Kiểm tra giá trị lỗi nếu có
            console.error("Final ALU control signal is invalid ('XXXX'). Cannot send signal to ALU.");
            activeAluControlTimeoutId = null;
            return;
       }

        console.log(`Sending final ALU control signal "${finalSignalToSend}" to ALU...`);
        const newNodeSignalName = `${ALU_CONTROL_TO_ALU_NODE_ID_PREFIX}${finalSignalToSend}`;

        // Tạo node mới với giá trị 4-bit cuối cùng
        const newNodeElement = createSignalNodeElement(
            newNodeSignalName,
            finalSignalToSend,
            ALU_CONTROL_TO_ALU_PATH_ID,
            2, // duration
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
        activeAluControlTimeoutId = null;
    }, ALU_CONTROL_OUTPUT_DELAY);
}

function getValueEndPath(aluOpCombined) {
    let finalAluControlSignalValue = null; // Giá trị 4-bit cuối cùng

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
    return finalAluControlSignalValue;
}