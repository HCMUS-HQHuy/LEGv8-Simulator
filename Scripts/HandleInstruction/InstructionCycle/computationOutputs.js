import { R_TYPE_OPCODES, D_TYPE_OPCODES } from "../Compile/Define/Opcode.js";

export function computeOutputs(componentName, components) {
	switch (componentName) {
		case 'InstructionMemory':
			const InstructionMemory = components[componentName];
			const encodedInstruction = InstructionMemory.instruction[InstructionMemory.ReadAddress >> 2];
			InstructionMemory.Instruction31_00 = encodedInstruction;
			InstructionMemory.Opcode_31_21 = encodedInstruction.substring(0, 11);
			InstructionMemory.Rm_20_16 = encodedInstruction.substring(11, 16);
			InstructionMemory.Rn_09_05 = encodedInstruction.substring(22, 27);
			InstructionMemory.RdRt_04_00 = encodedInstruction.substring(27, 32);
			break;
		case 'Control':
			updateControlUnit(components);
			break;
		case 'ALUControl':
			updateALUControl(components);
			break;
		case 'SignExtend':
			updateSignExtend(components);
			break;
		case 'Register':
			updateRegister(components);
			break;
		case 'Add0':
		case 'Add1':
			const input1 = components[componentName].input1;
			const input2 = components[componentName].input2;
			components[componentName].output = input1 + input2;
			break;

		case 'ShiftLeft2':
			components[componentName].output = components[componentName].input << 2;
			break;

		case 'ALU':
			const op = components[componentName].option;
			const a = components[componentName].input1;
			const b = components[componentName].input2;
			components[componentName].output = doALUOperation(op, a, b);
			components[componentName].zero = (components[componentName].output === 0 ? 1 : 0);
			break;

		case 'Mux0':
		case 'Mux1':
		case 'Mux2':
		case 'Mux3':
			const selected = components[componentName][`input${components[componentName].option}`];
			components[componentName].output = selected;
			break;

		case 'AndGate':
			components[componentName].output = components[componentName].input1 && components[componentName].input2;
			break;

		case 'OrGate':
			components[componentName].output = components[componentName].input1 || components[componentName].input2;
			break;

		default:
			console.warn(`undefined element!${componentName}`);
			break;
	}
}

function doALUOperation(aluControlCode, operand1, operand2) {
	console.warn(`Option: ${aluControlCode} -> ${operand1} -> ${operand2}`);
	switch (aluControlCode) {
		case '0010': // ADD
			return operand1 + operand2;
		case '0110': // SUB (used for SUB, SUBI, and comparisons for branches)
			return operand1 - operand2;
		case '0000': // AND
			return operand1 & operand2;
		case '0001': // ORR
			return operand1 | operand2;
		case '1000': // EOR (XOR)
			return operand1 ^ operand2;
		case '1001': // LSR (Logical Shift Right)
			// !! Quan trọng: Phép dịch trong JS/BigInt cần xử lý số âm đặc biệt
			// !! để mô phỏng đúng LSR (điền 0). Cách dễ nhất là dùng mask.
			// !! Lượng dịch (shamt) thường đến từ instruction bits, không phải operand2.
			// !! -> Cần lấy shamt từ InstructionMemory.Shamt_15_10
			const shamtLSR = currentState.InstructionMemory?.Shamt_15_10 ? parseInt(currentState.InstructionMemory.Shamt_15_10, 2) : 0;
			const sixtyFourBitMaskLSR = (1n << 64n) - 1n;
			// Chuyển operand1 thành số không dấu 64bit trước khi dịch
			const unsignedOperand1LSR = operand1 & sixtyFourBitMaskLSR;
			return unsignedOperand1LSR >> BigInt(shamtLSR);
			
		case '1010': // LSL (Logical Shift Left)
			// Lượng dịch (shamt) từ instruction bits.
			const shamtLSL = currentState.InstructionMemory?.Shamt_15_10 ? parseInt(currentState.InstructionMemory.Shamt_15_10, 2) : 0;
			 // Dịch trái có thể tự nhiên hoạt động đúng với BigInt
			 // Nhưng vẫn nên mask kết quả để đảm bảo 64-bit
			return operand1 << BigInt(shamtLSL);
			
		case '1100': // Pass Input B (operand2)
			return operand2;
			
		case '1101': // Pass Input A (operand1)
			return operand1;
			
		// Thêm các mã khác nếu cần (SLT, MUL, DIV...)
		// case '0111': // SLT (Set on Less Than) - Ví dụ
		//     resultBigInt = (operand1 < operand2) ? 1n : 0n;
		//     break;
		case '1111': // Error code from ALUControl
		default:
			console.warn(`ALU Warning: Received unknown or error ALU control code '${aluControlCode}'. Outputting 0.`);
			return;
	}
}

