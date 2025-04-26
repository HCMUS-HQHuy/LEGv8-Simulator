import {parseLegv8Instruction, encodeLegv8Instruction} from "./parser.js"
import {Components} from "./Define/components.js"
import {R_TYPE_OPCODES} from "./Define/Opcode.js"


export function udpateComponents(parsedInstruction) {
	updatePC(Components, parsedInstruction);
	updateInstructionMemory(Components, parsedInstruction);
	updateControlUnit(Components);
	updateALUControl(Components);
	updateSignExtend(Components);
	updateMux1(Components);
	updateMux2(Components);
    updateShiftLeft2(Components);
	updateRegister(Components);
    updateAdd1(Components);
    updateAdd0(Components);
    updateALU(Components);
	return Components;
}

function updatePC(currentState, parsedInstruction) {
	const currentPC = currentState.PC.NewValue;
    let nextPC = null;
    if (parsedInstruction.type === 'R') {
        nextPC = currentPC + 4;
        console.log(`PC Update (R-format): Sequential execution. Next PC=${nextPC}`);
    } else {
        console.warn(`Warning: updatePC_RFormatOnly received a non-R-format instruction (${parsedInstruction.type}). Defaulting to PC + 4.`);
        nextPC = currentPC + 4;
        console.error(`Error: updatePC_RFormatOnly should only receive R-format instructions. Received: ${parsedInstruction.type}`);
        return;
    }
    currentState.PC.OldValue = currentState.PC.NewValue;
    currentState.PC.NewValue = nextPC;
    console.log(`PC updated: Old=${currentState.PC.OldValue}, New=${currentState.PC.NewValue}`);
}

function updateInstructionMemory(currentState, parsedInstruction) {
	currentState.InstructionMemory.ReadAddress = `0x${currentState.PC.OldValue.toString(16).toUpperCase()}`;
	const encodedInstruction = encodeLegv8Instruction(parsedInstruction);
	currentState.InstructionMemory.Instruction31_00 = encodedInstruction;
	currentState.InstructionMemory.Opcode_31_21 = encodedInstruction.substring(0, 11);
	currentState.InstructionMemory.Rm_20_16 = encodedInstruction.substring(11, 16);
	currentState.InstructionMemory.Rn_09_05 = encodedInstruction.substring(22, 27);
	currentState.InstructionMemory.RdRt_04_00 = encodedInstruction.substring(27, 32);
	console.log("Creating data signal nodes for:", parsedInstruction.mnemonic);
}

function updateControlUnit(currentState) {
    const opcode = currentState.InstructionMemory.Opcode_31_21; // Lấy chuỗi 11 bit opcode

    const brOpcode = '11010110000'; // BR

    if (Object.values(R_TYPE_OPCODES).includes(opcode)) {
        // --- Lệnh R-Format thông thường (ADD, SUB, AND, ORR, ...) ---
        currentState.Control.Reg2Loc = 0;       // Theo yêu cầu X -> 0
        currentState.Control.ALUSrc = 0;        // ALU dùng [Rm]
        currentState.Control.MemtoReg = 0;      // Kết quả từ ALU ghi vào Reg
        currentState.Control.RegWrite = 1;      // Có ghi thanh ghi Rd
        currentState.Control.MemRead = 0;       // Không đọc Mem
        currentState.Control.MemWrite = 0;      // Không ghi Mem
        currentState.Control.Branch = 0;        // Không phải Branch có điều kiện
        currentState.Control.UncondBranch = 0;  // Không phải Branch không điều kiện
        currentState.Control.ALUOp = '10';      // ALU Control sẽ dựa vào funct bits
        console.log(`Control set for R-format instruction (Opcode: ${opcode})`);

    } else if (opcode === brOpcode) {
        // --- Lệnh BR (Định dạng R nhưng tín hiệu khác) ---
        currentState.Control.Reg2Loc = 0;       // Theo yêu cầu X -> 0
        currentState.Control.ALUSrc = 0;        // Không quan trọng lắm (đầu vào 2 ALU)
        currentState.Control.MemtoReg = 0;      // Không ghi Reg -> Don't Care (X -> 0)
        currentState.Control.RegWrite = 0;      // Không ghi thanh ghi
        currentState.Control.MemRead = 0;
        currentState.Control.MemWrite = 0;
        currentState.Control.Branch = 0;        // updatePC xử lý BR, không cần tín hiệu này
        currentState.Control.UncondBranch = 0;  // updatePC xử lý BR, không cần tín hiệu này
        currentState.Control.ALUOp = 'XX';      // ALU không thực hiện phép toán chính (hoặc '00'/'01')
        console.log(`Control set for BR instruction (Opcode: ${opcode})`);
    } else {
        console.warn(`Opcode ${opcode} is not R-format. Resetting control signals.`);
        currentState.Control.Reg2Loc = 0;
        currentState.Control.ALUSrc = 0;
        currentState.Control.MemtoReg = 0;
        currentState.Control.RegWrite = 0;
        currentState.Control.MemRead = 0;
        currentState.Control.MemWrite = 0;
        currentState.Control.Branch = 0;
        currentState.Control.UncondBranch = 0;
        currentState.Control.ALUOp = 'XX'; // Không xác định
    }
}

