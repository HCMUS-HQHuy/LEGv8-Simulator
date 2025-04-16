import controlSignalTable from "./defineSignal.js"; // Đảm bảo đường dẫn đúng


const svgNS = "http://www.w3.org/2000/svg";
const svgElement = document.querySelector('svg'); // Cần tham chiếu đến thẻ SVG chính
const signalNodesGroup = document.getElementById('control-signal-nodes'); // Giả sử thẻ <g> này tồn tại trong HTML/SVG của bạn
const defsElementId = 'dynamic-defs-for-paths'; // ID cho thẻ defs động
// --- Hằng số ---
const ALUOP_PERPENDICULAR_OFFSET = 6; // Khoảng cách vuông góc để tách 2 node ALUOp
const TEMP_PATH_PREFIX = 'temp-offset-path-'; // Tiền tố cho ID path ảo

// --- Hàm tiện ích tính toán Vector ---
function vecDot(v1, v2) { return v1.x * v2.x + v1.y * v2.y; }
function vecSub(v1, v2) { return { x: v1.x - v2.x, y: v1.y - v2.y }; }
function vecAdd(v1, v2) { return { x: v1.x + v2.x, y: v1.y + v2.y }; }
function vecScale(v, s) { return { x: v.x * s, y: v.y * s }; }
function vecLength(v) { return Math.sqrt(v.x * v.x + v.y * v.y); }
function vecNormalize(v) {
    const len = vecLength(v);
    return len === 0 ? { x: 0, y: 0 } : { x: v.x / len, y: v.y / len };
}
// Tính vector pháp tuyến đơn vị (xoay 90 độ ngược chiều kim đồng hồ)
function vecNormal(v) { return { x: -v.y, y: v.x }; }

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
 * Phân tích dữ liệu 'd' đơn giản (chỉ M và L) thành danh sách các điểm.
 * @param {string} d - Chuỗi thuộc tính 'd' của path.
 * @returns {Array<{x: number, y: number}> | null} Danh sách điểm hoặc null nếu parse lỗi.
 */
function parseSimplePathData(d) {
    const points = [];
    // Regex đơn giản để tách lệnh M và L và tọa độ của chúng
    const commands = d.trim().match(/[ML][^ML]*/g);
    if (!commands) return null;

    try {
        let currentX = 0;
        let currentY = 0;
        for (const cmd of commands) {
            const type = cmd[0].toUpperCase();
            const coords = cmd.slice(1).trim().split(/[\s,]+/).map(Number);

            if ((type === 'M' || type === 'L') && coords.length === 2) {
                currentX = coords[0];
                currentY = coords[1];
                points.push({ x: currentX, y: currentY });
            } else {
                console.warn(`Unsupported path command or format: ${cmd}`);
                // Bỏ qua các lệnh không hỗ trợ hoặc sai định dạng trong trường hợp này
                // Nếu path phức tạp hơn, cần thư viện parsing đầy đủ
            }
        }
        return points.length > 0 ? points : null;
    } catch (e) {
        console.error("Error parsing path data:", e);
        return null;
    }
}


/**
 * Tạo một chuỗi 'd' mới từ danh sách điểm đã được offset.
 * @param {Array<{x: number, y: number}>} points - Danh sách điểm đã offset.
 * @returns {string} Chuỗi thuộc tính 'd' mới.
 */
function pointsToD(points) {
    if (!points || points.length === 0) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
}

/**
 * Tạo một path ảo song song với path gốc và thêm vào <defs>.
 * @param {string} originalPathId - ID của path gốc.
 * @param {string} newPathId - ID mong muốn cho path ảo mới.
 * @param {number} offsetDistance - Khoảng cách offset vuông góc (+ sang phải/dưới, - sang trái/trên).
 * @returns {string | null} ID của path mới được tạo hoặc null nếu thất bại.
 */
