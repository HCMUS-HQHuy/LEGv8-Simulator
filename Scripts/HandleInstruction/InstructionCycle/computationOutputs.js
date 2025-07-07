import { R_TYPE_OPCODES, D_TYPE_OPCODES } from "../Compile/Define/Opcode.js";
import { B_TYPE_OPCODES, CB_TYPE_OPCODES }  from "../Compile/Define/Opcode.js"
import { B_COND_OPCODE_PREFIX, B_COND_CODES }  from "../Compile/Define/Opcode.js"
import { I_TYPE_OPCODES, ALU_CONTROL_CODE }  from "../Compile/Define/Opcode.js"

export function computeOutputs(componentName, components) {
	switch (componentName) {
		case 'InstructionMemory':
			const InstructionMemory = components[componentName];
			const encodedInstruction = InstructionMemory.instruction[(InstructionMemory.ReadAddress - components.PC.offset) >> 2n];
            if (encodedInstruction == null) console.error("encodedInstruction is null in computation Ouputs");
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
            const input1 = BigInt(components[componentName].input1);
            const input2 = BigInt(components[componentName].input2);
            components[componentName].output = input1 + input2;
			break;

		case 'ShiftLeft2':
			components[componentName].output = components[componentName].input << 2n;
			break;

        case 'ALU':
            // Lấy đối tượng kết quả từ hàm ALU
            const aluResultObject = doALUOperation(components);
            
            // Cập nhật output của ALU
            components[componentName].output = aluResultObject.result;

            // Lấy opcode để kiểm tra xem có phải lệnh set cờ không
            const opcode10bit = components.InstructionMemory.Opcode_31_21.substring(0, 10);
            const flagSettingInstructions = [
                I_TYPE_OPCODES['ADDIS'],
                I_TYPE_OPCODES['SUBIS'],
                I_TYPE_OPCODES['ANDIS'],
                R_TYPE_OPCODES['SUBS'],
                R_TYPE_OPCODES['ADDS'],
                R_TYPE_OPCODES['ANDS']
            ];

            if (flagSettingInstructions.includes(opcode10bit) || flagSettingInstructions.includes(components.InstructionMemory.Opcode_31_21)) {
                components.ALU.Flags.N = aluResultObject.N;
                components.ALU.Flags.Z = aluResultObject.Z;
                components.ALU.Flags.V = aluResultObject.V;
                components.ALU.Flags.C = aluResultObject.C;
            }
            components.ALU.zero = checkBranchCondition(components);
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

function checkBranchCondition(components) {
    const aluFlags = components.ALU.Flags;
    const index = ((components.InstructionMemory.ReadAddress - components.PC.offset) >> 2n);
    const type = components.InstructionMemory.instructionType[index];

    if (type === 'CB') {
        const tmp = components.InstructionMemory.Opcode_31_21.substring(0, 8);
        if (tmp === CB_TYPE_OPCODES['CBZ']) {
            return aluFlags.Z; // Branch if Z=1
        }
        if (tmp === CB_TYPE_OPCODES['CBNZ']) {
            return aluFlags.Z === 0 ? 1 : 0; // Branch if Z=0
        }
    } else if (type === 'B_COND') {
        const encodedInstruction = components.InstructionMemory.instruction[index];
        const condition = encodedInstruction.substring(28, 32);
        switch (condition) {
            case B_COND_CODES['EQ']: return aluFlags.Z === 1 ? 1 : 0; // Z=1
            case B_COND_CODES['NE']: return aluFlags.Z === 0 ? 1 : 0; // Z=0
            case B_COND_CODES['LT']: return aluFlags.N !== aluFlags.V ? 1 : 0; // N!=V
            case B_COND_CODES['LE']: return (aluFlags.Z === 1 || aluFlags.N !== aluFlags.V) ? 1 : 0; // Z=1 or N!=V
            case B_COND_CODES['GT']: return (aluFlags.Z === 0 && aluFlags.N === aluFlags.V) ? 1 : 0; // Z=0 and N=V
            case B_COND_CODES['GE']: return aluFlags.N === aluFlags.V ? 1 : 0; // N=V

            case B_COND_CODES['LO']: return aluFlags.C === 0 ? 1 : 0; // C=0 (Lower)
            case B_COND_CODES['LS']: return (aluFlags.C === 0 || aluFlags.Z === 1) ? 1 : 0; // C=0 or Z=1 (Lower or Same)
            case B_COND_CODES['HI']: return (aluFlags.C === 1 && aluFlags.Z === 0) ? 1 : 0; // C=1 and Z=0 (Higher)
            case B_COND_CODES['HS']: return aluFlags.C === 1 ? 1 : 0; // C=1 (Higher or Same)

            default:
                console.warn(`Unsupported B.cond condition: ${condition}`);
                return 0;
        }
    }
    return 0;
}

function doALUOperation(currentState) {
    const aluControlCode = currentState['ALU'].option;
    const operand1 = BigInt(currentState['ALU'].input1 || 0);
    const operand2 = BigInt(currentState['ALU'].input2 || 0);

    let resultBigInt = 0n;
    let nFlag = 0, zFlag = 0, vFlag = 0, cFlag = 0;

    const MASK_64BIT = (1n << 64n) - 1n;
    const MSB_64BIT = 1n << 63n;

    const isSignedOverflow = (a, b, result) => {
        const signA = (a & MSB_64BIT) !== 0n;
        const signB = (b & MSB_64BIT) !== 0n;
        const signR = (result & MSB_64BIT) !== 0n;
        return (signA === signB) && (signR !== signA);
    };

    const isUnsignedCarry = (a, b) => {
        return (a + b) > MASK_64BIT;
    };

    const isUnsignedBorrow = (a, b) => {
        return a >= b;
    };
    switch (aluControlCode) {
        case ALU_CONTROL_CODE['ADD']: {
            resultBigInt = operand1 + operand2;

            vFlag = isSignedOverflow(operand1, operand2, resultBigInt) ? 1 : 0;
            cFlag = isUnsignedCarry(operand1 & MASK_64BIT, operand2 & MASK_64BIT) ? 1 : 0;
            break;
        }

        case ALU_CONTROL_CODE['SUB']: {
            resultBigInt = operand1 - operand2;
            vFlag = isSignedOverflow(operand1, ~operand2 + 1n, resultBigInt) ? 1 : 0;
            cFlag = isUnsignedBorrow(operand1 & MASK_64BIT, operand2 & MASK_64BIT) ? 1 : 0;
            break;
        }

        case ALU_CONTROL_CODE['AND']:
            resultBigInt = operand1 & operand2;
            break;
        case ALU_CONTROL_CODE['ORR']:
            resultBigInt = operand1 | operand2;
            break;
        case ALU_CONTROL_CODE['EOR']: // (XOR)
            resultBigInt = operand1 ^ operand2;
            break;

        case ALU_CONTROL_CODE['LSR']: { // LSR (Logical Shift Right)
            const shamt = BigInt(parseInt(currentState.InstructionMemory?.Shamt_15_10 || 0, 2));
            resultBigInt = (operand1 & MASK_64BIT) >> shamt;
            break;
        }

        case ALU_CONTROL_CODE['LSL']: { // LSL (Logical Shift Left)
            const shamt = BigInt(parseInt(currentState.InstructionMemory?.Shamt_15_10 || 0, 2));
            resultBigInt = (operand1 << shamt) & MASK_64BIT;
            break;
        }

        case ALU_CONTROL_CODE['PassB']: // Pass B
            resultBigInt = operand2;
            break;

        case ALU_CONTROL_CODE['PassA']: // Pass A
            resultBigInt = operand1;
            break;
            
        default:
            console.warn(`ALU Warning: Unknown ALU control code '${aluControlCode}'`);
            resultBigInt = 0n;
            break;
    }

    // Chuẩn hóa kết quả 64-bit
    const resultIn64Bit = resultBigInt & MASK_64BIT;

    // Flag N (bit dấu), Z (kết quả bằng 0)
    nFlag = (resultIn64Bit & MSB_64BIT) ? 1 : 0;
    zFlag = resultIn64Bit === 0n ? 1 : 0;

    // Xử lý kết quả: nếu bit dấu = 1 thì interpret là số âm (bù hai)
    let finalResultNumber = nFlag
        ? (resultIn64Bit - (1n << 64n))  // Chuyển về signed
        : resultIn64Bit;               // Không đổi nếu dương

    return {
        result: finalResultNumber,
        N: nFlag,
        Z: zFlag,
        V: vFlag,
        C: cFlag
    };
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

    currentState.Control.Reg2Loc = 0;
    currentState.Control.ALUSrc = 0;
    currentState.Control.MemtoReg = 0;
    currentState.Control.RegWrite = 0;
    currentState.Control.MemRead = 0;
    currentState.Control.MemWrite = 0;
    currentState.Control.Branch = 0;
    currentState.Control.UncondBranch = 0;
    currentState.Control.ALUOp = 'XX';

    // 2. Xác định tín hiệu dựa trên loại lệnh và opcode

    if (Object.values(R_TYPE_OPCODES).includes(opcode11bit)) {
        // --- R-Type ---
        currentState.Control.RegWrite = 1;
        currentState.Control.ALUSrc = 0;        // Dùng [Rm]
        currentState.Control.MemtoReg = 0;      // Kết quả từ ALU
        currentState.Control.ALUOp = '10';      // ALU Control sẽ dựa vào funct bits

    } else if (Object.values(D_TYPE_OPCODES).includes(opcode11bit)) {
        // --- D-Type ---
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
        currentState.Control.RegWrite = 1;
        currentState.Control.ALUSrc = 1;
        currentState.Control.MemtoReg = 0;
        currentState.Control.ALUOp = '10'; 
    } else if (Object.values(B_TYPE_OPCODES).includes(opcode6bit)) {
        if (opcode6bit === '100101')
            currentState.Control.RegWrite = 1;
        currentState.Control.UncondBranch = 1;
        currentState.Control.ALUOp = '01';
    } else if (opcode8bit === B_COND_OPCODE_PREFIX) {
        // --- B.cond Type (Conditional Branch) ---
        currentState.Control.Branch = 1;
        currentState.Control.ALUOp = '01';
    } else if (Object.values(CB_TYPE_OPCODES).includes(opcode8bit)) {
        currentState.Control.Reg2Loc = 1;
        currentState.Control.ALUSrc = 0;
        currentState.Control.Branch = 1;
        currentState.Control.ALUOp = '01';

    }
    else {
        console.warn(`ControlUnit: Opcode ${opcode11bit} not recognized or supported. Using default signals.`);
    }
}

function updateALUControl(currentState) {
    const aluOpSignal = currentState.Control.ALUOp; // Tín hiệu 2-bit từ Control chính
    const fullOpcode = currentState.InstructionMemory.Opcode_31_21; // Opcode 11-bit
    const opcode10bit = fullOpcode.substring(0, 10); // Opcode 10-bit cho I-type

    let aluControlCode = '1111'; // Default to ERROR/UNKNOWN

    switch (aluOpSignal) {
        case '00': // D-Type (LDUR/STUR) -> Address calculation
            aluControlCode = ALU_CONTROL_CODE['ADD'];
            break;

        case '01': // B-Type & CB-Type -> Branching
            aluControlCode = ALU_CONTROL_CODE['PassB'];
            break;

        case '10': // Handles ALL R-Type and I-Type instructions
            
            // R-Type Instructions (check full 11-bit opcode)
            if (fullOpcode === R_TYPE_OPCODES['ADD'])     { aluControlCode = ALU_CONTROL_CODE['ADD']; break; } 
            if (fullOpcode === R_TYPE_OPCODES['SUB'])     { aluControlCode = ALU_CONTROL_CODE['SUB']; break; } 
            if (fullOpcode === R_TYPE_OPCODES['AND'])     { aluControlCode = ALU_CONTROL_CODE['AND']; break; } 
            
            if (fullOpcode === R_TYPE_OPCODES['ADDS'])     { aluControlCode = ALU_CONTROL_CODE['ADD']; break; } 
            if (fullOpcode === R_TYPE_OPCODES['SUBS'])     { aluControlCode = ALU_CONTROL_CODE['SUB']; break; } 
            if (fullOpcode === R_TYPE_OPCODES['ANDS'])     { aluControlCode = ALU_CONTROL_CODE['AND']; break; }

            if (fullOpcode === R_TYPE_OPCODES['ORR'])     { aluControlCode = ALU_CONTROL_CODE['ORR']; break; } 
            if (fullOpcode === R_TYPE_OPCODES['EOR'])     { aluControlCode = ALU_CONTROL_CODE['EOR']; break; } 
            if (fullOpcode === R_TYPE_OPCODES['LSL'])     { aluControlCode = ALU_CONTROL_CODE['LSL']; break; } 
            if (fullOpcode === R_TYPE_OPCODES['LSR'])     { aluControlCode = ALU_CONTROL_CODE['LSR']; break; }

            // I-Type Instructions (check 10-bit opcode prefix)
            if (opcode10bit === I_TYPE_OPCODES['ADDI'])   { aluControlCode = ALU_CONTROL_CODE['ADD']; break; }
            if (opcode10bit === I_TYPE_OPCODES['SUBI'])   { aluControlCode = ALU_CONTROL_CODE['SUB']; break; }
            if (opcode10bit === I_TYPE_OPCODES['ADDIS'])  { aluControlCode = ALU_CONTROL_CODE['ADD']; break; }
            if (opcode10bit === I_TYPE_OPCODES['SUBIS'])  { aluControlCode = ALU_CONTROL_CODE['SUB']; break; }
            if (opcode10bit === I_TYPE_OPCODES['ANDI'])   { aluControlCode = ALU_CONTROL_CODE['AND']; break; }
            if (opcode10bit === I_TYPE_OPCODES['ORRI'])   { aluControlCode = ALU_CONTROL_CODE['ORR']; break; }
            if (opcode10bit === I_TYPE_OPCODES['EORI'])   { aluControlCode = ALU_CONTROL_CODE['EOR']; break; }
            if (opcode10bit === I_TYPE_OPCODES['ANDIS'])  { aluControlCode = ALU_CONTROL_CODE['AND']; break; }

            // If we reach here, no specific R-type or I-type opcode was matched.
            console.warn(`ALU Control: Unknown R/I-type opcode ${fullOpcode} for ALUOp='10'`);
            break;
        case 'XX': // Error case from the main Control Unit
        default:
            aluControlCode = '1111'; // ERROR code
            console.error(`ALU Control: Received invalid ALUOp signal '${aluOpSignal}' from main Control.`);
            break;
    }

    currentState.ALUControl.output = aluControlCode;
}

function updateSignExtend(currentState) {
    // Helper to perform sign extension and return a 64-bit signed integer
    const signExtend = (binaryString, originalBitLength, targetBitLength = 64) => {
        // Determine if the value is negative (MSB is '1')
        const isNegative = binaryString[0] === '1';

        // Extend the sign bit
        const extended = binaryString[0].repeat(targetBitLength - originalBitLength) + binaryString;

        // If negative, interpret as two's complement
        if (isNegative) {
            // Convert to signed integer
            const bigIntValue = BigInt('0b' + extended);
            const signedValue = bigIntValue - (BigInt(1) << BigInt(targetBitLength));
            return signedValue;
        } else {
            return BigInt('0b' + extended);
        }
    };

    const control = currentState.Control;
    const opcode = currentState.InstructionMemory.Opcode_31_21;
    const SignExtend = currentState.InstructionMemory.SignExtend;
    let inputBinary = null;
    let originalBits = 0;
    const targetBits = 64;

    if (control.ALUSrc === 1) {
        const opcode10bit = opcode.substring(0, 10);
        if (opcode === D_TYPE_OPCODES['LDUR'] || opcode === D_TYPE_OPCODES['STUR']) {
            inputBinary = SignExtend.substring(11, 20); // Bits 20-12
            originalBits = 9;
        } else if (Object.values(I_TYPE_OPCODES).includes(opcode10bit)) {
            inputBinary = SignExtend.substring(10, 22); // Bits 21-10
            originalBits = 12;
        } else {
            console.warn(`SignExtend Warning: ALUSrc is 1, but opcode ${opcode} doesn't match expected I/D/IW types.`);
            inputBinary = '0'.repeat(32); 
            originalBits = 32;
        }

    } else if (control.UncondBranch === 1) {
        // B-type instruction (unconditional branch)
        inputBinary = SignExtend.substring(6, 32); // Bits 31-6
        originalBits = 26;
    } else if (control.Branch === 1) {
        // Conditional branch (e.g., CBZ/CBNZ)
        inputBinary = SignExtend.substring(8, 27); // Bits 23-5
        originalBits = 19;
    } else {
        const inputHex = parseInt(SignExtend, 2).toString(16).toUpperCase();
        currentState.SignExtend.input = `0x${inputHex}`;
        const outputValue = signExtend(SignExtend, 32, targetBits);
        currentState.SignExtend.output = outputValue;
        return;
    }

    if (inputBinary !== null && originalBits > 0) {
        const extendedValue = signExtend(inputBinary, originalBits, targetBits);
        currentState.SignExtend.input = parseInt(inputBinary, 2);
        currentState.SignExtend.output = extendedValue;
    }
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
