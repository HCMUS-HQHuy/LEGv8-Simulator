import controlSignalTable from "./Define/controlSignalTable.js";

// loại lệnh (ADD / ORR / XOR / AND)
let mnemonic = null;

const dataSignalNodesGroup = document.getElementById('data-signal-nodes');

export function trigger() {

	if (!dataSignalNodesGroup) {
        console.warn("dataSignalNodesGroup is null!");
        return;
    }
	console.log("--- Opcode animation finished, generating and starting Control Signals ---");

	const controlSignals = generateControlSignals(parsedInstruction);

	// 3.2 Hiển thị Control Signals Nodes (ẩn)
	if (controlSignals) {
		displayControlSignalNodes(controlSignals); // Hàm này giờ chỉ tạo node ẩn
	} else {
			console.warn(`No control signals generated.`);
			// handleSignal.displayControlSignalNodes(null); // Xóa node cũ nếu có
	}

	startControlSignalAnimation();
}

/**
 * Tạo các tín hiệu điều khiển dựa trên lệnh đã được parse.
 * @param {object} parsedInstruction - Đối tượng lệnh đã được parse.
 * @returns {object | null} Một đối tượng với các tên tín hiệu điều khiển làm key
 *                           và giá trị 0 hoặc 1, hoặc null nếu lệnh không được hỗ trợ.
 */
function generateControlSignals(parsedInstruction) {
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

	// // XỬ LÝ SỰ KIỆN KẾT THÚC
	// animateMotion.addEventListener('endEvent', (event) => {
	// 	const destinationId = signalDestinations[signalName];

	// 	// Khi tín hiệu "ALUOp" kết hợp đến ALU Control
	// 	if (signalName === 'ALUOp' && destinationId === 'ALU-control') {
	// 		if (typeof value !== 'undefined' && value !== null) {
	// 			// handleAluControlArrival(value, getValueEndPath(value));
	// 		} else { 
	// 			console.log("undefined value in ALUOp-> ALU Control"); 
	// 			return null; 
	// 		}
	// 	}
	// 	// Khi tín hiệu 4-bit cuối cùng đến ALU chính
	// 	else if (signalName.startsWith(ALU_CONTROL_TO_ALU_NODE_ID_PREFIX)) {
	// 		console.log(`Final ALU Control Signal '${value}' reached main ALU (add-2).`);
	// 		// TODO: Logic cập nhật trạng thái/hình ảnh ALU chính ở đây
	// 		// Ví dụ: tìm phần tử 'add-2' và thay đổi text bên trong nó?
	// 		const mainAluElement = document.getElementById('add-2'); // Hoặc 'main-alu' nếu bạn đổi ID
	// 		if (mainAluElement) {
	// 			let aluActionText = mainAluElement.querySelector('.alu-action-text'); // Thêm class này nếu muốn
	// 			if (!aluActionText) {
	// 				aluActionText = document.createElementNS(svgNS, 'text');
	// 				aluActionText.setAttribute('class', 'alu-action-text');
	// 				aluActionText.setAttribute('x', '60'); // Vị trí ví dụ
	// 				aluActionText.setAttribute('y', '110'); // Vị trí ví dụ
	// 				aluActionText.setAttribute('font-size', '10');
	// 				aluActionText.setAttribute('text-anchor', 'middle');
	// 				mainAluElement.appendChild(aluActionText);
	// 			}
	// 			// Tìm tên phép toán từ giá trị 4-bit
	// 			let operationName = 'Unknown';
	// 			if(value === "0010") operationName = 'ADD';
	// 			else if(value === "0110") operationName = 'SUB';
	// 			else if(value === "0000") operationName = 'AND';
	// 			else if(value === "0001") operationName = 'ORR';
	// 			aluActionText.textContent = `Op: ${operationName}`;
	// 		}
	// 		event.target.closest('g')?.remove();
	// 	}
	// 	// Xử lý các tín hiệu khác đến đích
	// 	else if (destinationId) {
	// 		console.log(`Signal '${signalName}' (value: ${value}) reached destination element with ID: '${destinationId}'`);
	// 		// TODO: Logic tương tác với các phần tử đích khác
	// 	}
	// 	// Cảnh báo không có đích
	// 	else {
	// 		console.warn(`Signal '${signalName}' (value: ${value}) finished, but no destination ID defined.`);
	// 	}
	// });

	const mpath = document.createElementNS(svgNS, 'mpath');
	mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${pathId}`);

	animateMotion.appendChild(mpath);
	nodeGroup.appendChild(circle);
	nodeGroup.appendChild(text);
	nodeGroup.appendChild(animateMotion);

	return nodeGroup;
}


// (displayControlSignalNodes cập nhật để nhận cờ `startNow`)
function displayControlSignalNodes(signals) {

	if (!signals || !signalNodesGroup) {
		if (signalNodesGroup) { // Xóa node cũ nếu tín hiệu là null
				while (signalNodesGroup.firstChild) signalNodesGroup.removeChild(signalNodesGroup.firstChild);
		}
		return;
	}


	for (const [signalName, value] of Object.entries(signals)) {
		if (signalName === 'finalAluControlSignal') { continue; }
		let pathIdToUse = `control-${signalName.toLowerCase()}-path`;
		const finalAluValueForNode = (signalName === 'ALUOp') ? signals.finalAluControlSignal : null;

		const nodeElement = createSignalNodeElement(
			signalName, value, pathIdToUse, DEFAULT_ANIMATION_DURATION, finalAluValueForNode
		);
		if (nodeElement) {
			signalNodesGroup.appendChild(nodeElement);
			// Đảm bảo ẩn ban đầu (đã set trong create...)
		}
	}
	console.log(`Control signal nodes created (hidden).`);
}

function startControlSignalAnimation() {
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
