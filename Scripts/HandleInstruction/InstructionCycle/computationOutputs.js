import { R_TYPE_OPCODES, D_TYPE_OPCODES } from "../Compile/Define/Opcode.js";
import { B_TYPE_OPCODES, CB_TYPE_OPCODES }  from "../Compile/Define/Opcode.js"
import { I_TYPE_OPCODES }  from "../Compile/Define/Opcode.js"

export function computeOutputs(componentName, components) {
	switch (componentName) {
		case 'InstructionMemory':
			const InstructionMemory = components[componentName];
			const encodedInstruction = InstructionMemory.instruction[InstructionMemory.ReadAddress >> 2];
            if (encodedInstruction == null) console.error("encodedInstruction is null in computation Ouputs");
            else console.log("hello: ", encodedInstruction);
			InstructionMemory.Opcode_31_21 = encodedInstruction.substring(0, 11);
			InstructionMemory.Rm_20_16 = encodedInstruction.substring(11, 16);
			InstructionMemory.Rn_09_05 = encodedInstruction.substring(22, 27);
			InstructionMemory.RdRt_04_00 = encodedInstruction.substring(27, 32);

            InstructionMemory.SignExtend = encodedInstruction;
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
        case 'DataMemory':
            updateDataMemory(components);
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
			components[componentName].output = doALUOperation(components);
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

// ADDI X1, X1, #2
// ADDI X2, X2, #3
// STUR X2, [X1, #8]

function doALUOperation(currentState) {
    const aluControlCode = currentState['ALU'].option;

    const operand1 = currentState['ALU'].input1;
    const operand2 = currentState['ALU'].input2;
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
        case '0111':
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
    // 1. Input Validation
    if (!currentState || !currentState.Control || !currentState.InstructionMemory ||
        !currentState.InstructionMemory.Opcode_31_21)
    {
        console.error("ControlUnit Error: Invalid state or missing Opcode_31_21.");
        // Reset control signals to default/safe state if possible
        if (currentState && currentState.Control) {
            Object.assign(currentState.Control, {
                Reg2Loc: 0, ALUSrc: 0, MemtoReg: 0, RegWrite: 0, MemRead: 0,
                MemWrite: 0, Branch: 0, UncondBranch: 0, ALUOp: 'XX'
            });
        }
        return;
    }

    const opcode11bit = currentState.InstructionMemory.Opcode_31_21; // Lấy chuỗi 11 bit opcode
    const opcode10bit = opcode11bit.substring(0, 10); // Lấy 10 bit đầu cho I-type
    const opcode8bit  = opcode11bit.substring(0, 8);  // Lấy 8 bit đầu cho CB-type
    const opcode6bit  = opcode11bit.substring(0, 6);  // Lấy 6 bit đầu cho B-type

    // Reset về trạng thái mặc định trước khi set
    // Điều này quan trọng để các tín hiệu không được set sẽ có giá trị 0/an toàn
    currentState.Control.Reg2Loc = 0;
    currentState.Control.ALUSrc = 0;
    currentState.Control.MemtoReg = 0;
    currentState.Control.RegWrite = 0;
    currentState.Control.MemRead = 0;
    currentState.Control.MemWrite = 0;
    currentState.Control.Branch = 0;
    currentState.Control.UncondBranch = 0;
    currentState.Control.ALUOp = 'XX'; // Mặc định không xác định/lỗi

    // 2. Xác định tín hiệu dựa trên loại lệnh và opcode

    if (Object.values(R_TYPE_OPCODES).includes(opcode11bit)) {
        // --- R-Type (ADD, SUB, AND, ORR, EOR, LSL, LSR) ---
        currentState.Control.RegWrite = 1;
        currentState.Control.ALUSrc = 0;        // Dùng [Rm]
        currentState.Control.MemtoReg = 0;      // Kết quả từ ALU
        currentState.Control.ALUOp = '10';      // ALU Control sẽ dựa vào funct bits
        // Reg2Loc = 0 (Mux1 chọn Rm)
        // MemRead, MemWrite, Branch, UncondBranch = 0
        // console.log(`Control set for R-format (Opcode: ${opcode11bit})`);

    } else if (Object.values(D_TYPE_OPCODES).includes(opcode11bit)) {
        // --- D-Type (LDUR, STUR) ---
        currentState.Control.ALUSrc = 1;        // Dùng immediate (offset)
        currentState.Control.ALUOp = '00';      // ALU cộng địa chỉ (Base + Offset)

        if (opcode11bit === D_TYPE_OPCODES['LDUR']) { // LDUR
            currentState.Control.RegWrite = 1;
            currentState.Control.MemRead = 1;
            currentState.Control.MemtoReg = 1;
        } else if (opcode11bit === D_TYPE_OPCODES['STUR']) {
            currentState.Control.MemWrite = 1;
            currentState.Control.Reg2Loc = 1
        }
        // console.log(`Control set for D-format (Opcode: ${opcode11bit})`);

    } else if (Object.values(I_TYPE_OPCODES).includes(opcode10bit)) {
        // --- I-Type (ADDI, SUBI, ANDI, ORRI, EORI) ---
        // Opcode của I-type là 10 bit
        currentState.Control.RegWrite = 1;
        currentState.Control.ALUSrc = 1;        // Dùng Immediate
        currentState.Control.MemtoReg = 0;      // Kết quả từ ALU
        currentState.Control.ALUOp = '11';      // ALU Control sẽ biết là loại I (ADD/SUB/Logic)
        // Reg2Loc, MemRead, MemWrite, Branch, UncondBranch = 0
        // console.log(`Control set for I-format (Opcode: ${opcode10bit})`);

    } else if (Object.values(B_TYPE_OPCODES).includes(opcode6bit)) {
        // --- B-Type (B, BL) ---
        // Opcode của B-type là 6 bit
        currentState.Control.UncondBranch = 1;
        currentState.Control.ALUOp = '01';

    } else if (Object.values(CB_TYPE_OPCODES).includes(opcode8bit)) {
        currentState.Control.Reg2Loc = 1;
        currentState.Control.ALUSrc = 0;
        currentState.Control.Branch = 1;
        currentState.Control.ALUOp = '01';

    }
    // --- THÊM CÁC LOẠI LỆNH KHÁC Ở ĐÂY (IW, SYS) ---
    // else if (/* IW-type opcodes */) { ... }
    // else if (/* SYS-type opcodes */) { ... }
    else {
        // Opcode không được nhận dạng, các tín hiệu đã được reset về mặc định (ALUOp='XX')
        console.warn(`ControlUnit: Opcode ${opcode11bit} not recognized or supported. Using default signals.`);
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
            aluControlCode = '0010';
            break;
        case '01':
            aluControlCode = '0111';
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
                case '11010110000': // BR
                    aluControlCode = '1101';
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
        return binaryString[0].repeat(targetBitLength - originalBitLength) + binaryString;
    }
    
    const control = currentState.Control;
    const opcode = currentState.InstructionMemory.Opcode_31_21;
    const SignExtend = currentState.InstructionMemory.SignExtend;
    let inputBinary = null;
    let originalBits = 0;
    const targetBits = 64;
    

    // InstructionMemory.Imm12_21_10 = encodedInstruction.substring(10, 22); // For I-type ALU
    // InstructionMemory.Imm9_20_12 = encodedInstruction;  // For D-type offset
    // InstructionMemory.Imm19_23_5 = encodedInstruction;   // For CB-type offset
    // InstructionMemory.Imm26_25_0 = encodedInstruction.;   // For B-type 


    if (control.ALUSrc === 1) {
        // D-type (LDUR/STUR): Offset 9 bit (DT-address)
        if (opcode === '11111000010' || opcode === '11111000000') {
            console.warn('SignExtend: ', SignExtend)
            inputBinary = SignExtend.substring(11, 20);
            originalBits = 9;
        }
        // I-type (ADDI/SUBI): Immediate 12 bit
        else if (opcode?.startsWith('1001000100') || opcode?.startsWith('1101000100')) {
            inputBinary = SignExtend.substring(10, 22); // 12 bits
            originalBits = 12;
        }
        // Kiểu MOVZ (16 bit immediate)
        else if (opcode?.startsWith('110100101')) {
            inputBinary = SignExtend.Imm16_20_5; // 16 bits
            originalBits = 16;
        }
        // Các lệnh khác như ANDI, ORRI - cũng là I-type 12 bit
        else if (opcode?.startsWith('1001001000') || // ANDI
                 opcode?.startsWith('1011001000') || // ORRI
                 opcode?.startsWith('1101001000'))   // EORI
        {
            inputBinary = SignExtend.substring(10, 22); // 12 bits
            originalBits = 12;
        }
        else {
            // ALUSrc=1 nhưng không khớp loại lệnh nào ở trên? Cảnh báo
            console.warn(`Warning: ALUSrc is 1, but opcode ${opcode} doesn't match expected I/D/IW types needing immediate for ALU.`);
        }
    
    } else if (control.UncondBranch === 1) {
        // Lệnh B (Unconditional Branch)
        inputBinary = SignExtend.substring(6, 32);
        originalBits = 26;
    } else if (control.Branch === 1) {
        // Lệnh Branch (Branch Instruction)
        inputBinary = SignExtend.substring(8, 27);
        originalBits = 19;
    } else {
        // Khi không thuộc các trường hợp trên, chuyển đổi lệnh sang hex và thực hiện signExtend
        const inputHex = parseInt(SignExtend, 2).toString(16).toUpperCase();
        currentState.SignExtend.input = `0x${inputHex}`;
        const outputValue = signExtend(SignExtend, 32, targetBits);
        currentState.SignExtend.output = parseInt(outputValue, 2);
        return;
    }
    let outputValue = null;
    if (inputBinary !== null && originalBits > 0) {
        outputValue = signExtend(inputBinary, originalBits, targetBits);
        console.warn(`inputBinary: ${inputBinary} -> ${outputValue}`)
    }

    currentState.SignExtend.input = parseInt(inputBinary, 2);
    console.log(`inputBinary: ${inputBinary} -> ${currentState.SignExtend.input}`);
    currentState.SignExtend.output = parseInt(outputValue, 2);

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
    currentState.Register.Read1 = readIndex1;
    currentState.Register.Read2 = readIndex2;
    currentState.Register.WriteReg = writeIndex;
    currentState.Register.ReadData1 = readData1Output;
    currentState.Register.ReadData2 = readData2Output;
}


function updateDataMemory(currentState) {
    const address = currentState.ALU.output;
    const writeData = currentState.Register.ReadData2;

    if (currentState.DataMemory.WriteData !== writeData || 
		currentState.DataMemory.address!== address) {
		console.warn("have some problems in datamemory update value");
        console.warn(`${currentState.DataMemory.WriteData} -> ${writeData}`);
	}
    if (currentState.DataMemory.writeEnable === 1) {
        currentState.DataMemory.Values[address] = writeData;
        currentState.DataMemory.ReadData = writeData;
    }
    if (currentState.DataMemory.readEnable === 1) {
        currentState.DataMemory.ReadData = currentState.DataMemory.Values[address];
    }
}
