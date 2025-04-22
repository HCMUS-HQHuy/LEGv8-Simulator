import {encodeLegv8Instruction, parseLegv8Instruction} from "./parsecode.js"
import * as handleSignal from "./signal.js"


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

export function trigger() {
	// Get references to the form and the output area
	const codeForm = document.getElementById('codeForm');
	const instructionTextarea = document.getElementById('instructionCode');

	updatePCDisplay(currentPC); // Hiển thị giá trị PC ban đầu

	// Add an event listener for the 'submit' event on the form
	codeForm.addEventListener('submit', function(event) {
		currentPC = INITIALIZED_VALUE_PC;
		updatePCDisplay(currentPC);

        event.preventDefault();
        const allCode = instructionTextarea.value;
        const codeLines = allCode.split(/\r?\n/);
        let firstInstructionLine = null;
        let firstLineIndex = -1;

        // --- Tìm dòng lệnh đầu tiên hợp lệ ---
        for (let i = 0; i < codeLines.length; i++) {
            const trimmedLine = codeLines[i].trim();
            if (trimmedLine && !trimmedLine.startsWith('//') && !trimmedLine.startsWith(';')) {
                firstInstructionLine = trimmedLine;
                firstLineIndex = i;
                break;
            }
        }

		if (firstInstructionLine === null) { 
			console.warn("FirstInstructionLine is null"); 
			return; 
		}

		// --- LẤY GIÁ TRỊ PC HIỆN TẠI TRƯỚC KHI TĂNG ---
		console.log(`--- Processing Instruction at PC=0x${currentPC.toString(16).toUpperCase().padStart(8,'0')} ---`);
		console.log(`Line ${firstLineIndex + 1}: "${firstInstructionLine}"`);

		// --- LẤY GIÁ TRỊ PC HIỆN TẠI TRƯỚC KHI TĂNG ---
		const pcValueForFetch = currentPC;

		// --- TĂNG VÀ CẬP NHẬT PC DISPLAY ---
		currentPC += PC_INCREMENT;
		updatePCDisplay(currentPC); // Cập nhật hiển thị với giá trị MỚI
		console.log(`PC incremented to: 0x${currentPC.toString(16).toUpperCase().padStart(8,'0')}`);

		// --- PARSE LỆNH ---
		const parsedInstruction = parseLegv8Instruction(firstInstructionLine);
		let results = [];
		if (!parsedInstruction || parsedInstruction.error) {
			console.error(`Error parsing line ${firstLineIndex + 1}: ${parsedInstruction?.error || 'Parser returned null'}`);
			// Dọn dẹp nếu lỗi parse
			handleSignal.displayControlSignalNodes(null);
			handleSignal.displayDataSignalNodes(null); // Gọi hàm dọn dẹp data nodes
			return;
		}
		results.push({ lineNumber: firstLineIndex + 1, parsed: parsedInstruction });
		console.log(`Parsed Line ${firstLineIndex + 1}:`, parsedInstruction);

		// --- MÃ HÓA LỆNH (Cần thiết để có mã máy) ---
		const encodedInstruction = encodeLegv8Instruction(parsedInstruction);
		if (!encodedInstruction || encodedInstruction.error) {
			console.error("Encoding Error:", encodedInstruction?.error || "Encoder returned null");
			handleSignal.displayControlSignalNodes(null);
			handleSignal.displayDataSignalNodes(null);
			return;
		}
		console.log("Encoded Binary :", encodedInstruction);
		// --- HẾT MÃ HÓA ---

		// --- XỬ LÝ ANIMATION VÀ TÍN HIỆU ---

		// 1. Dọn dẹp tín hiệu từ chu kỳ trước
		handleSignal.clearAllDisplaysAndSignals(); // Hàm mới để dọn dẹp tất cả

		
        // --- Định nghĩa callback sẽ chạy KHI PC đến nơi ---
        const afterFetchCallback = () => {
            console.log("--- PC animation finished, processing instruction fields and signals ---");

            // Lấy lại control signals (đã tính toán trước đó)
            const controlSignals = handleSignal.generateControlSignals(parsedInstruction); // Tính lại hoặc lưu trữ nếu cần tối ưu

            // 4.1 Hiển thị Control Signals Nodes (KHÔNG BẮT ĐẦU ANIMATION VỘI)
            if (controlSignals) {
                handleSignal.displayControlSignalNodes(controlSignals, false); // false = không bắt đầu ngay
            } else {
                 console.warn(`No control signals generated.`);
                 handleSignal.displayControlSignalNodes(null, false);
            }

            // 4.2 Hiển thị Data Signals Nodes (KHÔNG BẮT ĐẦU ANIMATION VỘI)
            // Mã hóa lại hoặc lưu trữ mã máy nếu cần tối ưu
            const encodedInstructionForData = encodeLegv8Instruction(parsedInstruction);
            if(encodedInstructionForData && !encodedInstructionForData.error){
				handleSignal.displayDataSignalNodes(parsedInstruction, encodedInstructionForData, false); // false = không bắt đầu ngay
            } else {
				console.error("Could not encode instruction for data display.");
				handleSignal.displayDataSignalNodes(null, null, false); // Xóa node cũ
            }
            // 4.3 Bắt đầu đồng loạt các animation (Control và Data) MỚI được tạo
            handleSignal.startAllSignalAnimations();
        };
        // --- Kết thúc định nghĩa callback ---

		// 2. Tạo Animation cho PC đi đến Mem Addr và TRUYỀN CALLBACK vào
        handleSignal.animatePCToMemory(pcValueForFetch, afterFetchCallback); // Truyền hàm callback

		console.log("--- Processing Complete for Instruction ---");
		// Display the results in the output area
		// parsedOutput.textContent = JSON.stringify(results, null, 2); // Pretty-print JSON output
		updateParsedOutputTable(results);
	});

}

function updateParsedOutputTable(data) {
	const tbody = document.getElementById("parsedOutputTable");
	if (tbody == null) console.log("[WARNING] tbody is null");
	tbody.innerHTML = ""; // Clear previous

	data.forEach(entry => {
		const { lineNumber, parsed } = entry;
		const { mnemonic, type, structuredOperands = {}, error } = parsed || {};
		const { Rd = "", Rn = "", Rm = "" } = structuredOperands;

		const row = document.createElement("tr");
		row.innerHTML = `
		<td>${lineNumber}</td>
		<td>${mnemonic || ""}</td>
		<td>${type || ""}</td>
		<td>${Rd}</td>
		<td>${Rn}</td>
		<td>${Rm}</td>
		<td>${error || ""}</td>
		`;
		tbody.appendChild(row);
	});
}
