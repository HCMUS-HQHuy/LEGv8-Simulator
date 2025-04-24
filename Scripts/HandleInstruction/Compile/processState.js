import {parseLegv8Instruction, encodeLegv8Instruction} from "./parser.js"

const state = {
	PC: {
		OldValue: null,
		Newvalue: 15
	},
	InstructionMemory: {
		ReadAddress: null,
		Instruction: null,
		Instruction31_21: null,
		Instruction09_05: null,
		Instruction20_16: null,
		Instruction04_00: null,
		Instruction31_00: null,
	},
	Register: {
		option: null,
		Read1: null,
		Read2: null,
		WriteReg: null, 
		WriteData: null,
		ReadData1: null,
		ReadData2: null
	},
	DataMemory: {

	},
	Add0: {

	},
	Add1: {

	},
	ALU: {
		input1: null,
		input2: null,
		option: null,
		output: null,
		zero  : null
	},
	Control: {
		Reg2Loc:  0, // X -> 0
        ALUSrc:   0,
        MemtoReg: 0, // X -> 0
        RegWrite: 1,
        MemRead:  0,
        MemWrite: 0,
        Branch:   0, // X -> 0
        UncondBranch:   0, // X -> 0
		ALUOp: 'XX'
	},
	ShiftLeft2: {
        input: null,
        output: null,
	},
	SignExtend: {
		input: null,
		output: null,
	},
	ALUControl: {
		ALUOp: null,
		Opcode: null,
		output: null,
	},
	Mux0: {

	},
	Mux1: {
		input0: null,
		input1: null,
		option: null,
		output: null
	},
	Mux2: {
		input0: null,
		input1: null,
		option: null,
		output: null
	},
	Mux3: {

	},
	AndGate: {

	},
	OrGate: {

	},
	registerValues: {

	}
};

export function generateState(parsedInstruction) {
	updatePC(state, parsedInstruction);
	updateInstructionMemory(state, parsedInstruction);
	updateControlUnit(state);
	updateALUControl(state);
	updateSignExtend(state);
	updateMux1(state);
	updateMux2(state);
    updateShiftLeft2(state);
	updateRegister(state);
	return state;
}

function updatePC(currentState, parsedInstruction) {
	const currentPC = currentState.PC.Newvalue;
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
    currentState.PC.OldValue = currentState.PC.Newvalue;
    currentState.PC.Newvalue = nextPC;
    console.log(`PC updated: Old=${currentState.PC.OldValue}, New=${currentState.PC.Newvalue}`);
}

function updateInstructionMemory(currentState, parsedInstruction) {
	currentState.InstructionMemory.ReadAddress = currentState.PC.Newvalue;
	const encodedInstruction = encodeLegv8Instruction(parsedInstruction);
	currentState.InstructionMemory.Instruction = encodedInstruction;
	currentState.InstructionMemory.Instruction31_00 = encodedInstruction;
	currentState.InstructionMemory.Instruction31_21 = encodedInstruction.substring(0, 11);
	currentState.InstructionMemory.Instruction20_16 = encodedInstruction.substring(11, 16);
	currentState.InstructionMemory.Instruction09_05 = encodedInstruction.substring(22, 27);
	currentState.InstructionMemory.Instruction04_00 = encodedInstruction.substring(27, 32);
	console.log("Creating data signal nodes for:", parsedInstruction.mnemonic);
}

function updateControlUnit(currentState) {
    const opcode = currentState.InstructionMemory.Instruction31_21; // Lấy chuỗi 11 bit opcode

    // 2. Xác định các opcode R-format (Cần kiểm tra lại danh sách này cho chính xác)
    const rFormatOpcodes = [
        '10001011000', // ADD
        '11001011000', // SUB
        '10001010000', // AND
        '10101010000', // ORR
        '11101010000', // EOR
        '11010011010', // LSR (Ví dụ)
        '11010011011'  // LSL (Ví dụ)
    ];
    const brOpcode = '11010110000'; // BR

    if (rFormatOpcodes.includes(opcode)) {
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


function signExtend(binaryString, originalBitLength, targetBitLength = 64) {
	return  binaryString[0].repeat(targetBitLength - originalBitLength) + binaryString;
}

function updateSignExtend(currentState) {

	const control = currentState.Control;
    const fullInstruction = currentState.InstructionMemory.Instruction31_00;
    const opcode = currentState.InstructionMemory.Instruction31_21;

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
		currentState.SignExtend.output = `0x${parseInt(outputValue, 2).toString(16).toUpperCase()}`;
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
    const mainOpcode = currentState.InstructionMemory.Instruction31_21; // Opcode 11-bit

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
    const input1_RtRd = currentState.InstructionMemory.Instruction04_00; // Bits [4:0]
    const input2_Rm   = currentState.InstructionMemory.Instruction20_16; // Bits [20:16]
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
    currentState.Mux2.input1 = input1_SignExt;
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
    const readAddr1Binary = currentState.InstructionMemory.Instruction09_05;
    const readAddr2Binary = currentState.Mux1.output;
    const writeAddrBinary = currentState.InstructionMemory.Instruction04_00;
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
    const hexInputValue = currentState?.SignExtend?.output;
    currentState.ShiftLeft2.input = hexInputValue; // Lưu input gốc
    let outputHex = null;

    if (hexInputValue && typeof hexInputValue === 'string' &&
        (hexInputValue.startsWith('0x') || hexInputValue.startsWith('0X')))
    {
        try {
            const inputBigInt = BigInt(hexInputValue);
            const shiftedBigInt = inputBigInt << 2n; // Dùng 2n cho BigInt literal
            const sixtyFourBitMask = (1n << 64n) - 1n; // Tạo mask 0xFFFFFFFFFFFFFFFF
            const resultIn64Bit = shiftedBigInt & sixtyFourBitMask;
            let hexString = resultIn64Bit.toString(16);
            const paddedHexString = hexString.padStart(16, '0');
            outputHex = '0x' + paddedHexString;

        } catch (e) {
            console.error(`ShiftLeft2 Error processing hex '${hexInputValue}': ${e.message}`);
            outputHex = null;
        }
    } else if (hexInputValue !== null && hexInputValue !== undefined) {
         console.warn(`ShiftLeft2 Warning: Input '${hexInputValue}' is not a valid hex string starting with "0x".`);
         outputHex = null;
    }
    currentState.ShiftLeft2.output = outputHex;

    console.log("ShiftLeft2 Updated:", currentState.ShiftLeft2);
}