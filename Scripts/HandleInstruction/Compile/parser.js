import { R_TYPE_OPCODES, D_TYPE_OPCODES }  from "./Define/Opcode.js"
import { B_TYPE_OPCODES, CB_TYPE_OPCODES }  from "./Define/Opcode.js"
import { I_TYPE_OPCODES }  from "./Define/Opcode.js"

export function buildLabelTable(codeLines, startAddress = 0, instructionSize = 4) {
    const labelTable = {};
    let currentAddress = startAddress;
    let actualInstructionCount = 0; // Đếm số lệnh thực tế để tính địa chỉ
  
    for (let i = 0; i < codeLines.length; i++) {
        let line = codeLines[i].replace(/(\/\/|;).*/, '').trim(); // Xóa comment, trim
  
        if (!line) {
            continue; // Bỏ qua dòng trống
        }
  
        // Kiểm tra xem dòng có chứa định nghĩa nhãn không (ví dụ: "MyLabel:")
        const labelMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):(.*)$/);
  
        if (labelMatch) {
            const labelName = labelMatch[1];
            const restOfLine = labelMatch[2].trim();
  
            if (labelTable.hasOwnProperty(labelName)) {
                // Có thể cảnh báo hoặc báo lỗi nếu nhãn bị định nghĩa lại
                console.warn(`Warning: Label "${labelName}" redefined at line ${i + 1}.`);
            }
            // Nhãn trỏ đến địa chỉ của lệnh *tiếp theo* (nếu có) hoặc lệnh trên cùng dòng
            labelTable[labelName] = currentAddress;
  
            if (restOfLine) { // Nếu có lệnh trên cùng dòng với nhãn
                line = restOfLine; // Xử lý phần còn lại như một lệnh
            } else {
                continue; // Nếu chỉ có nhãn, chuyển sang dòng tiếp theo
            }
        }
  
        // Nếu dòng (hoặc phần còn lại của dòng sau nhãn) không trống,
        // thì nó được coi là một lệnh và tăng địa chỉ.
        // Chúng ta cần một cách sơ bộ để biết nó có phải là lệnh không,
        // có thể dựa vào việc nó không phải là một định nghĩa nhãn khác.
        // Hoặc, tốt hơn là, chỉ tăng currentAddress nếu dòng đó thực sự là một lệnh.
        // Điều này hơi khó nếu không parse sâu, tạm thời giả định dòng không rỗng sau khi xử lý nhãn là lệnh.
        if (line) {
            currentAddress += instructionSize;
            actualInstructionCount++;
        }
    }
    // console.log("Label Table:", labelTable);
    return labelTable;
}