function updateSignExtend(currentState) {

    const signExtend = (binaryString, originalBitLength, targetBitLength = 64) => {
        return  binaryString[0].repeat(targetBitLength - originalBitLength) + binaryString;
    }

	const control = currentState.Control;
    const fullInstruction = currentState.InstructionMemory.Instruction31_00;
    const opcode = currentState.InstructionMemory.Opcode_31_21;

    let inputBinary = null;
    let originalBits = 0;
    const targetBits = 64;

    // 2. Xác định đầu vào cho Sign Extend dựa trên tín hiệu và loại lệnh
    if (control.ALUSrc === 1) {
        // --- ALUSrc = 1: ALU dùng Immediate. Cần xác định loại Immediate ---
        // Kiểm tra các loại lệnh dùng ALUSrc=1: I-type, D-type, IW-type

        // D-type (LDUR/STUR): Offset 9 bit (DT-address)
        if (opcode === '11111000010' || opcode === '11111000000') {
            inputBinary = fullInstruction.substring(11, 20); // Bits 20-12 (9 bits)
            originalBits = 9;
        }
        // I-type (ADDI/SUBI): Immediate 12 bit
        else if (opcode?.startsWith('1001000100') || opcode?.startsWith('1101000100')) {
            inputBinary = fullInstruction.substring(10, 22); // Bits 21-10 (12 bits)
            originalBits = 12;
        }
         // IW-type (MOVZ/MOVK): Immediate 16 bit
        else if (opcode?.startsWith('110100101')) {
             inputBinary = fullInstruction.substring(11, 27); // Bits 20-5 (16 bits) --> Kiểm tra lại spec! spec nói bit 20-5
             originalBits = 16;
             // Lưu ý quan trọng: MOVZ thường là *ZERO* extend. Nếu cần chính xác,
             // bạn nên có một khối ZeroExtend riêng hoặc logic đặc biệt ở đây.
             // Tạm thời vẫn dùng SignExtend theo yêu cầu chung.
        }
        // Thêm các trường hợp khác nếu có (ví dụ: ANDI, ORRI - cũng là I-type 12 bit)
         else if (opcode?.startsWith('1001001000') || // ANDI
                  opcode?.startsWith('1011001000') || // ORRI
                  opcode?.startsWith('1101001000'))   // EORI
         {
             inputBinary = fullInstruction.substring(10, 22); // Bits 21-10 (12 bits)
             originalBits = 12;
         }
         else {
            // ALUSrc=1 nhưng không khớp loại lệnh nào ở trên? Có thể là lỗi logic Control Unit.
            console.warn(`Warning: ALUSrc is 1, but opcode ${opcode} doesn't match expected I/D/IW types needing immediate for ALU.`);
         }

    } else if (control.UncondBranch === 1) {
        // --- UncondBranch = 1: Lệnh B ---
        // Offset 26 bit
        inputBinary = fullInstruction.substring(6, 32); // Bits 25-0 (26 bits)
        originalBits = 26;

    } else if (control.Branch === 1) {
        inputBinary = fullInstruction.substring(8, 27); // Bits 23-5 (19 bits)
        originalBits = 19;
    } else {
		const inputHex = parseInt(fullInstruction, 2).toString(16).toUpperCase();
		currentState.SignExtend.input = `0x${inputHex}`;
		const outputValue = signExtend(fullInstruction, 32, targetBits);
		currentState.SignExtend.output = parseInt(outputValue, 2);
		return;
	}
    let outputValue = null;
    if (inputBinary !== null && originalBits > 0) {
        outputValue = signExtend(inputBinary, originalBits, targetBits);
    }
    currentState.SignExtend.input = inputBinary;
    currentState.SignExtend.output = outputValue;

    console.log("Sign Extend Updated:", currentState.SignExtend);
}