function createOffsetPath(originalPathId, newPathId, offsetDistance) {
    if (!svgElement) { console.error("SVG Root Element not found."); return null; }
    const originalPath = document.getElementById(originalPathId);
    if (!originalPath) { console.error(`Original path with ID "${originalPathId}" not found.`); return null; }
    const d = originalPath.getAttribute('d');
    if (!d) { console.error(`Original path "${originalPathId}" has no 'd' attribute.`); return null; }

    const points = parseSimplePathData(d);
    if (!points || points.length < 2) {
        console.error(`Could not parse path data or path has less than 2 points: ${originalPathId}`);
        return null;
    }

    const offsetPoints = [];
    for (let i = 0; i < points.length; i++) {
        let offsetVec = { x: 0, y: 0 };
        let finalOffsetDirection = { x: 0, y: 0 }; // Hướng offset cuối cùng (vector đơn vị)

        if (i === 0) {
            // Điểm đầu: dùng pháp tuyến của đoạn đầu tiên
            const segmentVec = vecSub(points[1], points[0]);
            finalOffsetDirection = vecNormalize(vecNormal(segmentVec));
        } else if (i === points.length - 1) {
            // Điểm cuối: dùng pháp tuyến của đoạn cuối cùng
            const segmentVec = vecSub(points[i], points[i - 1]);
            finalOffsetDirection = vecNormalize(vecNormal(segmentVec));
        } else {
            // --- Điểm giữa (góc): Chỉ tính hướng trung bình của pháp tuyến ---
            const V_in = vecSub(points[i], points[i - 1]);
            const V_out = vecSub(points[i + 1], points[i]);

            const N_in = vecNormalize(vecNormal(V_in)); // Pháp tuyến đơn vị đoạn vào
            const N_out = vecNormalize(vecNormal(V_out)); // Pháp tuyến đơn vị đoạn ra

            // Tính trung bình cộng vector pháp tuyến
            let N_avg = vecAdd(N_in, N_out);
            const N_avg_len_sq = vecDot(N_avg, N_avg);

            // Kiểm tra trường hợp đoạn thẳng (N_in và N_out gần như đối nhau)
            if (N_avg_len_sq < 1e-9) {
                // Nếu gần thẳng hàng, dùng pháp tuyến của một trong hai đoạn
                finalOffsetDirection = N_in; // hoặc N_out
            } else {
                 // Chuẩn hóa vector trung bình để lấy hướng
                 finalOffsetDirection = vecScale(N_avg, 1 / Math.sqrt(N_avg_len_sq));
            }
        }

        // Tính vector offset cuối cùng bằng cách nhân hướng với khoảng cách cố định
        offsetVec = vecScale(finalOffsetDirection, offsetDistance);
        offsetPoints.push(vecAdd(points[i], offsetVec));
    }


    const newD = pointsToD(offsetPoints);
    if (!newD) return null;

    // --- Tạo hoặc lấy thẻ <defs> ---
    let defs = svgElement.querySelector(`#${defsElementId}`);
    if (!defs) {
        defs = document.createElementNS(svgNS, 'defs');
        defs.setAttribute('id', defsElementId);
        svgElement.prepend(defs); // Thêm vào đầu SVG
    }

    let newPath = defs.querySelector(`#${newPathId}`);
    if (!newPath) {
        newPath = document.createElementNS(svgNS, 'path');
        newPath.setAttribute('id', newPathId);
        defs.appendChild(newPath);
    }
    newPath.setAttribute('d', newD);

    console.log(`Created offset path: ${newPathId}`);
    return newPathId;
}

/**
 * Xóa tất cả các path ảo đã tạo trước đó.
 */
function clearTemporaryPaths() {
    const defs = svgElement ? svgElement.querySelector(`#${defsElementId}`) : null;
    if (defs) {
       const tempPaths = defs.querySelectorAll(`path[id^="${TEMP_PATH_PREFIX}"]`);
       tempPaths.forEach(path => path.remove());
       console.log(`Cleared ${tempPaths.length} temporary offset paths.`);
       // Nếu defs trống thì xóa luôn thẻ defs
       if (!defs.hasChildNodes()) {
          // defs.remove(); // Có thể giữ lại để tránh tạo lại liên tục
       }
    }
}

