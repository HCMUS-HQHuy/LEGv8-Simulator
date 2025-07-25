import { R_TYPE_OPCODES, D_TYPE_OPCODES }  from "./Define/Opcode.js"
import { B_TYPE_OPCODES, CB_TYPE_OPCODES }  from "./Define/Opcode.js"
import { I_TYPE_OPCODES }  from "./Define/Opcode.js"
import { B_COND_OPCODE_PREFIX, B_COND_CODES }  from "./Define/Opcode.js"

// Create a labelTable for Branch instructions.
// The index is based on the code after formatting.
export function buildLabelTable(codeLines, startAddress = 0, instructionSize = 4) {
    const labelTable = {};
    let instructionIndex = 0; // Chỉ đếm các dòng có chứa lệnh thực sự

    for (const line of codeLines) {
        const cleanedLine = line.replace(/(\/\/|;).*/, '').trim();
        
        if (!cleanedLine) {
            continue;
        }

        const labelMatch = cleanedLine.match(/^([a-zA-Z_][a-zA-Z0-9_]*):(.*)$/);

        if (labelMatch) {
            const labelName = labelMatch[1];
            const instructionPart = labelMatch[2].trim();
            if (labelTable.hasOwnProperty(labelName)) {
                console.warn(`Warning: Label "${labelName}" is redefined.`);
            }
            labelTable[labelName] = startAddress + (instructionIndex * instructionSize);
            if (!instructionPart) {
                continue;
            }
        }
        instructionIndex++;
    }
    return labelTable;
}