function updateALUControl(currentState) {
    const aluOpSignal = currentState.Control.ALUOp; // Tín hiệu 2-bit từ Control chính
    const mainOpcode = currentState.InstructionMemory.Opcode_31_21; // Opcode 11-bit

    currentState.ALUControl.ALUOp = aluOpSignal;
    currentState.ALUControl.Opcode = mainOpcode;

    let aluControlCode = '1111';
    switch (aluOpSignal) {
        case '00':
            aluControlCode = '0010'; // Mã ADD
            break;
        case '01':
            aluControlCode = '0110'; // Mã SUB
            break;
        case '10':
            switch (mainOpcode) {
                case '10001011000': aluControlCode = '0010'; break; // ADD
                case '11001011000': aluControlCode = '0110'; break; // SUB
                case '10001010000': aluControlCode = '0000'; break; // AND
                case '10101010000': aluControlCode = '0001'; break; // ORR
                case '11101010000': aluControlCode = '1000'; break; // EOR
                case '11010011010': aluControlCode = '1001'; break; // LSR (Kiểm tra opcode)
                case '11010011011': aluControlCode = '1010'; break; // LSL (Kiểm tra opcode)
                // Thêm các lệnh R-type khác nếu hỗ trợ
                // case '10011011000': aluControlCode = 'xxxx'; break; // MUL (cần mã riêng)
                case '11010110000': // BR
                    aluControlCode = '1101'; // Mã Pass A (giả định ALU chuyển địa chỉ từ Rn)
                                             // Hoặc '1111' (NOP) nếu ALU không dùng
                    break;
                default:
                    aluControlCode = '1111'; // Mã UNKNOWN/ERROR
                    console.warn(`ALU Control: Unknown R-type opcode ${mainOpcode} for ALUOp='10'`);
                    break;
            }
            break;

        case '11': // Dành cho I-type instructions (Arithmetic/Logic/Move Wide)
            // Hoạt động cụ thể phụ thuộc vào opcode 11 bit
            if (mainOpcode.startsWith('1001000100')) { // ADDI
                aluControlCode = '0010'; // Mã ADD
            } else if (mainOpcode.startsWith('1101000100')) { // SUBI
                aluControlCode = '0110'; // Mã SUB
            } else if (mainOpcode.startsWith('1001001000')) { // ANDI
                aluControlCode = '0000'; // Mã AND
            } else if (mainOpcode.startsWith('1011001000')) { // ORRI
                aluControlCode = '0001'; // Mã ORR
            } else if (mainOpcode.startsWith('1101001000')) { // EORI
                aluControlCode = '1000'; // Mã EOR
            } else if (mainOpcode.startsWith('110100101')) { // MOVZ / MOVK
                aluControlCode = '1100'; // Mã Pass B (ALU chuyển immediate đã mở rộng)
            } else {
                 aluControlCode = '1111'; // Mã UNKNOWN/ERROR
                 console.warn(`ALU Control: Unknown I/IW-type opcode ${mainOpcode} for ALUOp='11'`);
            }
            break;

        case 'XX': // Trường hợp lỗi từ Control Unit chính
        default:
            aluControlCode = '1111'; // Mã ERROR
            console.error(`ALU Control: Received invalid ALUOp signal '${aluOpSignal}' from main Control.`);
            break;
    }
    currentState.ALUControl.output = aluControlCode;

    console.log("ALU Control Updated:", currentState.ALUControl);
}

