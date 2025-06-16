import { R_TYPE_OPCODES, D_TYPE_OPCODES } from "../Compile/Define/Opcode.js";
import { B_TYPE_OPCODES, CB_TYPE_OPCODES }  from "../Compile/Define/Opcode.js"
import { B_COND_OPCODE_PREFIX }  from "../Compile/Define/Opcode.js"
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
                R_TYPE_OPCODES['SUBS']
            ];

            if (flagSettingInstructions.includes(opcode10bit) || flagSettingInstructions.includes(components.InstructionMemory.Opcode_31_21)) {
                
                console.log(aluResultObject);
                components.ALU.Flags.N = aluResultObject.N;
                components.ALU.Flags.Z = aluResultObject.Z;
                components.ALU.Flags.V = aluResultObject.V;
                components.ALU.Flags.C = aluResultObject.C;
            }
            const tmp = components.InstructionMemory.Opcode_31_21.substring(0, 8);
            if (tmp === CB_TYPE_OPCODES['CBNZ']) { // Giả sử bạn có hằng số này
                components[componentName].zero = (aluResultObject.result == 0 ? 0 : 1);
            } else {
                components[componentName].zero = (aluResultObject.result == 0 ? 1 : 0);
            }
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

function doALUOperation(currentState) {
    const aluControlCode = currentState['ALU'].option;
    // Ensure inputs are Numbers, default to 0 if null/undefined
    const operand1 = Number(currentState['ALU'].input1 || 0);
    const operand2 = Number(currentState['ALU'].input2 || 0);

    let result = 0;
    let nFlag = 0, zFlag = 0, vFlag = 0, cFlag = 0;

    // --- Helper function for 32-bit signed overflow check ---
    const checkSignedOverflow = (a, b, res) => {
        if ((a > 0 && b > 0 && res < 0) || (a < 0 && b < 0 && res > 0)) {
            return 1;
        }
        return 0;
    };

    switch (aluControlCode) {
        case '0010': { // ADD
            result = operand1 + operand2;
            
            const op1_32 = operand1 | 0;
            const op2_32 = operand2 | 0;
            const res_32 = result | 0;

            nFlag = (res_32 < 0) ? 1 : 0;
            zFlag = (res_32 === 0) ? 1 : 0;
            vFlag = checkSignedOverflow(op1_32, op2_32, res_32);
            if (operand1 > 0 && operand2 > 0 && result < operand1) {
                 cFlag = 1;
            } else {
                 const MAX_UINT32 = 0xFFFFFFFF;
                 if (operand1 > MAX_UINT32 - operand2) {
                     cFlag = 1;
                 }
            }
            break;
        }

        case '0110': { // SUB
            result = operand1 - operand2;
            const op1_32 = operand1 | 0;
            const op2_32 = operand2 | 0;
            const res_32 = result | 0;
            nFlag = (res_32 < 0) ? 1 : 0;
            zFlag = (res_32 === 0) ? 1 : 0;
            if ((op1_32 > 0 && op2_32 < 0 && res_32 < 0) || (op1_32 < 0 && op2_32 > 0 && res_32 > 0)) {
                vFlag = 1;
            }
            // C (as Not-Borrow): Set if op1 >= op2 (unsigned)
            cFlag = (operand1 >= operand2) ? 1 : 0;
            break;
        }

        case '0000': // AND
        case '0001': // ORR
        case '1000': { // EOR (XOR)
            if (aluControlCode === '0000') result = operand1 & operand2;
            if (aluControlCode === '0001') result = operand1 | operand2;
            if (aluControlCode === '1000') result = operand1 ^ operand2;
            
            nFlag = (result < 0) ? 1 : 0;
            zFlag = (result === 0) ? 1 : 0;
            vFlag = 0;
            cFlag = 0;
            break;
        }

        case '1001': { // LSR (Logical Shift Right)
            const shamt = parseInt(currentState.InstructionMemory?.Shamt_15_10 || 0, 2);
            result = operand1 >>> shamt;
            break;
        }
        case '1010': { // LSL (Logical Shift Left)
            const shamt = parseInt(currentState.InstructionMemory?.Shamt_15_10 || 0, 2);
            result = operand1 << shamt;
            break;
        }
        
        case '1100': // Pass B
        case '0111': // Pass B (for branch)
            result = operand2;
            break;
        case '1101': // Pass A
            result = operand1;
            break;
        case '1111':
        default:
            console.warn(`ALU Warning: Received unknown ALU control code '${aluControlCode}'.`);
            result = 0; // Return a safe value
            zFlag = 1; // Indicate a zero result from an error
            break;
    }
    return {
        result: result,
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
            aluControlCode = '0010'; // ALU performs ADD
            break;

        case '01': // B-Type & CB-Type -> Branching
            aluControlCode = '0111'; // ALU performs SUB to check flags (for B.cond and CBZ/CBNZ)
            break;

        case '10': // Handles ALL R-Type and I-Type instructions
            // The ALU Control must now look at the opcode to determine the specific operation.
            
            // R-Type Instructions (check full 11-bit opcode)
            if (fullOpcode === R_TYPE_OPCODES['ADD'])     { aluControlCode = '0010'; break; } // ADD
            if (fullOpcode === R_TYPE_OPCODES['SUB'])     { aluControlCode = '0110'; break; } // SUB
            if (fullOpcode === R_TYPE_OPCODES['AND'])     { aluControlCode = '0000'; break; } // AND
            if (fullOpcode === R_TYPE_OPCODES['ORR'])     { aluControlCode = '0001'; break; } // ORR
            if (fullOpcode === R_TYPE_OPCODES['EOR'])     { aluControlCode = '1000'; break; } // EOR
            if (fullOpcode === R_TYPE_OPCODES['LSL'])     { aluControlCode = '1010'; break; } // LSL
            if (fullOpcode === R_TYPE_OPCODES['LSR'])     { aluControlCode = '1001'; break; } // LSR
            if (fullOpcode === R_TYPE_OPCODES['BR'])      { aluControlCode = '1101'; break; } // BR (Pass A)

            // I-Type Instructions (check 10-bit opcode prefix)
            if (opcode10bit === I_TYPE_OPCODES['ADDI'])   { aluControlCode = '0010'; break; } // ADD
            if (opcode10bit === I_TYPE_OPCODES['SUBI'])   { aluControlCode = '0110'; break; } // SUB
            if (opcode10bit === I_TYPE_OPCODES['ADDIS'])  { aluControlCode = '0010'; break; } // ADD
            if (opcode10bit === I_TYPE_OPCODES['SUBIS'])  { aluControlCode = '0110'; break; } // SUB
            if (opcode10bit === I_TYPE_OPCODES['ANDI'])   { aluControlCode = '0000'; break; } // AND
            if (opcode10bit === I_TYPE_OPCODES['ORRI'])   { aluControlCode = '0001'; break; } // ORR
            if (opcode10bit === I_TYPE_OPCODES['EORI'])   { aluControlCode = '1000'; break; } // EOR
            if (opcode10bit === I_TYPE_OPCODES['ANDIS'])  { aluControlCode = '0000'; break; } // AND

            // If we reach here, no specific R-type or I-type opcode was matched.
            console.warn(`ALU Control: Unknown R/I-type opcode ${fullOpcode} for ALUOp='10'`);
            break;

        // NOTE: Case '11' is now removed as per your instruction.
        // It could be used for other instruction types in the future if needed.

        case 'XX': // Error case from the main Control Unit
        default:
            aluControlCode = '1111'; // ERROR code
            console.error(`ALU Control: Received invalid ALUOp signal '${aluOpSignal}' from main Control.`);
            break;
    }

    currentState.ALUControl.output = aluControlCode;
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
    
    if (control.ALUSrc === 1) {
        const opcode10bit = opcode.substring(0, 10);
        // D-type (LDUR/STUR): Offset 9 bit (DT-address)
        if (opcode === D_TYPE_OPCODES['LDUR'] || opcode === D_TYPE_OPCODES['STUR']) {
            inputBinary = SignExtend.substring(11, 20); // Bits 20-12
            originalBits = 9;
        }
        // I-type (Arithmetic & Logical): Immediate 12 bit
        else if (Object.values(I_TYPE_OPCODES).includes(opcode10bit)) {
            // This single block now handles all 12-bit I-type instructions:
            // ADDI, SUBI, ANDI, ORRI, EORI, ADDIS, SUBIS, ANDIS
            inputBinary = SignExtend.substring(10, 22); // Bits 21-10
            originalBits = 12;
        }
        // IW-type (MOVZ/MOVK): Immediate 16 bit
        else if (Object.values(IW_TYPE_OPCODES).includes(opcode11bit.substring(0, 9))) { // MOVZ/MOVK have 9-bit opcodes
            inputBinary = SignExtend.substring(5, 21); // Bits 20-5
            originalBits = 16;
        }
        else {
            // ALUSrc=1 but doesn't match any expected types? This is a potential issue in the Control Unit.
            console.warn(`SignExtend Warning: ALUSrc is 1, but opcode ${opcode} doesn't match expected I/D/IW types.`);
            inputBinary = '0'.repeat(32); 
            originalBits = 32;
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
    }

    currentState.SignExtend.input = parseInt(inputBinary, 2);
    currentState.SignExtend.output = parseInt(outputValue, 2);
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
