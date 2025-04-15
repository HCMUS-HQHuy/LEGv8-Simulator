import controlSignalTable from "./defineSignal.js"

/**
 * Tạo các tín hiệu điều khiển dựa trên lệnh đã được parse.
 * @param {ParsedInstruction} parsedInstruction - Đối tượng lệnh đã được parse.
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
        // Giả định tất cả lệnh R-type trong bảng dùng chung tín hiệu
         instructionClass = "R-format";
         // Bạn có thể thêm kiểm tra mnemonic cụ thể nếu cần phân biệt R-format
         // if (['ADD', 'SUB', 'AND', 'ORR'].includes(mnemonic)) { ... }
    } else if (mnemonic === 'LDUR' && controlSignalTable["LDUR"]) {
        instructionClass = "LDUR";
    } else if (mnemonic === 'STUR' && controlSignalTable["STUR"]) {
        instructionClass = "STUR";
    } else if (mnemonic === 'CBZ' && controlSignalTable["CBZ"]) {
         instructionClass = "CBZ";
         // Could also potentially check type === 'CB' if parser sets it
    }
    // === Thêm điều kiện else if cho các lệnh khác bạn muốn hỗ trợ ===
    // else if (type === 'I' && ...) { ... }
    // else if (type === 'B' && ...) { ... }
    // else if (mnemonic === 'ADDI' && ...) { ... }
    // ==============================================================
    else {
        console.warn(`Control signals not defined for instruction: ${mnemonic} (Type: ${type})`);
        return null; // Trả về null nếu không tìm thấy định nghĩa tín hiệu
    }

    // Lấy các tín hiệu điều khiển từ bảng dựa trên lớp lệnh đã xác định
    const signals = controlSignalTable[instructionClass];

    // Trả về bản sao của đối tượng tín hiệu để tránh sửa đổi bảng gốc
    return { ...signals };
}

// --- Giả sử các hàm này đã tồn tại ---
// function parseLegv8Instruction(line) { ... }
// function generateControlSignals(parsedInstruction) { ... }
// const controlSignalTable = { ... };
// ------------------------------------

// --- Namespace SVG ---
const svgNS = "http://www.w3.org/2000/svg";

// --- Vị trí để thêm các node tín hiệu ---
const signalNodesGroup = document.getElementById('control-signal-nodes');

/**
 * Tạo SVG cho một node tín hiệu (0/1) và animation của nó.
 * @param {string} signalName - Tên tín hiệu (e.g., "RegWrite").
 * @param {0 | 1} value - Giá trị tín hiệu (0 hoặc 1).
 * @param {string} pathId - ID của thẻ <path> mà node sẽ di chuyển trên đó.
 * @param {number} duration - Thời gian animation (giây).
 * @returns {SVGGElement | null} Phần tử <g> chứa node và animation, hoặc null nếu path không tồn tại.
 */
function createSignalNodeElement(signalName, value, pathId, duration = 2) {
    const pathElement = document.getElementById(pathId);
    if (!pathElement) {
        console.warn(`Path with ID "${pathId}" not found for signal "${signalName}". Node not created.`);
        return null;
    }

    const nodeGroupId = `node-${signalName}`;
    const animationId = `anim-${signalName}`;

    // Tạo group chứa node
    const nodeGroup = document.createElementNS(svgNS, 'g');
    nodeGroup.setAttribute('id', nodeGroupId);
    nodeGroup.setAttribute('visibility', 'hidden'); // Ẩn ban đầu

    // Tạo vòng tròn nền
    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('r', '8'); // Bán kính node
    circle.setAttribute('fill', value === 1 ? '#FF4136' : '#0074D9'); // Màu khác nhau cho 0 và 1
    circle.setAttribute('stroke', 'black');
    circle.setAttribute('stroke-width', '1');

    // Tạo text hiển thị 0 hoặc 1
    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central'); // Căn giữa dọc
    text.setAttribute('font-size', '10');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('fill', 'white'); // Màu chữ
    text.textContent = value.toString();

    // Tạo animation
    const animateMotion = document.createElementNS(svgNS, 'animateMotion');
    animateMotion.setAttribute('id', animationId);
    animateMotion.setAttribute('dur', `${duration}s`);
    animateMotion.setAttribute('begin', 'indefinite'); // Chỉ bắt đầu khi được kích hoạt
    animateMotion.setAttribute('fill', 'freeze'); // Giữ ở vị trí cuối
    animateMotion.setAttribute('rotate', 'auto');

    // Tạo mpath để liên kết với đường path
    const mpath = document.createElementNS(svgNS, 'mpath');
    mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#${pathId}`); // Quan trọng: dùng xlink:href

    // Gắn kết các phần tử
    animateMotion.appendChild(mpath);
    nodeGroup.appendChild(circle);
    nodeGroup.appendChild(text);
    nodeGroup.appendChild(animateMotion);

    return nodeGroup;
}