function updateMux1(currentState) {
    const input1_RtRd = currentState.InstructionMemory.RdRt_04_00; // Bits [4:0]
    const input2_Rm   = currentState.InstructionMemory.Rm_20_16; // Bits [20:16]
    const selector    = currentState.Control.Reg2Loc;                    // Tín hiệu điều khiển

    currentState.Mux1.input0 = input1_RtRd;
    currentState.Mux1.input1 = input2_Rm;
    currentState.Mux1.option = selector;

    let outputValue = null; // Giá trị mặc định nếu selector không hợp lệ

    if (selector === 0) {
        outputValue = input2_Rm;
    } else if (selector === 1) {
        outputValue = input1_RtRd;
    } else {
        console.warn(`Mux1: Invalid selector value '${selector}'. Output will be null.`);
    }
    currentState.Mux1.output = outputValue;
    console.log("Mux1 Updated:", currentState.Mux1);
}

function updateMux2(currentState) {
	const input0_RegData2 = currentState.Register.ReadData2;
    const input1_SignExt  = currentState.SignExtend.output;
    const selector        = currentState.Control.ALUSrc;

	currentState.Mux2.input0 = input0_RegData2;
    currentState.Mux2.input1 = `0x${input1_SignExt.toString(16).toUpperCase()}`;
    currentState.Mux2.option = selector;

    let outputValue = null;

    if (selector === 0) {
        outputValue = input0_RegData2;
    } else if (selector === 1) {
        outputValue = input1_SignExt;
    } else {
        console.warn(`Mux2: Invalid selector value '${selector}'. Output will be null.`);
    }
    currentState.Mux2.output = outputValue;
}

function updateRegister(currentState) {
    const regWriteEnable  = currentState.Control.RegWrite;
    const readAddr1Binary = currentState.InstructionMemory.Rn_09_05;
    const readAddr2Binary = currentState.Mux1.output;
    const writeAddrBinary = currentState.InstructionMemory.RdRt_04_00;
    const writeDataValue  = null; // Placeholder - Actual data comes from MemToReg Mux later

	const formatRegIndex = (a) => {
		const index = (a && a.length === 5) ? parseInt(a, 2) : null
        if (index === null) {
			console.warn('index is null in process State');
            return null;
        } 
		if (index === 31) return 'XZR';
        if (index >= 0 && index < 31) return 'X' + String(index).padStart(2, '0');
		console.warn(`Formatting invalid register index: ${index}`);
		return null;
    };

    const readIndex1 = formatRegIndex(readAddr1Binary);
    const readIndex2 = formatRegIndex(readAddr2Binary);
    const writeIndex = formatRegIndex(writeAddrBinary);

    // 4. Simulate Register Reads
    let readData1Output = null;
    let readData2Output = null;

    if (readIndex1 !== null) readData1Output = currentState.registerValues[readIndex1] ?? 0;
    if (readIndex2 !== null) readData2Output = currentState.registerValues[readIndex2] ?? 0;

    currentState.Register.option = regWriteEnable;       // Store the RegWrite signal
    currentState.Register.read1 = readIndex1;            // Store read address 1 (index)
    currentState.Register.read2 = readIndex2;            // Store read address 2 (index)
    currentState.Register.writeReg = writeIndex;         // Store potential write address (index)
    currentState.Register.WriteData = writeDataValue;    // Store placeholder for write data
    currentState.Register.ReadData1 = readData1Output;   // Store data read from port 1
    currentState.Register.ReadData2 = readData2Output;   // Store data read from port 2

	console.log("Register State Updated:", currentState.Register);
}

function updateShiftLeft2(currentState) {
    const value = currentState?.SignExtend?.output;
    currentState.ShiftLeft2.input = `0x${value.toString(16).toUpperCase()}`;
    currentState.ShiftLeft2.output = (value << 2);

    console.log("ShiftLeft2 Updated:", currentState.ShiftLeft2);
}

function updateAdd0(currentState) {
    const hexInputPCOld = currentState.PC.OldValue;
    const constantInput4 = 4; // Input 2 is the constant 4
    currentState.Add0.input1 = `0x${hexInputPCOld.toString(16)}`;
    currentState.Add0.input2 = `0x${constantInput4.toString(16)}`;
    currentState.Add0.output = hexInputPCOld + constantInput4;
    console.log("Add0 Updated:", currentState.Add0);
}

