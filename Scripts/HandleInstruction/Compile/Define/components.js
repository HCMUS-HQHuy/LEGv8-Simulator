export const Components = {
	PC: {
		OldValue: 0,
		NewValue: 15
	},
	Const4: {
		value: 4
	},
	InstructionMemory: {
		ReadAddress: "0x00000000",
	
		Instruction31_00: "10001011000000110000000010000001",  // VD: ADD X1, X2, X3
	
		Opcode_31_21:  "10001011000",  // bits [31:21]
		Rm_20_16:      "00011",        // bits [20:16]
		Shamt_15_10:   "000000",       // bits [15:10]
		Rn_09_05:      "00010",        // bits [9:5]
		RdRt_04_00:    "00001",        // bits [4:0]
	
		Imm12_21_10:   "111111111100", // I-type (Immediate)
		Imm9_20_12:    "000001100",    // D-type (Offset)
		Imm19_23_5:    "0000000000000000000", // CB-type
		Imm26_25_0:    "00000000000000000000000000", // B-type
	},
	Register: {
		option: 0,
		read1: 0,
		read2: 0,
		writeReg: 0, 
		WriteData: 0,
		ReadData1: 0,
		ReadData2: 0
	},
	DataMemory: {
		address: 0,
		WriteData: 0,
		ReadData: 0
	},
	Add0: {
        input1: 0,
        input2: 0,
        output: 0
	},
	Add1: {
        input1: 0,
        input2: 0,
        output: 0
	},
	ALU: {
		input1: 0,
		input2: 0,
		option: 0,
		output: 0,
		zero  : 0
	},
	Control: {
		Reg2Loc:  0,
        ALUSrc:   0,
        MemtoReg: 0,
        RegWrite: 1,
        MemRead:  0,
        MemWrite: 0,
        Branch:   0,
        UncondBranch: 0,
		ALUOp: 'XX'
	},
	ShiftLeft2: {
        input: 0,
        output: 0,
	},
	SignExtend: {
		input: 0,
		output: 0,
	},
	ALUControl: {
		ALUOp: 0,
		Opcode: 0,
		output: 0,
	},
	Mux0: {
		input0: 0,
		input1: 0,
		option: 0,
		output: 0
	},
	Mux1: {
		input0: 0,
		input1: 0,
		option: 0,
		output: 0
	},
	Mux2: {
		input0: 0,
		input1: 0,
		option: 0,
		output: 0
	},
	Mux3: {
		input0: 0,
		input1: 0,
		option: 0,
		output: 0
	},
	AndGate: {
		input1: 0,
		input2: 0,
		output: 0
	},
	OrGate: {
		input1: 0,
		input2: 0,
		output: 0
	},
	registerValues: {
		X0: 0,
		X1: 0,
		X2: 0,
		X3: 0,
		X4: 0,
		X5: 0,
		X6: 0,
		X7: 0,
		X8: 0,
		X9: 0,
		X10: 0,
		X11: 0,
		X12: 0,
		X13: 0,
		X14: 0,
		X15: 0,
		X16: 0,
		X17: 0,
		X18: 0,
		X19: 0,
		X20: 0,
		X21: 0,
		X22: 0,
		X23: 0,
		X24: 0,
		X25: 0,
		X26: 0,
		X27: 0,
		X28: 0,
		X29: 0,
		X30: 0,
		X31: 0
	}
};
