export function cloneComponents(components) {
	return deepClone(components);
}

function deepClone(obj) {
	if (obj === null || typeof obj !== 'object') return obj;

	if (Array.isArray(obj)) {
		return obj.map(deepClone);
	}

	const cloned = {};
	for (const key in obj) {
		cloned[key] = deepClone(obj[key]);
	}
	return cloned;
}


export function getComponents() {
	return new Object({
		PC: {
			value: 0n
		},
		Const4: {
			value: 4n
		},
		InstructionMemory: {
			instruction: [],
			instructionType: [],
			ReadAddress: -1,

			Opcode_31_21: null,
			Rm_20_16: null,
			Shamt_15_10: null,
			Rn_09_05: null,
			RdRt_04_00: null,

			SignExtend: null,
		},
		Register: {
			registerValues: Array(32).fill(0n),
			option: 0, // control signal
			Read1: -1, // index
			Read2: 0,
			WriteReg: 0,
			WriteData: 0n,
			ReadData1: 0n,
			ReadData2: 0n
		},
		DataMemory: {
			Values: Array(64).fill(0n),
			address: 0,
			WriteData: 0n,
			ReadData: 0n,
			writeEnable: 0,
			readEnable: 0
		},
		Add0: {
			input1: 0n,
			input2: 0n,
			output: 0n
		},
		Add1: {
			input1: 0n,
			input2: 0n,
			output: 0n
		},
		ALU: {
			input1: 0n,
			input2: 0n,
			option: 0,   // ALU operation selector
			output: 0n,
			zero: 0,
			Flags: {
				N: 0,
				Z: 0,
				V: 0,
				C: 0
			},
		},
		Control: {
			Reg2Loc: 0,
			ALUSrc: 0,
			MemtoReg: 0,
			RegWrite: 0,
			MemRead: 0,
			MemWrite: 0,
			Branch: 0,
			UncondBranch: 0,
			ALUOp: 'XX'
		},
		ShiftLeft2: {
			input: 0n,
			output: 0n,
		},
		SignExtend: {
			input: 0n,
			output: 0n,
		},
		ALUControl: {
			ALUOp: 0,    // control signal
			Opcode: 0,
			output: 0,
		},
		Mux0: {
			input0: 0n,
			input1: 0n,
			option: 0,
			output: 0n
		},
		Mux1: {
			input0: 0n,
			input1: 0n,
			option: 0,
			output: 0n
		},
		Mux2: {
			input0: 0n,
			input1: 0n,
			option: 0,
			output: 0n
		},
		Mux3: {
			input0: 0n,
			input1: 0n,
			option: 0,
			output: 0n
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