export function parseLegv8Instruction(line, labelTable = {}) { // Thêm labelTable làm tham số tùy chọn
    if (!line) {
        return null;
    }
  
    // 1. Remove comments and trim whitespace
    let cleanedLine = line.replace(/(\/\/|;).*/, '').trim();
  
    // --- BỎ QUA NẾU DÒNG LÀ ĐỊNH NGHĨA NHÃN ---
    // Nếu một dòng chứa nhãn VÀ lệnh, hàm buildLabelTable đã xử lý phần nhãn
    // và cleanedLine ở đây sẽ là phần lệnh còn lại.
    // Nếu dòng CHỈ là nhãn, buildLabelTable đã continue, hoặc dòng này sẽ trông như "LabelName:"
    // Ta cần đảm bảo không parse "LabelName:" như một mnemonic.
    // Một cách đơn giản là nếu cleanedLine kết thúc bằng ':' và không có gì khác, coi như chỉ là nhãn.
    // Tuy nhiên, việc tiền xử lý loại bỏ dòng chỉ chứa nhãn sẽ tốt hơn.
    // Giả định rằng dòng truyền vào đây ĐÃ được xác định là một lệnh tiềm năng.
    const labelDefinitionMatch = cleanedLine.match(/^([a-zA-Z_][a-zA-Z0-9_]*):$/);
    if (labelDefinitionMatch && cleanedLine.endsWith(':') && cleanedLine.indexOf(' ') === -1) {
        // console.log(`Skipping label-only line: ${cleanedLine}`);
        return { type: 'LABEL_DEF', label: labelDefinitionMatch[1], error: null }; // Trả về thông tin nhãn nếu muốn
    }
    // Hoặc nếu dòng đã được tiền xử lý, cleanedLine sẽ không còn nhãn đứng một mình.
    // Nếu có lệnh trên cùng dòng với nhãn, cleanedLine sẽ là phần lệnh đó.
  
    if (!cleanedLine) {
        return null;
    }
  
    // 2. Split into mnemonic and the rest
    const parts = cleanedLine.split(/\s+/);
    let mnemonic = parts[0].toUpperCase();
    const operandString = parts.slice(1).join(' ');
  
    // Xử lý trường hợp nhãn đứng trước lệnh trên cùng dòng, ví dụ "Else: ADDI..."
    // Hàm buildLabelTable đã lấy nhãn, ở đây ta cần đảm bảo mnemonic là "ADDI" chứ không phải "Else:".
    if (mnemonic.includes(':')) {
        const splitByColon = mnemonic.split(':');
        // labelName = splitByColon[0]; // Nhãn này đã được xử lý ở buildLabelTable
        mnemonic = splitByColon[1]?.toUpperCase(); // Lấy mnemonic sau dấu :
        if (!mnemonic) { // Nếu chỉ có "Label:" và không có lệnh theo sau trên dòng
            return { type: 'LABEL_DEF', label: splitByColon[0], error: null };
        }
    }
  
  
    const result = {
        instruction: cleanedLine, // Lưu lại dòng lệnh gốc đã clean
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
  
        // --- Sửa các phần parse lệnh B và CBZ/CBNZ ---
        if (['B', 'BL'].includes(mnemonic)) {
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
        } else if (['CBZ', 'CBNZ'].includes(mnemonic)) {
            if (opCount === 2 && ops[0].match(/^X([0-9]|1[0-9]|2[0-9]|30|ZR)$/i)) {
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
        // --- GIỮ NGUYÊN CÁC PHẦN PARSE KHÁC (R, D, I, IW, SYS, NOP) ---
        else if (['ADD', 'SUB', 'AND', 'ORR', 'EOR', 'LSL', 'LSR', 'ASR', 'MUL', 'SDIV', 'UDIV', 'SUBS'].includes(mnemonic)) {
             if (opCount === 3 && ops[0].match(/^X([0-9]|1[0-9]|2[0-9]|30|ZR)$/i) && ops[1].match(/^X([0-9]|1[0-9]|2[0-9]|30|ZR)$/i) && ops[2].match(/^X([0-9]|1[0-9]|2[0-9]|30|ZR)$/i)) {
                result.type = 'R';
                result.structuredOperands = { Rd: ops[0], Rn: ops[1], Rm: ops[2] };
            } else if (opCount === 3 && ops[0].match(/^X([0-9]|1[0-9]|2[0-9]|30|ZR)$/i) && ops[1].match(/^X([0-9]|1[0-9]|2[0-9]|30|ZR)$/i) && ops[2].match(/^#\d+$/)) {
                 result.type = 'R_Shift';
                 result.structuredOperands = { Rd: ops[0], Rn: ops[1], shift_imm: ops[2] };
            } else {
                 throw new Error(`Invalid operands for R-type instruction ${mnemonic}`);
            }
        } else if (['ADDI', 'SUBI', 'SUBIS'].includes(mnemonic)) { // ARITHMETIC I-types
             if (opCount === 3 &&
                 ops[0].match(/^X([0-9]|1[0-9]|2[0-9]|30|ZR)$/i) && // Rd
                 ops[1].match(/^X([0-9]|1[0-9]|2[0-9]|30|ZR)$/i) && // Rn
                 ops[2].match(/^#-?\d+$/)) {                         // #immediate (signed decimal)
                result.type = 'I'; // Or just 'I' if you handle encoding based on mnemonic
                result.structuredOperands = { Rd: ops[0], Rn: ops[1], immediate: ops[2] };
            } else {
                throw new Error(`Invalid operands for Arithmetic I-type instruction ${mnemonic}. Expected Rd, Rn, #decimal_immediate`);
            }
        } else if (['ANDI', 'ORRI', 'EORI'].includes(mnemonic)) { // LOGICAL I-types
            if (opCount === 3 &&
                ops[0].match(/^X([0-9]|1[0-9]|2[0-9]|30|ZR)$/i) && // Rd
                ops[1].match(/^X([0-9]|1[0-9]|2[0-9]|30|ZR)$/i) && // Rn
                ops[2].match(/^#0x[0-9a-f]+$/i)) {                  // #0xHEX_immediate (unsigned hex for bitmask)
                                                                  // Case-insensitive for '0x' and hex digits
                result.type = 'I'; // Or just 'I'
                result.structuredOperands = { Rd: ops[0], Rn: ops[1], bitmask_immediate: ops[2] };
            } else {
                throw new Error(`Invalid operands for Logical I-type instruction ${mnemonic}. Expected Rd, Rn, #0xHEX_immediate`);
            }
        } else if (['LDUR', 'STUR'].includes(mnemonic)) {
            if (opCount === 2 && ops[0].match(/^X([0-9]|1[0-9]|2[0-9]|30|ZR)$/i) && ops[1].match(/^\[X([0-9]|1[0-9]|2[0-9]|30|ZR)\s*(,\s*#-?\d+)?\s*\]$/i)) {
                result.type = 'D';
                const memMatch = ops[1].match(/^\[(X([0-9]|1[0-9]|2[0-9]|30|ZR))\s*(?:,\s*(#-?\d+))?\s*\]$/i);
                if (memMatch) {
                    result.structuredOperands = {
                        Rt: ops[0],
                        Rn: memMatch[1].toUpperCase(),
                        address_imm: memMatch[2] || '#0'
                    };
                } else {
                    throw new Error(`Could not parse memory operand for ${mnemonic}: ${ops[1]}`);
                }
            } else {
                throw new Error(`Invalid operands for D-type instruction ${mnemonic}`);
            }
        } else if (['MOVZ', 'MOVK'].includes(mnemonic)) {
             if (opCount >= 2 && opCount <= 4 && ops[0].match(/^X([0-9]|1[0-9]|2[0-9]|30|ZR)$/i) && ops[1].match(/^#-?\d+$/)) {
                 result.type = 'IW';
                 result.structuredOperands = { Rd: ops[0], immediate: ops[1], shift: null };
                 if (opCount > 2) {
                     if (ops[2].toUpperCase() === 'LSL' && opCount === 4 && ops[3].match(/^#(0|16|32|48)$/)) {
                          result.structuredOperands.shift = { type: 'LSL', amount: ops[3] };
                     } else {
                          throw new Error(`Invalid shift operand for ${mnemonic}`);
                     }
                 }
             } else {
                 throw new Error(`Invalid operands for IW-type instruction ${mnemonic}`);
             }
        } else if (['BRK', 'SVC', 'HLT'].includes(mnemonic)) {
            if (opCount === 1 && ops[0].match(/^#\d+$/)) {
                result.type = 'SYS';
                result.structuredOperands = { immediate: ops[0] };
            } else {
                 throw new Error(`Invalid operands for System instruction ${mnemonic}`);
            }
        } else if (mnemonic === 'NOP') {
             if (opCount === 0) {
                  result.type = 'NOP';
                  result.structuredOperands = {};
             } else {
                  throw new Error('NOP instruction takes no operands');
             }
        } else {
             // Kiểm tra xem có phải là định nghĩa nhãn không (trường hợp "LABEL:" rồi hết)
             // Phần này có thể không cần nếu việc lọc dòng chỉ chứa nhãn đã tốt
             if (opCount === 0 && mnemonic.endsWith(':')) {
                  result.type = 'LABEL_DEF';
                  result.label = mnemonic.slice(0, -1);
                  result.mnemonic = null; // Không phải lệnh
             } else if (result.type === 'UNKNOWN') { // Nếu không khớp lệnh nào ở trên
                 result.error = `Unknown mnemonic or invalid operands: ${mnemonic}`;
                 // result.structuredOperands = { raw: result.operands }; // Có thể bỏ
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
    return null; // Bỏ qua các dòng không parse được hoàn toàn hoặc không phải lệnh/nhãn
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

export function encodeLegv8Instruction(parsedInstruction, currentInstructionAddress = 0) {
    if (!parsedInstruction || parsedInstruction.error) {
        const errorMsg = parsedInstruction ? parsedInstruction.error : "Parsed instruction is null.";
        return { error: `Invalid or errored parsed instruction: ${errorMsg}` };
    }

    const { mnemonic, type, structuredOperands, targetAddress } = parsedInstruction;

    try {
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
            const machineCode = `${opcode}${rmBin}${shamtBin}${rnBin}${rdBin}`;
            if (machineCode.length !== 32) return { error: `R-type: Generated code length is not 32 bits (${machineCode.length})` };
            return machineCode;
        } else if (type === 'R_Shift') {
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
            const machineCode = `${opcode}${rmBin}${shamtBin}${rnBin}${rdBin}`;
            if (machineCode.length !== 32) return { error: `R-shift: Generated code length is not 32 bits (${machineCode.length})` };
            return machineCode;


        } else if (type === 'I') {
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

            const machineCode = `${opcodeDetails}${immediateBin}${rnBin}${rdBin}`;
            if (machineCode.length !== 32) return { error: `I-type: Generated code length is not 32 bits (${machineCode.length})` };
            return machineCode;
        } else if (type === 'D') {
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
            const machineCode = `${opcode}${immediateBin}${op2}${rnBin}${rtBin}`;
            if (machineCode.length !== 32) return { error: `D-type: Generated code length is not 32 bits (${machineCode.length})` };
            return machineCode;
            
        } else if (type === 'B') {
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

            // Kiểm tra phạm vi cho 26-bit signed offset
            // Max positive: (2^25 - 1) => (1 << 25) - 1
            // Min negative: -(2^25)    => -(1 << 25)
            const maxOffsetB = (1 << 25) - 1;
            const minOffsetB = -(1 << 25);
            if (wordOffset < minOffsetB || wordOffset > maxOffsetB) {
                return { error: `B-type offset ${wordOffset} (for label ${structuredOperands.label}) out of 26-bit signed range for ${mnemonic}.` };
            }

            const immediateBin = toBinary(wordOffset, 26); // 26-bit immediate (word offset)

            const machineCode = `${opcode}${immediateBin}`;
            if (machineCode.length !== 32) return { error: `B-type: Generated code length is not 32 bits (${machineCode.length})` };
            return machineCode;

        } else if (type === 'CB') {
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

            // Kiểm tra phạm vi cho 19-bit signed offset
            // Max positive: (2^18 - 1) => (1 << 18) - 1
            // Min negative: -(2^18)    => -(1 << 18)
            const maxOffsetCB = (1 << 18) - 1;
            const minOffsetCB = -(1 << 18);
            if (wordOffset < minOffsetCB || wordOffset > maxOffsetCB) {
                return { error: `CB-type offset ${wordOffset} (for label ${structuredOperands.label}) out of 19-bit signed range for ${mnemonic}.` };
            }

            const immediateBin = toBinary(wordOffset, 19); // 19-bit immediate (word offset)

            const machineCode = `${opcode}${immediateBin}${rtBin}`;
            if (machineCode.length !== 32) return { error: `CB-type: Generated code length is not 32 bits (${machineCode.length})` };
            return machineCode;
        } else if (type === 'IW') {
             // TODO: Implement IW-type encoding (MOVZ, MOVK...)
             // Format: Opcode(9 bits), op2(2 bits), Immediate(16 bits), Rd(5 bits)
             return { error: `Encoding for IW-type (${mnemonic}) not yet implemented.` };
        } else if (type === 'SYS') {
             // TODO: Implement SYS-type encoding (SVC, HLT, BRK...)
             return { error: `Encoding for SYS-type (${mnemonic}) not yet implemented.` };
        } else {
            return { error: `Unsupported instruction type for encoding: ${type}` };
        }
    } catch (e) {
        // Bắt lỗi từ các hàm helper (parseRegister, toBinary)
        return { error: e.message };
    }
}