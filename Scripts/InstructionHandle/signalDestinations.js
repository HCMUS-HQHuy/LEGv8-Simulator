// BẢNG ÁNH XẠ: Tên tín hiệu -> ID của phần tử SVG đích
const signalDestinations = {
    "Reg2Loc":  "register",      // Hoặc "mux-1" nếu MUX đó tồn tại và là đích
    "ALUSrc":   "mux-2",
    "MemtoReg": "mux-3",
    "RegWrite": "register",
    "MemRead":  "data-memory",
    "MemWrite": "data-memory",
    "ALUOp":    "ALU-control",
    "Branch":   "and-gate",
    "UncondBranch": "or-gate", // Thêm nếu bạn đã thêm tín hiệu này
};

export default signalDestinations;