function updateControlUnit(currentState) {
    const opcode = currentState.InstructionMemory.Opcode_31_21; // Lấy chuỗi 11 bit opcode

    if (Object.values(R_TYPE_OPCODES).includes(opcode)) {
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

    } else if (Object.values(D_TYPE_OPCODES).includes(opcode)) {
        switch (opcode) {
            case '11111000010':
                currentState.Control.Reg2Loc      = 0;
                currentState.Control.ALUSrc       = 1;
                currentState.Control.MemtoReg     = 1;
                currentState.Control.RegWrite     = 1;
                currentState.Control.MemRead      = 1;
                currentState.Control.MemWrite     = 0;
                currentState.Control.Branch       = 0;
                currentState.Control.UncondBranch = 0;
                currentState.Control.ALUOp        = '00';
            break;
            case '11111000000':
                currentState.Control.Reg2Loc      = 1;
                currentState.Control.ALUSrc       = 1;
                currentState.Control.MemtoReg     = 0;
                currentState.Control.RegWrite     = 0;
                currentState.Control.MemRead      = 0;
                currentState.Control.MemWrite     = 1;
                currentState.Control.Branch       = 0;
                currentState.Control.UncondBranch = 0;
                currentState.Control.ALUOp        = '00';
            break;
            default:
                console.error('opcode is not supported in D_TYPE_OPCODES');
        }
    } else {
        console.error(`Opcode ${opcode} is not R-format. Resetting control signals.`);
    }
}

function updateALUControl(currentState) {
    const aluOpSignal = currentState.Control.ALUOp; // Tín hiệu 2-bit từ Control chính
    const mainOpcode = currentState.InstructionMemory.Opcode_31_21; // Opcode 11-bit

    if (currentState.ALUControl.ALUOp !== aluOpSignal || currentState.ALUControl.Opcode !== mainOpcode)
		console.error("Have some problem in updateALUControl");
    
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


function updateRegister(currentState) {
    const readAddr1Binary = currentState.InstructionMemory.Rn_09_05;
    const readAddr2Binary = currentState.Mux1.output;
    const writeAddrBinary = currentState.InstructionMemory.RdRt_04_00;

	const formatRegIndex = (a) => {
		return parseInt(a, 2);
    };

    const readIndex1 = parseInt(readAddr1Binary, 2);
    const readIndex2 = parseInt(readAddr2Binary, 2);
    const writeIndex = parseInt(writeAddrBinary, 2);

    // 4. Simulate Register Reads
    let readData1Output = null;
    let readData2Output = null;

    if (readIndex1 !== null) readData1Output = currentState.Register.registerValues[readIndex1] ?? 0;
    if (readIndex2 !== null) readData2Output = currentState.Register.registerValues[readIndex2] ?? 0;

    if (parseInt(currentState.Register.Read1, 2) !== readIndex1 || 
		parseInt(currentState.Register.Read2, 2) !== readIndex2 || 
		parseInt(currentState.Register.WriteReg, 2) !== writeIndex) {
		console.warn(`${formatRegIndex(currentState.Register.Read1)} -> ${readIndex1}`);
		console.warn(`${formatRegIndex(currentState.Register.Read2)} -> ${readIndex2}`);
		console.warn(`${formatRegIndex(currentState.Register.WriteReg)} -> ${writeIndex}`);
		console.warn("have some problems in register update value");
	}
    currentState.Register.ReadData1 = readData1Output;
    currentState.Register.ReadData2 = readData2Output;
}