export function parseLegv8Instruction(cleanedLine, labelTable = {}) {
    if (!cleanedLine) {
        return null;
    }

    const parts = cleanedLine.split(/\s+/);
    let mnemonic = parts[0].toUpperCase();
    const operandString = parts.slice(1).join(' ');
  
    if (mnemonic.includes(':')) {
        console.error("parseLegv8Instruction: cleanedLine includes LABEL");
        return;
    }
  
    const result = {
        instruction: `${mnemonic}\t${operandString}`,
        mnemonic: mnemonic,
        operands: [],
        type: 'UNKNOWN',
        structuredOperands: null,
        error: null,
        targetAddress: null // Thêm trường này để lưu địa chỉ đích nếu là branch/jump
    };
  
    try {
        const rawOperands = operandString.match(/[^,\s\[\]]+|\[[^\]]*\]/g) || [];
        result.operands = rawOperands.map(op => op.trim()).filter(op => op !== '');
  
        const opCount = result.operands.length;
        const ops = result.operands;

        const bCondMatch = mnemonic.match(/^B\.([A-Z]{2})$/i);
        const registerRegex = /^X([0-9]|1[0-9]|2[0-9]|30|ZR)$/i;

        if (Object.keys(B_TYPE_OPCODES).includes(mnemonic)) {
            if (opCount === 1) {
                result.type = 'B';
                const labelName = ops[0];
                result.structuredOperands = { label: labelName };
                if (labelTable && labelTable.hasOwnProperty(labelName)) {
                    result.targetAddress = labelTable[labelName];
                } else if (labelTable) { // Chỉ báo lỗi nếu labelTable được cung cấp nhưng không tìm thấy
                    // Nếu không có labelTable, có thể đang parse ở bước 1
                    throw new Error(`Label "${labelName}" not found for B instruction.`);
                }
            } else {
                throw new Error(`Invalid operands for B-type instruction ${mnemonic}`);
            }
        } else if (bCondMatch) {
            if (opCount === 1) {
                result.type = 'B_COND'; // Một loại mới để dễ dàng nhận biết
                
                const condition = bCondMatch[1].toUpperCase(); // Trích xuất điều kiện (EQ, NE, etc.)
                const labelName = ops[0];

                if (B_COND_CODES.hasOwnProperty(condition)) {
                    result.structuredOperands = {
                        condition: condition,
                        label: labelName
                    };
                    if (labelTable && labelTable.hasOwnProperty(labelName)) {
                        result.targetAddress = labelTable[labelName];
                    } else if (labelTable) {
                        throw new Error(`Label "${labelName}" not found for ${mnemonic} instruction.`);
                    }
                } else {
                    throw new Error(`Invalid condition "${condition}" for B.cond instruction.`);
                }
            } else {
                throw new Error(`Invalid operands for B.cond instruction ${mnemonic}. Expected a single label.`);
            }
        } else if (Object.keys(CB_TYPE_OPCODES).includes(mnemonic)) {
            if (opCount === 2 && ops[0].match(registerRegex)) {
                result.type = 'CB';
                const labelName = ops[1];
                result.structuredOperands = { Rt: ops[0], label: labelName };
                 if (labelTable && labelTable.hasOwnProperty(labelName)) {
                    result.targetAddress = labelTable[labelName];
                } else if (labelTable) {
                    throw new Error(`Label "${labelName}" not found for ${mnemonic} instruction.`);
                }
            } else {
                throw new Error(`Invalid operands for CB-type instruction ${mnemonic}`);
            }
        }
        else if (Object.keys(R_TYPE_OPCODES).includes(mnemonic)) {
             if (opCount === 3 && ops[0].match(registerRegex) && ops[1].match(registerRegex) && ops[2].match(registerRegex)) {
                result.type = 'R';
                result.structuredOperands = { Rd: ops[0], Rn: ops[1], Rm: ops[2] };
            } else {
                 throw new Error(`Invalid operands for R-type instruction ${mnemonic}`);
            }
        } else if (Object.keys(I_TYPE_OPCODES).includes(mnemonic)) { // ARITHMETIC I-types
             if (opCount === 3 && ops[0].match(registerRegex) && ops[1].match(registerRegex) && ops[2].match(/^#-?\d+$/)) {
                result.type = 'I';
                result.structuredOperands = { Rd: ops[0], Rn: ops[1], immediate: ops[2] };
            } else {
                throw new Error(`Invalid operands for Arithmetic I-type instruction ${mnemonic}. Expected Rd, Rn, #decimal_immediate`);
            }
        } else if (Object.keys(D_TYPE_OPCODES).includes(mnemonic)) {
            if (opCount === 2 && ops[0].match(registerRegex) && ops[1].match(/^\[X([0-9]|1[0-9]|2[0-9]|30|ZR)\s*(,\s*#-?\d+)?\s*\]$/i)) {
                result.type = 'D';
                const memMatch = ops[1].match(/^\[ *(X(?:[0-9]|1[0-9]|2[0-9]|30|ZR)) *(?:, *#(-?\d+))? *\]$/i);
                if (memMatch) {
                    result.structuredOperands = {
                        Rt: ops[0],
                        Rn: memMatch[1].toUpperCase(),
                        address_imm: `#${memMatch[2] ?? '0'}`
                    };
                } else {
                    throw new Error(`Could not parse memory operand for ${mnemonic}: ${ops[1]}`);
                }
            } else {
                throw new Error(`Invalid operands for D-type instruction ${mnemonic}`);
            }
        }
    } catch (e) {
        result.error = e.message;
        result.type = null;
        result.structuredOperands = null;
    }
  
    // Nếu không có lỗi và không phải là định nghĩa nhãn, thì nó là một lệnh hợp lệ.
    // Nếu type vẫn UNKNOWN và không có lỗi, có thể là mnemonic không được hỗ trợ.
    if (result.type === 'UNKNOWN' && !result.error) {
        result.error = `Unsupported mnemonic: ${mnemonic}`;
    }
  
    // Chỉ trả về kết quả nếu nó là một lệnh thực sự hoặc một định nghĩa nhãn (nếu bạn muốn xử lý)
    if (result.error || (result.mnemonic && result.type !== 'UNKNOWN' && result.type !== 'LABEL_DEF') || result.type === 'LABEL_DEF') {
        return result;
    }
    return null;
}

function parseRegisterNumber(regString) {
    if (!regString) throw new Error(`Register string is null or undefined.`);
    const upperReg = regString.toUpperCase().trim();

    if (upperReg === 'XZR') return 31;
    if (upperReg === 'SP') return 28; // Convention: SP is X28

    // Handle #<number> format
    const hashMatch = upperReg.match(/^#(\d+)$/);
    if (hashMatch) {
        const num = parseInt(hashMatch[1], 10);
        if (num >= 0 && num <= 31) return num;
        throw new Error(`Register number out of valid range: ${num}`);
    }

    // Handle X<number> format
    const match = upperReg.match(/^X(\d+)$/);
    if (match) {
        const num = parseInt(match[1], 10);
        if (num >= 0 && num <= 30) return num; // X0-X30
    }

    throw new Error(`Invalid register name: ${regString}`);
}

function toBinary(number, bits) {
    if (typeof number !== 'number' || !Number.isInteger(number)) {
        throw new Error(`Invalid input: "${number}" is not an integer.`);
    }
    if (number < 0) {
       throw new Error(`Negative numbers (${number}) not directly supported for this field type.`);
    }
    if (number >= (1 << bits)) {
         throw new Error(`Number ${number} is too large for ${bits} bits.`);
    }

    let binaryString = number.toString(2);
    return binaryString.padStart(bits, '0');
}

function toBinarySign(number, bits) {
    if (typeof number !== 'number' || !Number.isInteger(number)) {
        throw new Error(`Invalid input: "${number}" is not an integer.`);
    }

    const min = -(1 << (bits - 1));
    const max = (1 << (bits - 1)) - 1;

    if (number < min || number > max) {
        throw new Error(`Number ${number} is out of range for ${bits} bits.`);
    }

    // Handle two's complement for negative numbers
    let binaryString;
    if (number >= 0) {
        binaryString = number.toString(2);
    } else {
        binaryString = (number >>> 0).toString(2).slice(-bits);
    }
    return binaryString.padStart(bits, '0');
}

export function encodeLegv8Instruction(parsedInstruction, currentInstructionAddress = 0, space="") {
    if (!parsedInstruction || parsedInstruction.error) {
        const errorMsg = parsedInstruction ? parsedInstruction.error : "Parsed instruction is null.";
        return { error: `Invalid or errored parsed instruction: ${errorMsg}` };
    }

    const { mnemonic, type, structuredOperands, targetAddress } = parsedInstruction;
    if (type === 'R') {
        const opcode = R_TYPE_OPCODES[mnemonic];
        if (!opcode) return { error: `Unsupported R-type mnemonic: ${mnemonic}` };
        const rdNum = parseRegisterNumber(structuredOperands.Rd);
        const rnNum = parseRegisterNumber(structuredOperands.Rn);
        const rmNum = parseRegisterNumber(structuredOperands.Rm);
        const shamt = 0;
        const rdBin = toBinary(rdNum, 5);
        const rnBin = toBinary(rnNum, 5);
        const rmBin = toBinary(rmNum, 5);
        const shamtBin = toBinary(shamt, 6);
        const machineCode = `${opcode}${space}${rmBin}${space}${shamtBin}${space}${rnBin}${space}${rdBin}`;
        return machineCode;
    }

    if (type === 'R_Shift') {
            // Xử lý R-type với shift immediate (LSL, LSR, ASR)
        const opcode = R_TYPE_OPCODES[mnemonic]; // Cần opcode cụ thể cho LSL/LSR R-type
        if (!opcode) return { error: `Unsupported R-shift mnemonic: ${mnemonic}` };
        const rdNum = parseRegisterNumber(structuredOperands.Rd);
        const rnNum = parseRegisterNumber(structuredOperands.Rn);
        const rmNum = 0; // Hoặc giá trị khác tùy theo spec
        const shamtMatch = structuredOperands.shift_imm.match(/^#(\d+)$/);
        if (!shamtMatch) return { error: `Invalid shift amount format: ${structuredOperands.shift_imm}`};
        const shamt = parseInt(shamtMatch[1], 10);
        if (shamt < 0 || shamt > 63) return { error: `Shift amount ${shamt} out of range (0-63)`};
        const rdBin = toBinary(rdNum, 5);
        const rnBin = toBinary(rnNum, 5);
        const rmBin = toBinary(rmNum, 5);
        const shamtBin = toBinary(shamt, 6);
        const machineCode = `${opcode}${space}${rmBin}${space}${shamtBin}${space}${rnBin}${space}${rdBin}`;
        return machineCode;
    }
    
    if (type === 'I') {
        // Format: Opcode(10), Immediate(12), Rn(5), Rd(5)
        const opcodeDetails = I_TYPE_OPCODES[mnemonic]; // Ví dụ: I_TYPE_OPCODES = { 'ADDI': '1001000100', ... }
        if (!opcodeDetails) return { error: `Unsupported I-type mnemonic: ${mnemonic}` };
        const rdNum = parseRegisterNumber(structuredOperands.Rd);
        const rnNum = parseRegisterNumber(structuredOperands.Rn);
        const immStr = structuredOperands.immediate.replace('#', '');
        const immediate = parseInt(immStr, 10);

        // Kiểm tra phạm vi immediate cho I-type (12-bit signed: -2048 to 2047)
        if (immediate < -2048 || immediate > 2047) {
            return { error: `I-type immediate ${immediate} out of 12-bit signed range for ${mnemonic}` };
        }

        const rdBin = toBinary(rdNum, 5);
        const rnBin = toBinary(rnNum, 5);
        const immediateBin = toBinary(immediate, 12); // 12-bit immediate

        const machineCode = `${opcodeDetails}${space}${immediateBin}${space}${rnBin}${space}${rdBin}`;
        return machineCode;
    } 
    
    if (type === 'D') {
        // Xử lý D-type
        const opcode = D_TYPE_OPCODES[mnemonic];
        if (!opcode) return { error: `Unsupported D-type mnemonic: ${mnemonic}` };
        const rtNum = parseRegisterNumber(structuredOperands.Rt);
        const rnNum = parseRegisterNumber(structuredOperands.Rn);
        let immediateStr = structuredOperands.address_imm.replace('#', '');
        const immediate = parseInt(immediateStr, 10);

        // Kiểm tra phạm vi immediate cho D-type (9-bit signed: -256 to 255)
        if (immediate < -256 || immediate > 255) {
            return { error: `D-type offset ${immediate} out of 9-bit signed range for ${mnemonic}` };
        }
        const op2 = "00"; // op2 field for LDUR/STUR

        const rtBin = toBinary(rtNum, 5);
        const rnBin = toBinary(rnNum, 5);
        const immediateBin = toBinary(immediate, 9); // 9-bit offset
        // Format: Opcode(11) DT_address(9) op2(2) Rn(5) Rt(5)
        const machineCode = `${opcode}${space}${immediateBin}${space}${op2}${space}${rnBin}${space}${rtBin}`;
        return machineCode;
        
    }
    
    if (type === 'B') {
        const opcode = B_TYPE_OPCODES[mnemonic];
        if (!opcode) {
            return { error: `Unsupported B-type mnemonic: ${mnemonic}` };
        }
        if (targetAddress === null || targetAddress === undefined) {
            return { error: `B-type instruction ${mnemonic} to label "${structuredOperands.label}" requires target address (label not found or not resolved).`};
        }

        const byteOffset = targetAddress - currentInstructionAddress;
        if (byteOffset % 4 !== 0) {
            return { error: `B-type target address ${targetAddress} for ${mnemonic} is not word aligned relative to ${currentInstructionAddress}.`};
        }
        const wordOffset = byteOffset / 4;

        const maxOffsetB = (1 << 25) - 1;
        const minOffsetB = -(1 << 25);
        if (wordOffset < minOffsetB || wordOffset > maxOffsetB) {
            return { error: `B-type offset ${wordOffset} (for label ${structuredOperands.label}) out of 26-bit signed range for ${mnemonic}.` };
        }

        const immediateBin = toBinarySign(wordOffset, 26); // 26-bit immediate (word offset)

        const machineCode = `${opcode}${space}${immediateBin}`;
        return machineCode;
    }
    
    if (type === 'CB') {
        const opcode = CB_TYPE_OPCODES[mnemonic];
        if (!opcode) {
            return { error: `Unsupported CB-type mnemonic: ${mnemonic}` };
        }
        if (targetAddress === null || targetAddress === undefined) {
            return { error: `CB-type instruction ${mnemonic} to label "${structuredOperands.label}" requires target address.`};
        }

        const rtNum = parseRegisterNumber(structuredOperands.Rt);
        const rtBin = toBinary(rtNum, 5);

        const byteOffset = targetAddress - currentInstructionAddress;
        if (byteOffset % 4 !== 0) {
            return { error: `CB-type target address ${targetAddress} for ${mnemonic} is not word aligned relative to ${currentInstructionAddress}.`};
        }
        const wordOffset = byteOffset / 4;

        const maxOffsetCB = (1 << 18) - 1;
        const minOffsetCB = -(1 << 18);
        if (wordOffset < minOffsetCB || wordOffset > maxOffsetCB) {
            return { error: `CB-type offset ${wordOffset} (for label ${structuredOperands.label}) out of 19-bit signed range for ${mnemonic}.` };
        }

        const immediateBin = toBinarySign(wordOffset, 19); // 19-bit immediate (word offset)

        const machineCode = `${opcode}${space}${immediateBin}${space}${rtBin}`;
        return machineCode;
    }
    
    if (type === 'B_COND') {

        const opcodeBase = B_COND_OPCODE_PREFIX;
        const condition = structuredOperands.condition;
        const conditionCode = B_COND_CODES[condition];

        if (!conditionCode) {
            return { error: `Invalid condition for B.cond: ${condition}` };
        }

        if (targetAddress === null || targetAddress === undefined) {
            return { error: `B.cond instruction to label "${structuredOperands.label}" requires target address.`};
        }

        const byteOffset = targetAddress - currentInstructionAddress;
        if (byteOffset % 4 !== 0) {
            return { error: `B.cond target address ${targetAddress} is not word aligned.`};
        }
        const wordOffset = byteOffset / 4;

        // Kiểm tra phạm vi cho offset 19-bit
        const maxOffsetBCond = (1 << 18) - 1; // 2^(19-1) - 1
        const minOffsetBCond = -(1 << 18);   // -2^(19-1)
        if (wordOffset < minOffsetBCond || wordOffset > maxOffsetBCond) {
            return { error: `B.cond offset ${wordOffset} out of 19-bit signed range.` };
        }

        const immediateBin = toBinarySign(wordOffset, 19); // 19-bit immediate (word offset)
        
        const condField = '0' + conditionCode; // Thêm bit 0 để đủ 5 bit
        const finalMachineCode = `${opcodeBase}${space}${immediateBin}${space}${condField}`;        
        return finalMachineCode;
    }
    return { error: `Unsupported instruction type for encoding: ${type}` };
}