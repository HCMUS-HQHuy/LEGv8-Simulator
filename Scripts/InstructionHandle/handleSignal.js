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
    // Điều chỉnh bán kính nếu giá trị dài hơn? (Ví dụ)
    const radius = (typeof value === 'string' && value.length > 1) ? 10 : 8;
    circle.setAttribute('r', String(radius));
    circle.setAttribute('fill', (value === 1 || value === '1') ? '#FF4136' : '#0074D9'); // Xử lý cả số và chuỗi '1'
    // Có thể cần màu khác cho giá trị chuỗi?
    if (typeof value === 'string' && value !== '0' && value !== '1') {
       circle.setAttribute('fill', '#FF851B'); // Màu cam cho giá trị kết hợp
    }
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

        // Xử lý đặc biệt cho ALUOp0 và ALUOp1 khi chúng đến ALU Control
        if ((signalName === 'ALUOp0' || signalName === 'ALUOp1') && destinationId === 'ALU-control') {
            console.log(`Signal '${signalName}' (value: ${value}) arrived at ALU Control.`);
            // Lưu giá trị lại
            currentAluOpValues[signalName] = value;
            // Kiểm tra và xử lý nếu cả hai đã đến
            processAluControlOutput();
        }
        // Xử lý thông báo đến đích cho các tín hiệu khác (hoặc ALUOp nếu đích khác)
        else if (destinationId) {
            console.log(`Signal '${signalName}' (value: ${value}) reached destination element with ID: '${destinationId}'`);
            // TODO: Logic tương tác với các phần tử đích khác sẽ ở đây
        }
        // Xử lý các node animation mới (ví dụ: từ ALU Control đi ra)
        else if (signalName.startsWith(ALU_CONTROL_TO_ALU_NODE_ID_PREFIX)) {
             console.log(`Signal '${signalName}' (value: ${value}) reached main ALU.`);
             // TODO: Logic khi tín hiệu điều khiển ALU đến được ALU chính
             // Ví dụ: cập nhật trạng thái ALU, thay đổi biểu tượng phép toán...
        }
        // Cảnh báo nếu không có đích
        else {
            console.warn(`Signal '${signalName}' (value: ${value}) finished, but no destination ID defined.`);
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

    // --- Reset trạng thái ALUOp và hiển thị trước khi tạo node mới ---
    clearAluControlDisplay();
    // -------------------------------------------------------------

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

        // **QUAN TRỌNG**: Logic tạo node ALUOp0/1 vẫn giữ nguyên như cũ (dùng path gốc và offset)
        // vì chúng cần đi từ Control chính -> ALU Control Unit
        if (lowerCaseSignalName === 'aluop1') {
            pathIdToUse = originalAluOpPathId;
            nodeOffset = { x: -ALUOP_VISUAL_OFFSET_X, y: -ALUOP_VISUAL_OFFSET_Y };
        } else if (lowerCaseSignalName === 'aluop0') {
            pathIdToUse = originalAluOpPathId;
            nodeOffset = { x: ALUOP_VISUAL_OFFSET_X, y: ALUOP_VISUAL_OFFSET_Y };
        } else {
            pathIdToUse = `control-${lowerCaseSignalName}-path`;
        }

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

// *** === BẮT ĐẦU THAY ĐỔI BƯỚC 3 === ***

// Biến lưu trữ tạm thời giá trị ALUOp khi chúng đến nơi
let currentAluOpValues = {
    ALUOp1: null,
    ALUOp0: null,
    processed: false // Cờ để tránh xử lý nhiều lần
};

// ID cố định cho text hiển thị trong ALU Control
const ALU_CONTROL_DISPLAY_TEXT_ID = "alu-control-output-value";
// ID cố định cho node animation mới từ ALU Control đến ALU
const ALU_CONTROL_TO_ALU_NODE_ID_PREFIX = "node-ALUControlOutput-"; // Thêm tiền tố để có thể phân biệt
const ALU_CONTROL_TO_ALU_PATH_ID = "ALU-control-to-ALU-2-path"; // Path mới
const ALU_CONTROL_OUTPUT_DELAY = 500; // ms - Độ trễ trước khi gửi tín hiệu đến ALU

/**
 * Hàm xóa text hiển thị giá trị trong ALU Control
 */
function clearAluControlDisplay() {
    const existingText = document.getElementById(ALU_CONTROL_DISPLAY_TEXT_ID);
    if (existingText) {
        existingText.remove();
    }
    // Reset trạng thái lưu trữ
    currentAluOpValues.ALUOp0 = null;
    currentAluOpValues.ALUOp1 = null;
    currentAluOpValues.processed = false;

     // Xóa cả node animation cũ đi từ ALU control (nếu có)
     const oldAnimNodes = signalNodesGroup.querySelectorAll(`g[id^="${ALU_CONTROL_TO_ALU_NODE_ID_PREFIX}"]`);
     oldAnimNodes.forEach(node => node.remove());
}

/**
 * Hàm hiển thị giá trị ALU Control và kích hoạt animation mới
 */
function processAluControlOutput() {
    // Chỉ xử lý nếu có cả hai giá trị và chưa xử lý trước đó
    if (currentAluOpValues.ALUOp0 !== null && currentAluOpValues.ALUOp1 !== null && !currentAluOpValues.processed) {
        currentAluOpValues.processed = true; // Đánh dấu đã xử lý

        // 1. Kết hợp giá trị
        const combinedValue = `${currentAluOpValues.ALUOp1}${currentAluOpValues.ALUOp0}`;
        console.log(`ALUOp signals arrived. Combined value: ${combinedValue}`);

        // 2. Tìm phần tử ALU Control đích
        const aluControlElement = document.getElementById("ALU-control");
        if (!aluControlElement) {
            console.error("ALU Control element with ID 'ALU-control' not found!");
            return; // Không thể hiển thị nếu không tìm thấy đích
        }

        // 3. Tạo/Cập nhật text hiển thị bên trong ALU Control
        let displayText = document.getElementById(ALU_CONTROL_DISPLAY_TEXT_ID);
        if (!displayText) {
            displayText = document.createElementNS(svgNS, 'text');
            displayText.setAttribute('id', ALU_CONTROL_DISPLAY_TEXT_ID);
            // Đặt thuộc tính cơ bản (CẦN TINH CHỈNH VỊ TRÍ X, Y)
            displayText.setAttribute('x', '0'); // Giả sử tâm ellipse là 0,0 trong group
            displayText.setAttribute('y', '30'); // Đặt dưới chữ "ALU Control" một chút
            displayText.setAttribute('text-anchor', 'middle');
            displayText.setAttribute('dominant-baseline', 'central');
            displayText.setAttribute('font-size', '12'); // Có thể cần lớn hơn
            displayText.setAttribute('font-weight', 'bold');
            displayText.setAttribute('fill', 'black'); // Màu khác để nổi bật
            aluControlElement.appendChild(displayText); // Thêm vào group ALU Control
        }
        displayText.textContent = combinedValue; // Cập nhật giá trị

        // 4. Lên lịch tạo animation mới sau độ trễ
        setTimeout(() => {
            console.log(`Sending combined ALU control signal "${combinedValue}" to ALU...`);

            // Tạo node mới cho tín hiệu đi từ ALU Control -> ALU
            // Sử dụng signalName duy nhất để tránh trùng ID node
            const newNodeSignalName = `${ALU_CONTROL_TO_ALU_NODE_ID_PREFIX}${combinedValue}`;
            const newNodeElement = createSignalNodeElement(
                newNodeSignalName,
                combinedValue, // Giá trị là chuỗi kết hợp
                ALU_CONTROL_TO_ALU_PATH_ID, // Path mới
                2, // Thời gian di chuyển (có thể khác)
                null // Không cần offset cố định cho node này
            );

            if (newNodeElement) {
                signalNodesGroup.appendChild(newNodeElement);
                // Bắt đầu animation ngay lập tức
                const newAnimation = newNodeElement.querySelector('animateMotion');
                if (newAnimation) {
                    const parentGroup = newAnimation.closest('g');
                    if(parentGroup) parentGroup.setAttribute('visibility', 'visible');
                    newAnimation.beginElement();
                }
            }
            // Có thể xóa text hiển thị trong ALU control tại đây nếu muốn
            // hoặc để nó hiển thị cho đến khi có lệnh mới
            // clearAluControlDisplay(); // Nếu muốn xóa ngay sau khi gửi đi

        }, ALU_CONTROL_OUTPUT_DELAY); // Độ trễ
    }
}


