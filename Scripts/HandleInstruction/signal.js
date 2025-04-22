import controlSignalTable from "./defineSignal.js";
import signalDestinations from "./signalDestinations.js";


const svgNS = "http://www.w3.org/2000/svg";
const signalNodesGroup = document.getElementById('control-signal-nodes');
const dataSignalNodesGroup = document.getElementById('data-signal-nodes'); // Cần group này

// *** THÊM BIẾN LƯU ID CỦA setTimeout ĐANG CHỜ ***
let activeAluControlTimeoutId = null;
const ALU_CONTROL_DISPLAY_TEXT_ID = "alu-control-output-value";
const ALU_CONTROL_TO_ALU_NODE_ID_PREFIX = "node-ALUControlOutput-";
const ALU_CONTROL_TO_ALU_PATH_ID = "ALU-control-to-ALU-2-path";
const ALU_CONTROL_OUTPUT_DELAY = 500; // ms


// --- PATH IDs CHO FETCH (Lấy từ SVG bạn cung cấp) ---
const PC_TO_IMEM_PATH_ID = "pc-to-instruction-memory-path";
// Giả định có một path cho Lệnh đi ra, ví dụ đến khu vực Decode/Register Read
// !! THAY THẾ BẰNG ID THỰC TẾ NẾU CÓ !!
const IMEM_OUTPUT_BASE_PATH_ID = "instruction-memory-output-base-path"; // Path gốc lệnh đi ra
// Path cho các trường cụ thể (lấy từ SVG)
const IMEM_OPCODE_TO_CONTROL_PATH_ID = "instruction-memory-to-control-path";
const IMEM_RN_TO_REG_PATH_ID = "instruction-memory-to-data-memory-path"; // Dùng tạm path này, bạn cần path đúng đến Reg1
const IMEM_RM_TO_REG_PATH_ID = "instruction-memory-to-mux-1-1-path"; // Dùng tạm path này, bạn cần path đúng đến Reg2 (cho R-type)
const IMEM_RT_TO_REG_PATH_ID = "instruction-memory-to-mux-1-0-path"; // Dùng tạm path này, bạn cần path đúng đến Reg2 (cho load/store/CBZ)
const IMEM_RD_TO_REG_PATH_ID = "instruction-memory-to-register-path"; // Path đến Write Register port
const IMEM_IMM_TO_SIGN_EXTEND_PATH_ID = "instruction-memory-to-sign-extend-path";
const IMEM_BRANCH_ADDR_TO_SHIFT_PATH_ID = "instruction-memory-to-alu-control-path"; // Dùng tạm path này, bạn cần path đến shift left 2
const IMEM_FUNC_TO_ALU_CONTROL_PATH_ID = "instruction-memory-to-alu-control-path";

// --- Hằng số animation ---
const DEFAULT_ANIMATION_DURATION = 5; // giây
const FETCH_ANIMATION_DURATION = 3; // giây (cho PC -> Mem)

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

export function clearAllDisplaysAndSignals() {
    // Xóa text trong ALU Control
    const existingAluControlText = document.getElementById(ALU_CONTROL_DISPLAY_TEXT_ID);
    if (existingAluControlText) existingAluControlText.remove();

    // Xóa text trong ALU chính
    const mainAluElement = document.getElementById('add-2'); // ID ALU chính
    if (mainAluElement) {
        const aluActionText = mainAluElement.querySelector('.alu-action-text');
        if (aluActionText) aluActionText.remove();
    }

    // Hủy timeout đang chờ
    if (activeAluControlTimeoutId) {
        clearTimeout(activeAluControlTimeoutId);
        activeAluControlTimeoutId = null;
    }

    // Xóa tất cả các node tín hiệu (Control và Data)
    if (signalNodesGroup) {
        while (signalNodesGroup.firstChild) {
            signalNodesGroup.removeChild(signalNodesGroup.firstChild);
        }
    }
    if (dataSignalNodesGroup) {
        while (dataSignalNodesGroup.firstChild) {
            dataSignalNodesGroup.removeChild(dataSignalNodesGroup.firstChild);
        }
    }
    console.log("Cleared all signal displays and states.");
}


/**
 * Tạo và bắt đầu animation cho PC đi đến Instruction Memory (NEW)
 * @param {number} pcValue - Giá trị PC để hiển thị trong animation
 */