/**
 * Tạo SVG cho một node tín hiệu (0/1) và animation của nó.
 * *** SỬA ĐỔI: Thêm tham số optional 'offset' để dịch chuyển node ***
 * @param {string} signalName - Tên tín hiệu (e.g., "RegWrite").
 * @param {0 | 1} value - Giá trị tín hiệu (0 hoặc 1).
 * @param {string} pathId - ID của thẻ <path> (đã chuẩn hóa chữ thường).
 * @param {number} [duration=2] - Thời gian animation (giây).
 * @param {{x: number, y: number} | null} [offset=null] - Khoảng dịch chuyển {x, y} cho node.
 * @returns {SVGGElement | null} Phần tử <g> chứa node và animation.
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
    if (existingNode) existingNode.remove();

    const nodeGroup = document.createElementNS(svgNS, 'g');
    nodeGroup.setAttribute('id', nodeGroupId);
    nodeGroup.setAttribute('visibility', 'hidden');

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
    // Đảm bảo không có 'rotate'

    const mpath = document.createElementNS(svgNS, 'mpath');
    mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${pathId}`);

    animateMotion.appendChild(mpath);
    nodeGroup.appendChild(circle);
    nodeGroup.appendChild(text);
    nodeGroup.appendChild(animateMotion); // Animation được gắn vào group đã được offset

    return nodeGroup;
}


/**
 * Hiển thị các node tín hiệu điều khiển trên datapath.
 * *** SỬA ĐỔI: Tính toán và truyền offset cho ALUOp1/ALUOp0 ***
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

    if (!svgElement) {
        console.error("SVG Root Element not found. Needed for creating <defs>.");
        return;
    }

    // --- Dọn dẹp node cũ và path ảo cũ ---
    while (signalNodesGroup.firstChild) {
        signalNodesGroup.removeChild(signalNodesGroup.firstChild);
    }
    clearTemporaryPaths(); // Xóa path ảo từ lần chạy trước
    // ---------------------------------

     // --- Tạo path ảo MỚI cho ALUOp (nếu có) ---
     let aluOp1PathId = null;
     let aluOp0PathId = null;
     if ('ALUOp1' in signals || 'ALUOp0' in signals) {
         const originalAluOpPathId = 'control-aluop-path'; // ID gốc trong SVG
         aluOp1PathId = createOffsetPath(originalAluOpPathId, `${TEMP_PATH_PREFIX}aluop1`, -ALUOP_PERPENDICULAR_OFFSET);
         aluOp0PathId = createOffsetPath(originalAluOpPathId, `${TEMP_PATH_PREFIX}aluop0`, +ALUOP_PERPENDICULAR_OFFSET);
 
         // Nếu tạo path ảo thất bại, quay lại dùng path gốc (sẽ bị chồng)
         if (!aluOp1PathId) aluOp1PathId = originalAluOpPathId;
         if (!aluOp0PathId) aluOp0PathId = originalAluOpPathId;
     }
     // ---------------------------------------

    for (const [signalName, value] of Object.entries(signals)) {
        let pathIdToUse;
        const lowerCaseSignalName = signalName.toLowerCase();

        // --- Chọn path ID để sử dụng ---
        if (lowerCaseSignalName === 'aluop1') {
            pathIdToUse = aluOp1PathId; // Dùng path ảo 1 (hoặc gốc nếu lỗi)
        } else if (lowerCaseSignalName === 'aluop0') {
            pathIdToUse = aluOp0PathId; // Dùng path ảo 0 (hoặc gốc nếu lỗi)
        } else {
            pathIdToUse = `control-${lowerCaseSignalName}-path`; // Dùng path gốc theo tên
        }
        // ---------------------------

        // Tạo node, không cần offset nữa vì path đã được offset
        const nodeElement = createSignalNodeElement(signalName, value, pathIdToUse);
        if (nodeElement) {
            signalNodesGroup.appendChild(nodeElement);
        }
    }
     console.log("Control signal nodes created (ALUOp nodes offset).");
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