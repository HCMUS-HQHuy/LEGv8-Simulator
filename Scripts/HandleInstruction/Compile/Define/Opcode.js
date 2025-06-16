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
    'CBZ'   : '10110100', // 8-bit opcode
    'CBNZ'  : '10110101',
};

export const I_TYPE_OPCODES = {
    'ADDI': '1001000100', // 10-bit Opcode
    'SUBI': '1101000100',
    'ANDI': '1001001000',
    'ORRI': '1011001000',
    'EORI': '1101001000',
    'ADDIS': '1011000100',
    'SUBIS': '1111000100',
    'ANDIS': '1111001000'
};

export const B_COND_OPCODE_PREFIX = '01010100';

export const B_COND_CODES = {
    'EQ': '0000',
    'NE': '0001',
    'LT': '1011', // Less Than (signed): N!=V
    'LO': '0011', // Lower (unsigned) / Carry Clear: C=0
    'LS': '1001', // Lower or Same (unsigned): !(C=1 and Z=0)
    'LE': '1101', // Less or Equal (signed): Z=1 or N!=V
    'GT': '1100', // Greater Than (signed): Z=0 and N=V
    'HI': '1000', // Higher (unsigned): C=1 and Z=0
    'GE': '1010', // Greater or Equal (signed): N=V
    'HS': '0010', // Higher or Same (unsigned) / Carry Set: C=1
};

// Tạo một đối tượng đảo ngược để dễ dàng tìm tên lệnh từ mã cond
export const B_COND_MNEMONICS = {
    '0000': 'B.EQ',
    '0001': 'B.NE',
    '0010': 'B.HS',
    '0011': 'B.LO',
    '1000': 'B.HI',
    '1001': 'B.LS',
    '1010': 'B.GE',
    '1011': 'B.LT',
    '1100': 'B.GT',
    '1101': 'B.LE',
};