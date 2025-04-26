import {parseLegv8Instruction, encodeLegv8Instruction} from "./parser.js"
import {Components} from "./Define/components.js"
import {R_TYPE_OPCODES} from "./Define/Opcode.js"


export function getComponents(parsedInstruction) {
	// updateInstructionMemory(Components, parsedInstruction);
	// updateControlUnit(Components);
	// updateALUControl(Components);
	// updateSignExtend(Components);
	// updateMux1(Components);
	// updateMux2(Components);
    // updateShiftLeft2(Components);
	// updateRegister(Components);
    // updateAdd1(Components);
    // updateAdd0(Components);
    // updateALU(Components);
    // updateAndGate(Components);
    // updateOrGate(Components);

    // updateMux0(Components);
    // updatePC(Components);
	return Components;
}

function updatePC(currentState) {
    currentState.PC.value = currentState.Mux0.output;
}

function updateInstructionMemory(currentState, parsedInstruction) {
	currentState.InstructionMemory.ReadAddress = `0x${currentState.PC.value.toString(16).toUpperCase()}`;
	const encodedInstruction = encodeLegv8Instruction(parsedInstruction);
	currentState.InstructionMemory.Instruction31_00 = encodedInstruction;
	currentState.InstructionMemory.Opcode_31_21 = encodedInstruction.substring(0, 11);
	currentState.InstructionMemory.Rm_20_16 = encodedInstruction.substring(11, 16);
	currentState.InstructionMemory.Rn_09_05 = encodedInstruction.substring(22, 27);
	currentState.InstructionMemory.RdRt_04_00 = encodedInstruction.substring(27, 32);
	console.log("Creating data signal nodes for:", parsedInstruction.mnemonic);
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
    currentState.Register.Read1 = readIndex1;            // Store read address 1 (index)
    currentState.Register.Read2 = readIndex2;            // Store read address 2 (index)
    currentState.Register.WriteReg = writeIndex;         // Store potential write address (index)
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
    const hexInputPCOld = currentState.PC.value;
    const constantInput4 = 4; // Input 2 is the constant 4
    currentState.Add0.input1 = `0x${hexInputPCOld.toString(16)}`;
    currentState.Add0.input2 = `0x${constantInput4.toString(16)}`;
    currentState.Add0.output = hexInputPCOld + constantInput4;
    console.log("Add0 Updated:", currentState.Add0);
}

function updateAdd1(currentState) {
    const hexInputPC = currentState.PC.value;
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

function updateAndGate(currentState) {
    const input1_Branch = currentState.Control.Branch;
    const input2_Zero = currentState.ALU.zero;
    currentState.AndGate.input1 = input1_Branch;
    currentState.AndGate.input2 = input2_Zero;
    currentState.AndGate.output = (input1_Branch === 1 && input2_Zero === 1) ? 1 : 0;
}

function updateOrGate(currentState) {
    const input1_UnControlBranch = currentState.Control.UncondBranch;
    const input2_AndGate = currentState.AndGate.output;
    currentState.AndGate.input1 = input1_UnControlBranch;
    currentState.AndGate.input2 = input2_AndGate;
    currentState.AndGate.output = (input1_UnControlBranch === 1 || input2_AndGate === 1) ? 1 : 0;
}

function updateMux0(currentState) {
    const selector = currentState.OrGate.output;
    currentState.Mux0.input0 = currentState.Add0.output;
    currentState.Mux0.input1 = currentState.Add1.output;
    currentState.Mux0.option = selector;
    currentState.Mux0.output = currentState.Mux0[`input${selector}`];
    console.log("Mux1 Updated:", currentState.Mux0);
}