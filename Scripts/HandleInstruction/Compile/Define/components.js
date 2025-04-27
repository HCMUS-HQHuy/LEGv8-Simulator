export function getComponents() {
	return {
		PC: {
			value: 0
		},
		Const4: {
			value: 4
		},
		InstructionMemory: {
			instruction: [],
			ReadAddress: -1,
		
			Instruction31_00: null,
		
			Opcode_31_21:  null,
			Rm_20_16:      null,
			Shamt_15_10:   null,
			Rn_09_05:      null,
			RdRt_04_00:    null,
		
			Imm12_21_10:   "111111111100",
			Imm9_20_12:    "000001100",
			Imm19_23_5:    "0000000000000000000",
			Imm26_25_0:    "00000000000000000000000000",
		},
		Register: {
			registerValues: [
				0, 0, 0, 0, 0, 0, 0, 0,
				0, 0, 0, 0, 0, 0, 0, 0,
				0, 0, 0, 0, 100, 0, 0, 0,
				0, 0, 0, 0, 0, 0, 0, 0
			],
			option: 0,
			Read1: -1,
			Read2: 0,
			WriteReg: 0, 
			WriteData: 0,
			ReadData1: 0,
			ReadData2: 0
		},
		DataMemory: {
			Values: [0, 0, 10, 5, 15, 0, 0, 0],
			address: 0,
			WriteData: 0,
			ReadData: 0,
			writeEnable: 0,
			readEnable: 0
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
			RegWrite: 0,
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
		}
	};
}