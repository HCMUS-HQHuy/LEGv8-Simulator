export function getComponents() {
	return new Object({
		PC: {
			value: 0
		},
		Const4: {
			value: 4
		},
		InstructionMemory: {
			instruction: [],
			instructionType: [],
			ReadAddress: -1,
		
			Opcode_31_21:  null,
			Rm_20_16:      null,
			Shamt_15_10:   null,
			Rn_09_05:      null,
			RdRt_04_00:    null,

			SignExtend: null,
		},
		Register: {
			registerValues: [
				0, 0, 0, 0, 0, 0, 0, 0,
				0, 0, 0, 0, 0, 0, 0, 0,
				0, 0, 0, 0, 0, 0, 0, 0,
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
			Values: [
				0, 0, 0, 0, 0, 0, 0, 0,
				0, 0, 0, 0, 0, 0, 0, 0,
				0, 0, 0, 0, 0, 0, 0, 0,
				0, 0, 0, 0, 0, 0, 0, 0,
				0, 0, 0, 0, 0, 0, 0, 0,
				0, 0, 0, 0, 0, 0, 0, 0,
				0, 0, 0, 0, 0, 0, 0, 0,
				0, 0, 0, 0, 0, 0, 0, 0
			],
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
	});
}