export function animatePCToMemory(pcValue) {
    if (!dataSignalNodesGroup) return;
    if (!PC_TO_IMEM_PATH_ID) {
        console.warn("Path ID 'PC_TO_IMEM_PATH_ID' is not defined.");
        return;
    }
    const pathElement = document.getElementById(PC_TO_IMEM_PATH_ID);
    if (!pathElement) {
        console.warn(`Path Element ID "${PC_TO_IMEM_PATH_ID}" not found.`);
        return;
    }

    const fieldName = "PC_Addr";
    const nodeGroupId = `data-node-${fieldName}`;
    const animationId = `data-anim-${fieldName}`;

    // Xóa node cũ nếu có
    const existingNode = document.getElementById(nodeGroupId);
    if (existingNode) existingNode.remove();

    // Tạo node mới (dùng hình chữ nhật cho địa chỉ)
    const nodeGroup = document.createElementNS(svgNS, 'g');
    nodeGroup.setAttribute('id', nodeGroupId);
    nodeGroup.setAttribute('visibility', 'visible'); // Hiện ngay

    const hexValue = `0x${pcValue.toString(16).toUpperCase().padStart(8, '0')}`;

    const shape = document.createElementNS(svgNS, 'rect');
    const width = 40; const height = 16;
    shape.setAttribute('width', String(width)); shape.setAttribute('height', String(height));
    shape.setAttribute('rx', 3); shape.setAttribute('ry', 3);
    shape.setAttribute('x', String(-width / 2)); shape.setAttribute('y', String(-height / 2));
    shape.setAttribute('fill', '#FFC107'); // Màu vàng cho PC?
    shape.setAttribute('stroke', 'black'); shape.setAttribute('stroke-width', '1');

    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('text-anchor', 'middle'); text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('font-size', '8'); // Font nhỏ
    text.setAttribute('font-weight', 'normal');
    text.setAttribute('fill', 'black'); // Chữ đen trên nền vàng
    text.textContent = hexValue;

    const animateMotion = document.createElementNS(svgNS, 'animateMotion');
    animateMotion.setAttribute('id', animationId);
    animateMotion.setAttribute('dur', `${FETCH_ANIMATION_DURATION}s`); // Thời gian fetch
    animateMotion.setAttribute('begin', 'indefinite');
    animateMotion.setAttribute('fill', 'freeze');

    // Xóa node sau khi animation kết thúc (không cần giữ lại ở đích)
    animateMotion.addEventListener('endEvent', (event) => {
        console.log(`PC value ${hexValue} reached Instruction Memory.`);
        event.target.closest('g')?.remove(); // Tự hủy node khi đến nơi
    });

    const mpath = document.createElementNS(svgNS, 'mpath');
    mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${PC_TO_IMEM_PATH_ID}`);

    animateMotion.appendChild(mpath);
    nodeGroup.appendChild(shape);
    nodeGroup.appendChild(text);
    nodeGroup.appendChild(animateMotion);

    dataSignalNodesGroup.appendChild(nodeGroup); // Thêm vào group data signals
    animateMotion.beginElement(); // Bắt đầu ngay
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

// (displayControlSignalNodes cập nhật để nhận cờ `startNow`)
// (displayControlSignalNodes cập nhật để nhận cờ `startNow`)
export function displayControlSignalNodes(signals, startNow = true) {
    clearAllDisplaysAndSignals(); // Gọi hàm dọn dẹp mới

    if (!signals || !signalNodesGroup) { /* ... */ return; }
    // while (signalNodesGroup.firstChild) { /* Đã chuyển vào clearAll */ }

    for (const [signalName, value] of Object.entries(signals)) {
        if (signalName === 'finalAluControlSignal') { continue; }
        let pathIdToUse = `control-${signalName.toLowerCase()}-path`;
        const finalAluValueForNode = (signalName === 'ALUOp') ? signals.finalAluControlSignal : null;

        const nodeElement = createSignalNodeElement(
            signalName, value, pathIdToUse, DEFAULT_ANIMATION_DURATION, finalAluValueForNode
        );
        if (nodeElement) {
            signalNodesGroup.appendChild(nodeElement);
            // KHÔNG bắt đầu animation ở đây nếu startNow = false
            if (!startNow) {
                 const anim = nodeElement.querySelector('animateMotion');
                 const group = anim.closest('g');
                 if(group) group.setAttribute('visibility', 'hidden'); // Đảm bảo ẩn ban đầu
            }
        }
    }
    console.log(`Control signal nodes created (startNow=${startNow}).`);
    if (startNow) {
        startControlSignalAnimation(); // Bắt đầu ngay nếu được yêu cầu
    }
}

/**
 * Hiển thị data signal nodes (instruction fields).
 * @param {object} parsedInstruction - Lệnh đã parse.
 * @param {string} encodedInstruction - Mã máy 32-bit.
 * @param {boolean} [startNow=true] - Có bắt đầu animation ngay không.
 */
export function displayDataSignalNodes(parsedInstruction, encodedInstruction, startNow = true) {
    if (!dataSignalNodesGroup) {
        console.warn("dataSignalNodesGroup is null!");
        return;
    }
    // while (dataSignalNodesGroup.firstChild) { /* Đã chuyển vào clearAll */ }

    if (!parsedInstruction || parsedInstruction.error || !encodedInstruction) {
       console.log("No valid instruction/encoding to display data signals.");
       return;
    }

    // --- Tách các trường từ mã máy 32-bit ---
    // Thứ tự bit theo LEGv8/ARMv8 thường là từ phải sang trái (LSB là bit 0)
    const opcode = encodedInstruction.substring(0, 11); // Bit 31-21 (11 bits)
    const rm     = encodedInstruction.substring(11, 16); // Bit 20-16 (5 bits) - Thường là Rm hoặc Rt
    const shamt  = encodedInstruction.substring(16, 22); // Bit 15-10 (6 bits)
    const rn     = encodedInstruction.substring(22, 27); // Bit 9-5  (5 bits) - Thường là Rn
    const rd     = encodedInstruction.substring(27, 32); // Bit 4-0  (5 bits) - Thường là Rd hoặc Rt

    // Các trường khác tùy loại lệnh (cần parse sâu hơn hoặc dùng trực tiếp từ encoded)
    const dt_address = encodedInstruction.substring(11, 20); // D-format DT address (9 bits) - Bit 20-12
    const i_immediate = encodedInstruction.substring(10, 22); // I-format immediate (12 bits) - Bit 21-10
    const cb_address = encodedInstruction.substring(8, 27); // CB-format address (19 bits) - Bit 26-8
    // ... và các trường khác

    console.log("Creating data signal nodes for:", parsedInstruction.mnemonic);

    // --- Tạo node cho các trường dựa trên đường dẫn đã định nghĩa ---
    // Gửi Opcode/phần đầu đến Control Unit
    if (IMEM_OPCODE_TO_CONTROL_PATH_ID) {
        const node = createDataNodeElement(`Op [31-21]`, opcode, IMEM_OPCODE_TO_CONTROL_PATH_ID);
        if (node) dataSignalNodesGroup.appendChild(node);
    }
    // Gửi Rn đến cổng đọc Register 1
    if (IMEM_RN_TO_REG_PATH_ID && (parsedInstruction.type === 'R' || parsedInstruction.type === 'D' || parsedInstruction.type === 'I')) { // Rn dùng trong R, D, I
        const node = createDataNodeElement(`Rn [9-5]`, rn, IMEM_RN_TO_REG_PATH_ID);
        if (node) dataSignalNodesGroup.appendChild(node);
    }
    // Gửi Rm đến cổng đọc Register 2 (cho R-type)
    if (IMEM_RM_TO_REG_PATH_ID && parsedInstruction.type === 'R') {
        const node = createDataNodeElement(`Rm [20-16]`, rm, IMEM_RM_TO_REG_PATH_ID);
        if (node) dataSignalNodesGroup.appendChild(node);
    }
    // Gửi Rt đến cổng đọc Register 2 (cho D-type load/store, CBZ check)
    if (IMEM_RT_TO_REG_PATH_ID && (parsedInstruction.type === 'D' || parsedInstruction.type === 'CB')) {
        const node = createDataNodeElement(`Rt [4-0 or 20-16]`, parsedInstruction.type === 'CB' ? rd : rm, IMEM_RT_TO_REG_PATH_ID); // Rt là bit 4-0 hoặc 20-16 tùy ngữ cảnh parse
        if (node) dataSignalNodesGroup.appendChild(node);
    }
    // Gửi Rd đến cổng Write Register (cho R-type, I-type, LDUR)
    if (IMEM_RD_TO_REG_PATH_ID && (parsedInstruction.type === 'R' || parsedInstruction.type === 'I' || parsedInstruction.mnemonic === 'LDUR')) {
         const node = createDataNodeElement(`Rd [4-0]`, rd, IMEM_RD_TO_REG_PATH_ID);
         if (node) dataSignalNodesGroup.appendChild(node);
    }
    // Gửi Immediate đến Sign Extend (cho D-type, I-type)
    if (IMEM_IMM_TO_SIGN_EXTEND_PATH_ID && (parsedInstruction.type === 'D' || parsedInstruction.type === 'I')) {
        const immediateValue = parsedInstruction.type === 'D' ? dt_address : i_immediate;
        const node = createDataNodeElement(`Imm`, immediateValue, IMEM_IMM_TO_SIGN_EXTEND_PATH_ID);
        if (node) dataSignalNodesGroup.appendChild(node);
    }
   // Gửi Branch Address đến Shifter (cho CB-type, B-type)
    if (IMEM_BRANCH_ADDR_TO_SHIFT_PATH_ID && (parsedInstruction.type === 'CB' || parsedInstruction.type === 'B')) {
        const branchAddr = parsedInstruction.type === 'CB' ? cb_address : encodedInstruction.substring(6, 32); // B-format addr 26 bits
        const node = createDataNodeElement(`BrAddr`, branchAddr, IMEM_BRANCH_ADDR_TO_SHIFT_PATH_ID);
        if (node) dataSignalNodesGroup.appendChild(node);
    }
    // Gửi Function/shamt đến ALU Control (cho R-type)
     if (IMEM_FUNC_TO_ALU_CONTROL_PATH_ID && parsedInstruction.type === 'R') {
        const funcValue = shamt; // Giả sử shamt hoặc phần khác của opcode chứa thông tin func
        const node = createDataNodeElement(`Func/Shamt`, funcValue, IMEM_FUNC_TO_ALU_CONTROL_PATH_ID);
        if (node) dataSignalNodesGroup.appendChild(node);
    }

    console.log("Data signal nodes created.");
     if (startNow) {
         startDataSignalAnimation();
     }
}

/**
 * Tạo node cho giá trị dữ liệu (có thể là số hoặc chuỗi bit)
 */
function createDataNodeElement(fieldName, value, pathId, duration = DEFAULT_ANIMATION_DURATION) {
    if (!dataSignalNodesGroup) return null;
   const pathElement = document.getElementById(pathId);
   if (!pathElement) {
       console.warn(`Data Path Element ID "${pathId}" not found for field "${fieldName}".`);
       return null;
   }
   const nodeGroupId = `data-node-${fieldName.replace(/\[|\]|-/g, '_')}`; // Tạo ID hợp lệ
   const animationId = `data-anim-${fieldName.replace(/\[|\]|-/g, '_')}`;
   const existingNode = document.getElementById(nodeGroupId);
   if (existingNode) existingNode.remove();

   const nodeGroup = document.createElementNS(svgNS, 'g');
   nodeGroup.setAttribute('id', nodeGroupId);
   nodeGroup.setAttribute('visibility', 'hidden'); // Ẩn ban đầu

   const valueStr = value.toString();
   const isLong = valueStr.length > 5; // Ví dụ: coi > 5 ký tự là dài

   // Sử dụng hình chữ nhật
   const shape = document.createElementNS(svgNS, 'rect');
   const width = isLong ? 40 : 20;
   const height = 16;
   shape.setAttribute('width', String(width));
   shape.setAttribute('height', String(height));
   shape.setAttribute('rx', 3); shape.setAttribute('ry', 3);
   shape.setAttribute('x', String(-width / 2)); // Canh giữa
   shape.setAttribute('y', String(-height / 2));
   shape.setAttribute('fill', '#4CAF50'); // Màu xanh lá cho data
   shape.setAttribute('stroke', 'black');
   shape.setAttribute('stroke-width', '1');

   const text = document.createElementNS(svgNS, 'text');
   text.setAttribute('text-anchor', 'middle');
   text.setAttribute('dominant-baseline', 'central');
   text.setAttribute('font-size', isLong ? '7' : '9'); // Font nhỏ hơn nữa
   text.setAttribute('font-weight', 'normal'); // Không cần đậm?
   text.setAttribute('fill', 'white');
   text.textContent = valueStr;

   const animateMotion = document.createElementNS(svgNS, 'animateMotion');
   animateMotion.setAttribute('id', animationId);
   animateMotion.setAttribute('dur', `${duration}s`);
   animateMotion.setAttribute('begin', 'indefinite');
   animateMotion.setAttribute('fill', 'freeze');

   animateMotion.addEventListener('endEvent', () => {
       console.log(`Data field '${fieldName}' (value: ${value}) animation finished.`);
       // TODO: Xử lý khi data đến đích
   });

   const mpath = document.createElementNS(svgNS, 'mpath');
   mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${pathId}`);

   animateMotion.appendChild(mpath);
   nodeGroup.appendChild(shape);
   nodeGroup.appendChild(text);
   nodeGroup.appendChild(animateMotion);

   return nodeGroup;
}

/**
 * Starts the animation for all data signal nodes. (NEW)
 */
export function startDataSignalAnimation() {
    if (!dataSignalNodesGroup) return;
    const animations = dataSignalNodesGroup.querySelectorAll('animateMotion');
    if (animations.length === 0) {
        console.log("No data signal nodes found to animate.");
        return;
    }
    console.log(`Starting animation for ${animations.length} data signals.`);
    animations.forEach(anim => {
        const parentGroup = anim.closest('g');
        if (parentGroup) {
            parentGroup.setAttribute('visibility', 'visible');
            anim.beginElement();
        } else {
            console.warn(`Could not find parent group for data animation element:`, anim);
        }
    });
}

/**
 * Hàm mới để bắt đầu TẤT CẢ animation (NEW)
 */
export function startAllSignalAnimations() {
    console.log("Starting all signal animations...");
    startControlSignalAnimation();
    startDataSignalAnimation();
}