/**
 * Hiển thị các node tín hiệu điều khiển trên datapath.
 * @param {object} signals - Đối tượng tín hiệu trả về từ generateControlSignals.
 */
export function displayControlSignalNodes(signals) {
    if (!signals) {
        console.log("No control signals generated to display.");
        return;
    }
     if (!signalNodesGroup) {
        console.error("SVG group 'control-signal-nodes' not found!");
        return;
     }

    // Xóa các node cũ (nếu có)
    while (signalNodesGroup.firstChild) {
        signalNodesGroup.removeChild(signalNodesGroup.firstChild);
    }

    // Lặp qua các tín hiệu và tạo node
    for (const [signalName, value] of Object.entries(signals)) {
        // Tạo pathId dựa trên quy ước đặt tên (CẦN NHẤT QUÁN)
        const pathId = `control-to-${signalName.toLowerCase()}-path`;

        // Tạo và thêm node vào SVG
        const nodeElement = createSignalNodeElement(signalName, value, pathId);
        if (nodeElement) {
            signalNodesGroup.appendChild(nodeElement);
        }
    }
     console.log("Control signal nodes created.");
}

/**
 * Bắt đầu animation cho tất cả các node tín hiệu điều khiển hiện có.
 */
export function startControlSignalAnimation() {
     if (!signalNodesGroup) return;

    const animations = signalNodesGroup.querySelectorAll('animateMotion');
    console.log(`Starting animation for ${animations.length} control signals.`);
    animations.forEach(anim => {
        const parentGroup = anim.closest('g'); // Tìm group <g> chứa animation
        if (parentGroup) {
            parentGroup.setAttribute('visibility', 'visible'); // Hiện node lên
        }
        anim.beginElement(); // Bắt đầu animation
    });
}

// // --- Gắn Event Listener vào Button ---
// document.addEventListener('DOMContentLoaded', function() {
//     const startButton = document.getElementById('startButton'); // Giả sử nút có id="startButton"

//     if (startButton) {
//         startButton.addEventListener('click', () => {
//             console.log("Start Button Clicked - Simulating control signal generation...");

//             // --- BƯỚC MÔ PHỎNG: Thay thế bằng logic thực tế của bạn ---
//             // 1. Lấy instruction từ form (như code trước)
//             // const instructionText = document.getElementById('instructionCode').value;
//             // const lines = instructionText.split(/\r?\n/);
//             // const firstInstructionLine = lines.find(line => line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith(';'));
//             // const parsed = firstInstructionLine ? parseLegv8Instruction(firstInstructionLine) : null;

//             // *** TẠM THỜI DÙNG LỆNH ADD LÀM VÍ DỤ ***
//              const parsed = {
//                  mnemonic: "LDUR", // <<< THAY ĐỔI LỆNH Ở ĐÂY ĐỂ TEST (ADD, LDUR, STUR, CBZ)
//                  operands: ["X5", "[X28,#-8]"], type: "D",
//                  structuredOperands: { Rt: "X5", Rn: "X28", address_imm: "#-8" }, error: null
//              };
//             // --------------------------------------------------------------

//             if (parsed) {
//                 // 2. Tạo tín hiệu điều khiển
//                 const controlSignals = generateControlSignals(parsed);

//                 // 3. Tạo và hiển thị các node tín hiệu trên SVG
//                 displayControlSignalNodes(controlSignals);

//                 // 4. Bắt đầu animation
//                 // Có thể thêm độ trễ nhỏ để đảm bảo SVG được cập nhật
//                 setTimeout(startControlSignalAnimation, 100); // Trễ 100ms

//             } else {
//                  console.log("No valid instruction found to generate signals.");
//                  // Xóa các node cũ nếu không có lệnh hợp lệ
//                  if (signalNodesGroup) {
//                      while (signalNodesGroup.firstChild) {
//                          signalNodesGroup.removeChild(signalNodesGroup.firstChild);
//                      }
//                  }
//             }
//         });
//     } else {
//         console.error("Button with id 'startButton' not found.");
//     }

//      // --- Thêm các event listener và logic khác của bạn (zoom, etc.) ---
//      const content = document.getElementById('zoomContent');
//      const frame = document.getElementById('zoomFrame');
//      let scale = 1;

//      if (frame && content) {
//          frame.addEventListener('wheel', function(e) {
//            // ... (code zoom của bạn) ...
//          }, { passive: false });
//      }
//      // -----------------------------------------------------------------

// }); // End DOMContentLoaded