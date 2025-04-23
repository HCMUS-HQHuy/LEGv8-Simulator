/**
 * Bảng tra cứu Opcode cho một số lệnh R-type LEGv8.
 * Cần mở rộng bảng này cho các lệnh khác.
 */
export const R_TYPE_OPCODES = {
    // Từ ví dụ: ADD Xd, Xn, Xm
    'ADD':  '10001011000',
    // Các ví dụ khác (opcode này là giả định/ví dụ, cần kiểm tra spec LEGv8)
    'SUB':  '11001011000',
    'AND':  '10001010000',
    'ORR':  '10101010000',
    'EOR':  '11001010000',
    'LSL':  '11010011011', // LSL Rd, Rn, #shamt (requires shamt field)
    'LSR':  '11010011010', // LSR Rd, Rn, #shamt (requires shamt field)
    // Thêm các lệnh R-type khác vào đây
};

// Thêm các bảng Opcode cho loại I, D, B, CB... nếu cần