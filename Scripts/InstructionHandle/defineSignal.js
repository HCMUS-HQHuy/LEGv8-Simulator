const controlSignalTable = {
    // Mapping instruction classes to their control signal values
    // Based on Figure 4.22, with 'X' replaced by 0
    "R-format": { // For ADD, SUB, AND, ORR etc.
        Reg2Loc:  0, // X -> 0
        ALUSrc:   0,
        MemtoReg: 0, // X -> 0
        RegWrite: 1,
        MemRead:  0,
        MemWrite: 0,
        Branch:   0, // X -> 0
        Uncondbranch:   0, // X -> 0
        ALUOp1:   1,
        ALUOp0:   0
    },
    "LDUR": { // Load Register Unscaled
        Reg2Loc:  0, // X -> 0
        ALUSrc:   1,
        MemtoReg: 1,
        RegWrite: 1,
        MemRead:  1,
        MemWrite: 0,
        Branch:   0, // X -> 0
        Uncondbranch:   0, // X -> 0
        ALUOp1:   0,
        ALUOp0:   0
    },
    "STUR": { // Store Register Unscaled
        Reg2Loc:  0, // X -> 0
        ALUSrc:   1,
        MemtoReg: 0, // X -> 0
        RegWrite: 0,
        MemRead:  0,
        MemWrite: 1,
        Branch:   0, // X -> 0
        Uncondbranch:   0, // X -> 0
        ALUOp1:   0,
        ALUOp0:   0
    },
    "CBZ": { // Compare and Branch if Zero
        Reg2Loc:  0, // X -> 0
        ALUSrc:   0, // X -> 0
        MemtoReg: 0, // X -> 0
        RegWrite: 0, // X -> 0
        MemRead:  0,
        MemWrite: 0,
        Branch:   1,
        Uncondbranch:   0, // X -> 0
        ALUOp1:   0, // X -> 0 (ALU likely used for compare/subtract internally)
        ALUOp0:   1  // X -> 1 (ALU likely used for compare/subtract internally)
        // Note: ALUOp for CBZ might need specific ALU control logic not fully shown here.
        // Assuming ALU performs a subtract for comparison.
    }
    // Add other instruction types/classes if needed (e.g., B, I-type)
};

export default controlSignalTable;