// BẢNG ÁNH XẠ: Tên tín hiệu -> ID của phần tử SVG đích
// Cập nhật dựa trên ID mới được thêm vào SVG
const signalDestinations = {
    // Tín hiệu điều khiển MUXes
    "Reg2Loc":  "mux-1",      // Ảnh hưởng đến việc chọn thanh ghi đọc thứ 2 tại khối "register" (Không có MUX rõ ràng cho việc này, nên trỏ vào khối register)
    "ALUSrc":   "mux-2",         // Điều khiển MUX chọn ngõ vào thứ 2 cho ALU (Read data 2 / Sign-extended immediate)
    "MemtoReg": "mux-3",         // Điều khiển MUX chọn dữ liệu ghi về thanh ghi (ALU result / Memory data)

    // Tín hiệu điều khiển Khối Thanh ghi (Register File)
    "RegWrite": "register",      // Cho phép ghi vào khối "register"

    // Tín hiệu điều khiển Bộ nhớ Dữ liệu (Data Memory)
    "MemRead":  "data-memory",   // Cho phép đọc từ khối "data-memory"
    "MemWrite": "data-memory",   // Cho phép ghi vào khối "data-memory"

    // Tín hiệu điều khiển ALU và Nhánh (Branch)
    "ALUOp1":   "ALU-control",   // Đi tới khối "ALU-control" để xác định phép toán ALU
    "ALUOp0":   "ALU-control",   // Đi tới khối "ALU-control" để xác định phép toán ALU
    "Branch":   "and-gate",      // Đi tới cổng AND ("and-gate") kết hợp với cờ Zero để quyết định nhánh (cho CBZ)

    // Tín hiệu chưa có trong bảng controlSignalTable nhưng có path:
    "Uncondbranch": "or-gate", // (Nếu có) Tín hiệu nhánh không điều kiện, có thể đi tới cổng OR

    // Cần thêm các ID đích cho các đường dẫn khác nếu bạn mở rộng tín hiệu
};

export default signalDestinations;