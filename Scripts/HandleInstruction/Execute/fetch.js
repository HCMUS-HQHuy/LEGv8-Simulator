// import * as handleSignal from "../signal.js"
import {encodeLegv8Instruction} from "../Compile/parser.js"

const svgNS = "http://www.w3.org/2000/svg";

const dataSignalNodesGroup = document.getElementById('data-signal-nodes'); // Cần group này

// --- PATH IDs CHO FETCH (Lấy từ SVG bạn cung cấp) ---
const PC_TO_IMEM_PATH_ID = "pc-to-instruction-memory-path";
const PC_TO_ADD_ALU_PATH_ID = "pc-to-ALU-add-0-path";
// Giả định có một path cho Lệnh đi ra, ví dụ đến khu vực Decode/Register Read


// Path cho các trường cụ thể (lấy từ SVG)
const IMEM_OPCODE_TO_CONTROL_PATH_ID = "instruction-memory-to-control-path";
const IMEM_RN_TO_REG_PATH_ID = "instruction-memory-to-read-register-1-path"; // Instruction [9-5]
const IMEM_RM_TO_REG_PATH_ID = "instruction-memory-to-mux-1-0-path"; // Instruction [20-16]
const IMEM_RT_TO_REG_PATH_ID = "instruction-memory-to-mux-1-1-path"; // Dùng tạm path này, bạn cần path đúng đến Reg2 (cho load/store/CBZ)
const IMEM_RD_TO_REG_PATH_ID = "instruction-memory-to-write-register-path"; // Instruction [4-0]
const IMEM_IMM_TO_SIGN_EXTEND_PATH_ID = "instruction-memory-to-sign-extend-path"; // Cần điều chỉnh
const IMEM_BRANCH_ADDR_TO_SHIFT_PATH_ID = "instruction-memory-to-alu-control-path"; // Dùng tạm path này, bạn cần path đến shift left 2
const IMEM_FUNC_TO_ALU_CONTROL_PATH_ID = "instruction-memory-to-alu-control-path"; // Chưa hiểu đoạn này.

// !! THAY THẾ BẰNG ID THỰC TẾ NẾU CÓ !!
const IMEM_OUTPUT_BASE_PATH_ID = "instruction-memory-output-base-path"; // Path gốc lệnh đi ra

const FETCH_ANIMATION_DURATION = 3; // giây (cho PC -> Mem)
const DEFAULT_ANIMATION_DURATION = 2; // giây

// --- PC State ---
const INITIALIZED_VALUE_PC = 15;
let currentPC = INITIALIZED_VALUE_PC; // Initial PC value
const PC_INCREMENT = 4;

/**
 * Updates the PC value displayed in the SVG.
 */
function updatePCDisplay(value) { // Nhận giá trị để hiển thị
	// *** GIẢ ĐỊNH: ID của text hiển thị PC là "pc-value-text" ***
	const pcTextElement = document.getElementById('pc-value-text');
	if (pcTextElement) {
		// Hiển thị dưới dạng Hex 8 chữ số (cho địa chỉ 32-bit)
		const hexValue = value.toString(16).toUpperCase().padStart(8, '0');
		pcTextElement.textContent = `0x${hexValue}`;
	} else {
		console.warn("PC display element ('pc-value-text') not found.");
	}
}

export function trigger(parsedInstruction) {

	const pcFetchCallback = () => {
		console.log("--- PC animation finished, creating and starting Data Signals (incl. Opcode) ---");

		// 2.1 Mã hóa lại hoặc lấy mã máy đã lưu
		const encodedInstructionForData = encodeLegv8Instruction(parsedInstruction);
			if(!encodedInstructionForData || encodedInstructionForData.error){
				console.error("Cannot proceed without encoded instruction.");
				return;
			}

		// 2.2 Hiển thị Data Signals Nodes (ẩn) - Bao gồm cả Opcode
		displayDataSignalNodes(parsedInstruction, encodedInstructionForData);

		// 2.3 Tìm animation của Opcode để gắn callback xử lý control signals
		const opcodeFieldName = `Op [31-21]`; // Phải khớp với tên dùng trong createDataNodeElement
		const opcodeAnimId = `data-anim-${opcodeFieldName.replace(/\[|\]|-/g, '_')}`;
		const opcodeAnimation = document.getElementById(opcodeAnimId);

		if (opcodeAnimation) {
			// opcodeAnimation.addEventListener('endEvent', null, { once: true });
			console.log(`Attached end event listener to Opcode animation (${opcodeAnimId})`);
		} else {
			console.error(`Could not find Opcode animation element with ID: ${opcodeAnimId}. Control signals will not be triggered.`);
			// Có thể gọi opcodeArrivalCallback ngay lập tức ở đây nếu muốn mô phỏng zero-delay?
			// opcodeArrivalCallback();
		}

		// 2.4 Bắt đầu TẤT CẢ animation cho Data Signals (Opcode, Rn, Rm...)
		startDataSignalAnimation();
	};
	// --- Kết thúc định nghĩa pcFetchCallback ---

	// 2. Tạo Animation cho PC đi đến Mem Addr và TRUYỀN CALLBACK vào
	animatePCToMemory(0, pcFetchCallback);

	console.log("--- Processing Complete for Instruction ---");
}


