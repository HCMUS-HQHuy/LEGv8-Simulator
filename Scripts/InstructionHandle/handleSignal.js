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

    // *** GỘP ALUOp1 VÀ ALUOp0 (NẾU CÓ) ***
    if (finalSignals.hasOwnProperty('ALUOp1') && finalSignals.hasOwnProperty('ALUOp0')) {
        // Tạo key mới "ALUOp" với giá trị kết hợp là chuỗi
        finalSignals.ALUOp = `${finalSignals.ALUOp1}${finalSignals.ALUOp0}`;
        // Xóa các key cũ
        delete finalSignals.ALUOp1;
        delete finalSignals.ALUOp0;
        console.log("Combined ALUOp1 and ALUOp0 into ALUOp:", finalSignals.ALUOp);
    }
    // *** KẾT THÚC GỘP ***

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

    // --- Tạo circle và text (điều chỉnh kích thước nếu giá trị là chuỗi dài) ---
    const circle = document.createElementNS(svgNS, 'circle');
    const radius = (typeof value === 'string' && value.length > 1) ? 10 : 8;
    circle.setAttribute('r', String(radius));
    let fillColor = (value === 1 || value === '1') ? '#FF4136' : '#0074D9'; // Mặc định đỏ/xanh
    if (typeof value === 'string' && value !== '0' && value !== '1') {
       fillColor = '#FF851B'; // Màu cam cho giá trị kết hợp
    }
    circle.setAttribute('fill', fillColor);
    circle.setAttribute('stroke', 'black');
    circle.setAttribute('stroke-width', '1');

    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    const fontSize = (typeof value === 'string' && value.length > 1) ? 9 : 10;
    text.setAttribute('font-size', String(fontSize));
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('fill', 'white');
    text.textContent = value.toString();
    // --- Hết tạo circle/text ---

    const animateMotion = document.createElementNS(svgNS, 'animateMotion');
    animateMotion.setAttribute('id', animationId);
    animateMotion.setAttribute('dur', `${duration}s`);
    animateMotion.setAttribute('begin', 'indefinite');
    animateMotion.setAttribute('fill', 'freeze');

    // *** XỬ LÝ SỰ KIỆN KẾT THÚC ***
    animateMotion.addEventListener('endEvent', () => {
        const destinationId = signalDestinations[signalName]; // Tra cứu đích

        // --- Xử lý đặc biệt cho tín hiệu "ALUOp" kết hợp khi đến ALU Control ---
        if (signalName === 'ALUOp' && destinationId === 'ALU-control') {
            // Gọi hàm xử lý với giá trị kết hợp (đã là chuỗi)
            handleAluControlArrival(value);
        }
        // --- Xử lý các tín hiệu khác đến đích ---
        else if (destinationId) {
            console.log(`Signal '${signalName}' (value: ${value}) reached destination element with ID: '${destinationId}'`);
            // TODO: Logic tương tác với các phần tử đích khác
        }
        // --- Xử lý node đi từ ALU Control đến ALU ---
        else if (signalName.startsWith(ALU_CONTROL_TO_ALU_NODE_ID_PREFIX)) {
             console.log(`Signal '${signalName}' (value: ${value}) reached main ALU.`);
             // TODO: Logic khi tín hiệu điều khiển ALU đến được ALU chính
        }
        // --- Cảnh báo không có đích ---
        else {
            console.warn(`Signal '${signalName}' (value: ${value}) finished, but no destination ID defined.`);
        }
    });
    // *** HẾT XỬ LÝ SỰ KIỆN ***

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

    clearAluControlDisplay(); // Reset trước khi tạo mới
    while (signalNodesGroup.firstChild) {
        signalNodesGroup.removeChild(signalNodesGroup.firstChild);
    }

    for (const [signalName, value] of Object.entries(signals)) {
        const lowerCaseSignalName = signalName.toLowerCase();
        const pathIdToUse = `control-${lowerCaseSignalName}-path`;

        const nodeElement = createSignalNodeElement(
            signalName,
            value,
            pathIdToUse,
            2,
            null // Luôn là null vì không còn offset cố định
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

// *** === BẮT ĐẦU THAY ĐỔI BƯỚC 3 === ***

const ALU_CONTROL_DISPLAY_TEXT_ID = "alu-control-output-value";
const ALU_CONTROL_TO_ALU_NODE_ID_PREFIX = "node-ALUControlOutput-";
const ALU_CONTROL_TO_ALU_PATH_ID = "ALU-control-to-ALU-2-path";
const ALU_CONTROL_OUTPUT_DELAY = 500; // ms

/**
 * Hàm xóa text hiển thị giá trị trong ALU Control
 */
function clearAluControlDisplay() {
    const existingText = document.getElementById(ALU_CONTROL_DISPLAY_TEXT_ID);
    if (existingText) {
        existingText.remove();
    }
    // --- BỎ RESET currentAluOpValues ---
    const oldAnimNodes = signalNodesGroup.querySelectorAll(`g[id^="${ALU_CONTROL_TO_ALU_NODE_ID_PREFIX}"]`);
    oldAnimNodes.forEach(node => node.remove());
}

/**
 * Hàm xử lý khi tín hiệu ALUOp kết hợp đến ALU Control:
 * Hiển thị giá trị và kích hoạt animation mới đến ALU chính
 * @param {string} combinedValue - Giá trị kết hợp (ví dụ: "10")
 */
function handleAluControlArrival(combinedValue) {
    console.log(`Combined ALUOp signal arrived at ALU Control. Value: ${combinedValue}`);

    const aluControlElement = document.getElementById("ALU-control");
    if (!aluControlElement) {
        console.error("ALU Control element with ID 'ALU-control' not found!");
        return;
    }

    // Tạo/Cập nhật text hiển thị bên trong ALU Control
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
    displayText.textContent = combinedValue;

    // Lên lịch tạo animation mới sau độ trễ
    setTimeout(() => {
        console.log(`Sending combined ALU control signal "${combinedValue}" to ALU...`);
        const newNodeSignalName = `${ALU_CONTROL_TO_ALU_NODE_ID_PREFIX}${combinedValue}`;
        // Gọi createSignalNodeElement cho animation mới
        const newNodeElement = createSignalNodeElement(
            newNodeSignalName,
            combinedValue,
            ALU_CONTROL_TO_ALU_PATH_ID,
            2, // duration
            null // Không cần offset
        );

        if (newNodeElement) {
            signalNodesGroup.appendChild(newNodeElement);
            const newAnimation = newNodeElement.querySelector('animateMotion');
            if (newAnimation) {
                const parentGroup = newAnimation.closest('g');
                 if(parentGroup) parentGroup.setAttribute('visibility', 'visible');
                newAnimation.beginElement();
            }
        }
    }, ALU_CONTROL_OUTPUT_DELAY);
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