function updateAdd1(currentState) {
    const hexInputPC = currentState.PC.OldValue;
    const hexInputSL2 = currentState.ShiftLeft2.output;
    currentState.Add1.input1 = `0x${hexInputPC.toString(16).toUpperCase()}`;
    currentState.Add1.input2 = `0x${hexInputSL2.toString(16).toUpperCase()}`;
    currentState.Add1.output = hexInputPC + hexInputSL2;
    console.log("Add1 Updated:", currentState.Add1);
}

function updateALU(currentState) {

    const inputVal1 = currentState.Register.ReadData1;
    const inputVal2 = currentState.Mux2.output;
    const aluControlCode = currentState.ALUControl.output; // Mã 4-bit

    currentState.ALU.input1 = inputVal1;
    currentState.ALU.input2 = inputVal2;
    currentState.ALU.option = aluControlCode;

    let resultBigInt = 0n; // Default result as BigInt 0
    let zeroFlag = 0;   // Default zero flag

    const operand1 = BigInt(inputVal1);
    const operand2 = BigInt(inputVal2);

    try {
        switch (aluControlCode) {
            case '0010': // ADD
                resultBigInt = operand1 + operand2;
                break;
            case '0110': // SUB (used for SUB, SUBI, and comparisons for branches)
                resultBigInt = operand1 - operand2;
                break;
            case '0000': // AND
                resultBigInt = operand1 & operand2;
                break;
            case '0001': // ORR
                resultBigInt = operand1 | operand2;
                break;
            case '1000': // EOR (XOR)
                resultBigInt = operand1 ^ operand2;
                break;
            case '1001': // LSR (Logical Shift Right)
                // !! Quan trọng: Phép dịch trong JS/BigInt cần xử lý số âm đặc biệt
                // !! để mô phỏng đúng LSR (điền 0). Cách dễ nhất là dùng mask.
                // !! Lượng dịch (shamt) thường đến từ instruction bits, không phải operand2.
                // !! -> Cần lấy shamt từ InstructionMemory.Shamt_15_10
                const shamtLSR = currentState.InstructionMemory?.Shamt_15_10 ? parseInt(currentState.InstructionMemory.Shamt_15_10, 2) : 0;
                const sixtyFourBitMaskLSR = (1n << 64n) - 1n;
                // Chuyển operand1 thành số không dấu 64bit trước khi dịch
                const unsignedOperand1LSR = operand1 & sixtyFourBitMaskLSR;
                resultBigInt = unsignedOperand1LSR >> BigInt(shamtLSR);
                break;
            case '1010': // LSL (Logical Shift Left)
                // Lượng dịch (shamt) từ instruction bits.
                const shamtLSL = currentState.InstructionMemory?.Shamt_15_10 ? parseInt(currentState.InstructionMemory.Shamt_15_10, 2) : 0;
                 // Dịch trái có thể tự nhiên hoạt động đúng với BigInt
                 // Nhưng vẫn nên mask kết quả để đảm bảo 64-bit
                resultBigInt = operand1 << BigInt(shamtLSL);
                break;
            case '1100': // Pass Input B (operand2)
                resultBigInt = operand2;
                break;
            case '1101': // Pass Input A (operand1)
                resultBigInt = operand1;
                break;
            // Thêm các mã khác nếu cần (SLT, MUL, DIV...)
            // case '0111': // SLT (Set on Less Than) - Ví dụ
            //     resultBigInt = (operand1 < operand2) ? 1n : 0n;
            //     break;
            case '1111': // Error code from ALUControl
            default:
                console.warn(`ALU Warning: Received unknown or error ALU control code '${aluControlCode}'. Outputting 0.`);
                resultBigInt = 0n; // Default to 0 on unknown operation
                break;
        }

        // 5. Ensure result is within 64-bit range (Apply mask)
        const sixtyFourBitMask = (1n << 64n) - 1n;
        const resultIn64Bit = resultBigInt & sixtyFourBitMask;

        // 6. Update Output
        currentState.ALU.output = resultIn64Bit;

        // 7. Update Zero Flag
        // Cờ zero được set nếu kết quả *sau khi mask 64-bit* là 0
        zeroFlag = (resultIn64Bit === 0n) ? 1 : 0;
        currentState.ALU.zero = zeroFlag;

    } catch (e) {
        console.error(`ALU Error during operation '${aluControlCode}': ${e.message}`);
        currentState.ALU.output = null; // Indicate error
        currentState.ALU.zero = 0;      // Default zero flag on error
    }
}