/**
 * Tạo và bắt đầu animation cho PC đi đến Instruction Memory
 * @param {number} pcValue - Giá trị PC để hiển thị trong animation
 */
function animatePCToMemory(pcValue, onEndCallback = null) {
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
    const existingNode = document.getElementById(`data-node-${fieldName}`);
    if (existingNode) {
		console.warn("exist node in nodeGroupID!");
		existingNode.remove();
	}

    dataSignalNodesGroup.appendChild(createNodeWithAnimation({
		pcValue: pcValue,
		nodeGroupId: `data-node-${fieldName}`,
		animationId: `data-anim-${fieldName}`,
		onEndCallback: onEndCallback,
		PC_TO_IMEM_PATH_ID: "pc-to-instruction-memory-path",
		FETCH_ANIMATION_DURATION:  FETCH_ANIMATION_DURATION
	}));
	const animations = dataSignalNodesGroup.querySelectorAll('animateMotion');
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
 * Hiển thị data signal nodes (instruction fields).
 * @param {object} parsedInstruction - Lệnh đã parse.
 * @param {string} encodedInstruction - Mã máy 32-bit.
 * @param {boolean} [startNow=true] - Có bắt đầu animation ngay không.
 */
function displayDataSignalNodes(parsedInstruction, encodedInstruction) {
    if (!dataSignalNodesGroup) {
        console.warn("dataSignalNodesGroup is null!");
        return;
    }

    if (!parsedInstruction || parsedInstruction.error || !encodedInstruction) {
        console.log("No valid instruction/encoding to display data signals.");
         // Xóa node data cũ nếu không có lệnh hợp lệ
         while (dataSignalNodesGroup.firstChild) dataSignalNodesGroup.removeChild(dataSignalNodesGroup.firstChild);
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

    animateMotion.addEventListener('endEvent', (event) => { // Thêm event
        console.log(`Data field '${fieldName}' (value: ${value}) animation finished.`);
        // Tự hủy node data khi đến nơi?
        event.target.closest('g')?.remove();

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
function startDataSignalAnimation() {
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


function createNodeWithAnimation({ 
    pcValue, 
    nodeGroupId, 
    animationId, 
    onEndCallback, 
    PC_TO_IMEM_PATH_ID, 
    FETCH_ANIMATION_DURATION 
}) {
    const svgNS = "http://www.w3.org/2000/svg";

    // Tạo node mới (dùng hình chữ nhật cho địa chỉ)
    const nodeGroup = document.createElementNS(svgNS, 'g');
    nodeGroup.setAttribute('id', nodeGroupId);
    nodeGroup.setAttribute('visibility', 'visible'); // Hiện ngay
    nodeGroup.classList.add('data-node');

    // Tạo giá trị hex cho PC
    const hexValue = `0x${pcValue.toString(16).toUpperCase().padStart(8, '0')}`;

    // Tạo hình chữ nhật cho node
    const shape = document.createElementNS(svgNS, 'rect');
    const width = hexValue.length > 8 ? 50 : 30;
    const height = 16;
    shape.setAttribute('width', String(width));
    shape.setAttribute('height', String(height));
    shape.setAttribute('x', String(-width / 2));
    shape.setAttribute('y', String(-height / 2));

    // Tạo text hiển thị giá trị hex cho PC
    const text = document.createElementNS(svgNS, 'text');
    text.textContent = hexValue;

    // Tạo hiệu ứng chuyển động cho node
    const animateMotion = document.createElementNS(svgNS, 'animateMotion');
    animateMotion.setAttribute('id', animationId);
    animateMotion.setAttribute('dur', `${FETCH_ANIMATION_DURATION}s`); // Thời gian fetch
    animateMotion.setAttribute('begin', 'indefinite');
    animateMotion.setAttribute('fill', 'freeze');

    // Xóa node sau khi animation kết thúc (không cần giữ lại ở đích)
    animateMotion.addEventListener('endEvent', (event) => {
        console.log(`PC value ${hexValue} reached Instruction Memory.`);
        if (typeof onEndCallback === 'function') {
            onEndCallback(); // Gọi callback khi PC đến nơi
        }
        event.target.closest('g')?.remove(); // Tự hủy node sau khi xử lý xong
    });
    // Tạo mpath để di chuyển node dọc theo đường dẫn
    const mpath = document.createElementNS(svgNS, 'mpath');
    mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${PC_TO_IMEM_PATH_ID}`);

    // Thêm mpath vào animateMotion
    animateMotion.appendChild(mpath);

    // Thêm các phần tử con vào group
    nodeGroup.appendChild(shape);
    nodeGroup.appendChild(text);
    nodeGroup.appendChild(animateMotion);

    return nodeGroup;
}