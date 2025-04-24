import { R_TYPE_OPCODES }  from "../InstructionCycle/Define/Opcode.js"

/**
 * Parses a single line of LEGv8 assembly code.
 * Handles common formats (R, I, D, B, CB, IW, System).
 * Removes comments starting with // or ;
 * @param {string} line - The assembly code line to parse.
 * @returns {ParsedInstruction | null} An object with parsed components, or null for empty/comment-only lines.
 */
export function parseLegv8Instruction(line) {
    if (!line) {
        return null; // Ignore empty lines
    }

    // 1. Remove comments and trim whitespace
    let cleanedLine = line.replace(/(\/\/|;).*/, '').trim();
    if (!cleanedLine) {
        return null; // Ignore comment-only or empty lines after cleaning
    }

    // 2. Split into mnemonic and the rest (operands string)
    const parts = cleanedLine.split(/\s+/); // Split by whitespace
    const mnemonic = parts[0].toUpperCase(); // Mnemonics are typically case-insensitive
    const operandString = parts.slice(1).join(' '); // Rejoin the rest for easier parsing

    const result = {
        mnemonic: mnemonic,
        operands: [],
        type: 'UNKNOWN',
        structuredOperands: null,
        error: null
    };

    // 3. Parse operands based on expected format (inferred from mnemonic)
    try {
        // Split operands intelligently (commas, spaces, respecting brackets)
        // This regex splits by comma, or by space *unless* inside brackets []
        // It also trims whitespace around each resulting operand.
        const rawOperands = operandString.match(/[^,\s\[\]]+|\[[^\]]*\]/g) || [];
        result.operands = rawOperands.map(op => op.trim()).filter(op => op !== ''); // Trim and remove empty

        // --- Infer Type and Structure Operands ---
        // (This is a simplified inference based on common patterns)

        const opCount = result.operands.length;
        const ops = result.operands;

        // Check specific mnemonics first
        if (['ADD', 'SUB', 'AND', 'ORR', 'EOR', 'LSL', 'LSR', 'ASR', 'MUL', 'SDIV', 'UDIV', 'SUBS'].includes(mnemonic)) {
             if (opCount === 3 && ops[0].match(/^X([0-9]|1[0-9]|2[0-7]|SP|ZR)$/i) && ops[1].match(/^X([0-9]|1[0-9]|2[0-7]|SP|ZR)$/i) && ops[2].match(/^X([0-9]|1[0-9]|2[0-7]|SP|ZR)$/i)) {
                result.type = 'R';
                result.structuredOperands = { Rd: ops[0], Rn: ops[1], Rm: ops[2] };
            } else if (opCount === 3 && ops[0].match(/^X([0-9]|1[0-9]|2[0-7]|SP|ZR)$/i) && ops[1].match(/^X([0-9]|1[0-9]|2[0-7]|SP|ZR)$/i) && ops[2].match(/^#\d+$/)) {
                 // Handle shifts (LSL, LSR, ASR) specifically if needed - R type with shift amount
                 result.type = 'R_Shift'; // Or just 'R' depending on detail needed
                 result.structuredOperands = { Rd: ops[0], Rn: ops[1], shift_imm: ops[2] };
            } else {
                 throw new Error(`Invalid operands for R-type instruction ${mnemonic}`);
            }
        } else if (['ADDI', 'SUBI', 'ANDI', 'ORRI', 'EORI', 'SUBIS'].includes(mnemonic)) {
             if (opCount === 3 && ops[0].match(/^X([0-9]|1[0-9]|2[0-7]|SP|ZR)$/i) && ops[1].match(/^X([0-9]|1[0-9]|2[0-7]|SP|ZR)$/i) && ops[2].match(/^#-?\d+$/)) {
                result.type = 'I';
                result.structuredOperands = { Rd: ops[0], Rn: ops[1], immediate: ops[2] };
            } else {
                throw new Error(`Invalid operands for I-type instruction ${mnemonic}`);
            }
        } else if (['LDUR', 'STUR', 'LDURSW', 'LDURH', 'STURH', 'LDURB', 'STURB'].includes(mnemonic)) {
            if (opCount === 2 && ops[0].match(/^X([0-9]|1[0-9]|2[0-7]|SP|ZR)$/i) && ops[1].match(/^\[X([0-9]|1[0-9]|2[0-7]|SP|ZR)\s*(,\s*#-?\d+)?\s*\]$/i)) {
                result.type = 'D';
                const memMatch = ops[1].match(/^\[(X[0-9]+|XSP|XZR)\s*(?:,\s*(#-?\d+))?\s*\]$/i);
                if (memMatch) {
                     result.structuredOperands = {
                        Rt: ops[0], // Destination/Source register
                        Rn: memMatch[1].toUpperCase(), // Base register
                        address_imm: memMatch[2] || '#0' // Optional immediate offset, default to 0
                     };
                } else {
                    throw new Error(`Could not parse memory operand for ${mnemonic}: ${ops[1]}`);
                }
            } else {
                throw new Error(`Invalid operands for D-type instruction ${mnemonic}`);
            }
        } else if (['B', 'BL'].includes(mnemonic)) {
            if (opCount === 1) {
                result.type = 'B';
                result.structuredOperands = { label: ops[0] };
            } else {
                 throw new Error(`Invalid operands for B-type instruction ${mnemonic}`);
            }
        } else if (['CBZ', 'CBNZ'].includes(mnemonic)) {
             if (opCount === 2 && ops[0].match(/^X([0-9]|1[0-9]|2[0-7]|SP|ZR)$/i)) {
                result.type = 'CB';
                result.structuredOperands = { Rt: ops[0], label: ops[1] };
             } else {
                 throw new Error(`Invalid operands for CB-type instruction ${mnemonic}`);
             }
        } else if (['MOVZ', 'MOVK'].includes(mnemonic)) {
             // MOVZ Rd, #imm {, LSL #shift}
             // MOVK Rd, #imm {, LSL #shift}
             if (opCount >= 2 && opCount <= 4 && ops[0].match(/^X([0-9]|1[0-9]|2[0-7]|SP|ZR)$/i) && ops[1].match(/^#-?\d+$/)) {
                 result.type = 'IW';
                 result.structuredOperands = { Rd: ops[0], immediate: ops[1], shift: null };
                 if (opCount > 2) {
                     // Expecting LSL, #amount
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
                  result.type = 'NOP'; // Special type or maybe 'R' if treated as ORR XZR, XZR, XZR
                  result.structuredOperands = {};
             } else {
                  throw new Error('NOP instruction takes no operands');
             }
        }
        // Add more specific mnemonic checks here (e.g., BR, CMP, MOV pseudo-instruction)

        // If type is still UNKNOWN, keep the raw operands
        if (result.type === 'UNKNOWN') {
            result.structuredOperands = { raw: result.operands };
        }


    } catch (e) {
        result.error = e.message;
        result.mnemonic = mnemonic; // Keep mnemonic even on error
        result.operands = []; // Clear operands on error? Or keep raw? Decide policy.
        result.type = null;
        result.structuredOperands = null;
    }

    return result;
}

/**
 * Chuyển đổi số hiệu thanh ghi LEGv8 (X0-X30, XZR, SP) thành số nguyên.
 * @param {string} regString - Chuỗi tên thanh ghi (e.g., "X9", "XZR", "SP").
 * @returns {number} Số hiệu thanh ghi (0-31).
 * @throws {Error} Nếu định dạng thanh ghi không hợp lệ.
 */
function parseRegisterNumber(regString) {
    if (!regString) throw new Error("Register string cannot be empty.");
    const upperReg = regString.toUpperCase();
    if (upperReg === 'XZR') {
        return 31; // XZR is register 31
    }
    if (upperReg === 'SP') {
        return 28; // SP is usually mapped to register 28 in AArch64/LEGv8 contexts
    }
    const match = upperReg.match(/^X(\d{1,2})$/); // Matches X0 to X31
    if (match) {
        const num = parseInt(match[1], 10);
        if (num >= 0 && num <= 30) { // Standard general purpose regs + XZR handled above
            return num;
        }
    }
    throw new Error(`Invalid register format: ${regString}`);
}

/**
 * Chuyển đổi một số nguyên thành chuỗi nhị phân với độ dài cố định (padding 0).
 * @param {number} number - Số nguyên cần chuyển đổi.
 * @param {number} bits - Số bit mong muốn cho chuỗi nhị phân.
 * @returns {string} Chuỗi nhị phân được padding.
 * @throws {Error} Nếu số không vừa với số bit yêu cầu hoặc không phải là số.
 */
function toBinary(number, bits) {
    if (typeof number !== 'number' || !Number.isInteger(number)) {
        throw new Error(`Invalid input: "${number}" is not an integer.`);
    }
    if (number < 0) {
       // Basic LEGv8 encoding often doesn't handle negative field values directly
       // except for immediates, which are handled differently.
       // Register numbers and shamt should be non-negative.
       throw new Error(`Negative numbers (${number}) not directly supported for this field type.`);
    }
     // Check if number fits within the specified bits (unsigned)
    if (number >= (1 << bits)) {
         throw new Error(`Number ${number} is too large for ${bits} bits.`);
    }

    let binaryString = number.toString(2);
    return binaryString.padStart(bits, '0');
}

/**
 * Mã hóa một đối tượng lệnh LEGv8 đã được parse thành chuỗi mã máy 32-bit.
 * Hiện tại chỉ hỗ trợ R-type ADD (và các lệnh trong R_TYPE_OPCODES).
 * @param {ParsedInstruction} parsedInstruction - Đối tượng lệnh đã parse.
 * @returns {string | {error: string}} Chuỗi nhị phân 32-bit hoặc đối tượng lỗi.
 */
export function encodeLegv8Instruction(parsedInstruction) {
    if (!parsedInstruction || parsedInstruction.error) {
        return { error: "Invalid or errored parsed instruction provided." };
    }

    const { mnemonic, type, structuredOperands } = parsedInstruction;

    try {
        if (type === 'R') {
            // Xử lý R-type
            const opcode = R_TYPE_OPCODES[mnemonic];
            if (!opcode) {
                return { error: `Unsupported R-type mnemonic: ${mnemonic}` };
            }

            // Lấy và chuyển đổi số hiệu thanh ghi
            const rdNum = parseRegisterNumber(structuredOperands.Rd);
            const rnNum = parseRegisterNumber(structuredOperands.Rn);
            const rmNum = parseRegisterNumber(structuredOperands.Rm);
            const shamt = 0; // shamt = 0 cho ADD, SUB, AND, ORR, EOR cơ bản

            // Chuyển sang nhị phân với độ dài cố định
            const rdBin = toBinary(rdNum, 5);
            const rnBin = toBinary(rnNum, 5);
            const rmBin = toBinary(rmNum, 5);
            const shamtBin = toBinary(shamt, 6);

            // Ghép các trường theo đúng thứ tự: Opcode(11) Rm(5) shamt(6) Rn(5) Rd(5)
            const machineCode = `${opcode}${rmBin}${shamtBin}${rnBin}${rdBin}`;

            if (machineCode.length !== 32) {
                 // Sanity check
                return { error: `Internal error: Generated code length is not 32 bits (${machineCode.length})` };
            }
            return machineCode;

        } else if (type === 'R_Shift') {
             // Xử lý R-type với shift immediate (LSL, LSR, ASR)
             const opcode = R_TYPE_OPCODES[mnemonic];
             if (!opcode) {
                 return { error: `Unsupported R-shift mnemonic: ${mnemonic}` };
             }
             const rdNum = parseRegisterNumber(structuredOperands.Rd);
             const rnNum = parseRegisterNumber(structuredOperands.Rn);
             const rmNum = 0; // Rm is often ignored or 0 for immediate shifts in R format, CHECK SPEC!
             const shamtMatch = structuredOperands.shift_imm.match(/^#(\d+)$/);
             if (!shamtMatch) return { error: `Invalid shift amount format: ${structuredOperands.shift_imm}`};
             const shamt = parseInt(shamtMatch[1], 10);

             if (shamt < 0 || shamt > 63) return { error: `Shift amount ${shamt} out of range (0-63)`};

             const rdBin = toBinary(rdNum, 5);
             const rnBin = toBinary(rnNum, 5);
             const rmBin = toBinary(rmNum, 5); // Use 0 or check specific instruction encoding
             const shamtBin = toBinary(shamt, 6);

             const machineCode = `${opcode}${rmBin}${shamtBin}${rnBin}${rdBin}`;
             if (machineCode.length !== 32) return { error: `Internal error: Generated code length is not 32 bits (${machineCode.length})` };
             return machineCode;

        } else if (type === 'I') {
            // TODO: Implement I-type encoding (ADDI, SUBI...)
            // Format: Opcode(10 bits), Immediate(12 bits), Rn(5 bits), Rd(5 bits)
            return { error: `Encoding for I-type (${mnemonic}) not yet implemented.` };
        } else if (type === 'D') {
            // TODO: Implement D-type encoding (LDUR, STUR...)
            // Format: Opcode(11 bits), Immediate(9 bits), op2(2 bits), Rn(5 bits), Rt(5 bits)
            return { error: `Encoding for D-type (${mnemonic}) not yet implemented.` };
        } else if (type === 'B') {
            // TODO: Implement B-type encoding (B, BL...)
            // Format: Opcode(6 bits), Immediate(26 bits) - Requires calculating offset!
            return { error: `Encoding for B-type (${mnemonic}) not yet implemented.` };
        } else if (type === 'CB') {
            // TODO: Implement CB-type encoding (CBZ, CBNZ...)
            // Format: Opcode(8 bits), Immediate(19 bits), Rt(5 bits) - Requires calculating offset!
            return { error: `Encoding for CB-type (${mnemonic}) not yet implemented.` };
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