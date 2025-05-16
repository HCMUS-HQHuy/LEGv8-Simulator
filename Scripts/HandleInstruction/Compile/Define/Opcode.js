export const R_TYPE_OPCODES = {
    'ADD':  '10001011000',
    'SUB':  '11001011000',
    'AND':  '10001010000',
    'ORR':  '10101010000',
    'SUBS': '11101011000',
    'EOR':  '11001010000',
    'LSL':  '11010011011',
    'LSR':  '11010011010',
};

export const D_TYPE_OPCODES = {
    'LDUR': '11111000010',
    'STUR': '11111000000'
}

// Thêm opcode cho B và CB
export const B_TYPE_OPCODES = {
    'B':  '000101', // 6-bit opcode
    'BL': '100101'  // 6-bit opcode
};

export const CB_TYPE_OPCODES = {
    'CBZ':  '10110100', // 8-bit opcode
    'CBNZ': '10110101'  // 8-bit opcode
};

export const I_TYPE_OPCODES = {
    'ADDI': '1001000100', // 10-bit Opcode
    'SUBI': '1101000100',
    'ANDI': '1001001000',
    'ORRI': '1011001000',
    'EORI': '1101001000',
    'SUBIS': '1111000100' // Opcode cho SUBIS
    // Thêm các lệnh I-type khác
};