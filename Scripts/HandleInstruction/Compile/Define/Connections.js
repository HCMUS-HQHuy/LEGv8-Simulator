
export const Connections = {
	PC: [
		{ source: 'PC.value', target: 'InstructionMemory.ReadAddress', pathId: 'pc-to-instruction-memory-path' },
		{ source: 'PC.value', target: 'Add0.input1', pathId: 'pc-to-ALU-add-0-path' },
		{ source: 'PC.value', target: 'Add1.input1', pathId: 'pc-to-ALU-add-1-path' }
	],
	Const4: [
		{ source: 'Const4.value', target: 'Add0.input2', pathId: 'const-4-to-ALU-add-0-path' }
	],
	Add0: [
		{ source: 'Add0.output', target: 'Mux0.input0', pathId: 'ALU-add-0-to-mux-0-0-path' }
	],
	Add1: [
		{ source: 'Add1.output', target: 'Mux0.input1', pathId: 'ALU-add-1-to-mux-0-1-path' }
	],
	InstructionMemory: [
		{ source: 'InstructionMemory.Opcode_31_21', target: 'Control.Input', pathId: 'instruction-memory-to-control-path' },
		{ source: 'InstructionMemory.Opcode_31_21', target: 'ALUControl.Opcode', pathId: 'instruction-memory-to-alu-control-path' },

		{ source: 'InstructionMemory.Rn_09_05', target: 'Register.Read1', pathId: 'instruction-memory-to-read-register-1-path' },
		{ source: 'InstructionMemory.RdRt_04_00', target: 'Register.WriteReg', pathId: 'instruction-memory-to-write-register-path' },

		{ source: 'InstructionMemory.RdRt_04_00', target: 'Mux1.input0', pathId: 'instruction-memory-to-mux-1-0-path' },
		{ source: 'InstructionMemory.Rm_20_16',   target: 'Mux1.input1', pathId: 'instruction-memory-to-mux-1-1-path' },
		
		{ source: 'InstructionMemory.SignExtend', target: 'SignExtend.input', pathId: 'instruction-memory-to-sign-extend-path', condition: 'I-type' },
	],
	SignExtend: [
		{ source: 'SignExtend.output', target: 'ShiftLeft2.input', pathId: 'sign-extend-to-shift-left-2-path' },
		{ source: 'SignExtend.output', target: 'Mux2.input1', pathId: 'sign-extend-to-mux-2-1-path' }
	],
	ShiftLeft2: [
		{ source: 'ShiftLeft2.output', target: 'Add1.input2', pathId: 'shift-left-2-to-add-1-path' }
	],
	Register: [
		{ source: 'Register.ReadData2', target: 'Mux2.input0', pathId: 'register-to-mux-2-0-path' },
		{ source: 'Register.ReadData1', target: 'ALU.input2', pathId: 'register-to-ALU-add-2-path' },
		{ source: 'Register.ReadData2', target: 'DataMemory.WriteData', pathId: 'register-to-data-memory-path' }
	],
	ALU: [
		{ source: 'ALU.output', target: 'DataMemory.address', pathId: 'ALU-add-2-to-data-memory-path' },
		{ source: 'ALU.output', target: 'Mux3.input0', pathId: 'ALU-add-2-to-mux-3-0-path' },
		{ source: 'ALU.zero',   target: 'AndGate.input2', pathId: 'ALU-add-2-zero-path' }
	],
	Mux3: [
		{ source: 'Mux3.output', target: 'Register.WriteData', pathId: 'mux-3-to-register-path' }
	],
	Mux2: [
		{ source: 'Mux2.output', target: 'ALU.input1', pathId: 'mux-2-to-ALU-add-2-path' }
	],
	Mux1: [
		{ source: 'Mux1.output', target: 'Register.Read2', pathId: 'mux-1-to-register-path' }
	],
	Mux0: [
		{ source: 'Mux0.output', target: 'PC.value', pathId: 'mux-0-to-pc-path' }
	],
	DataMemory: [
		{ source: 'DataMemory.ReadData', target: 'Mux3.input1', pathId: 'data-memory-to-mux-3-1-path' }
	],
	Control: [
		{ source: 'Control.Reg2Loc',      target: 'Mux1.option', pathId: 'control-reg2loc-path' },
		{ source: 'Control.UncondBranch', target: 'OrGate.input1', pathId: 'control-uncondbranch-path' },
		{ source: 'Control.Branch',       target: 'AndGate.input1', pathId: 'control-branch-path' },
		{ source: 'Control.MemRead',      target: 'DataMemory.readEnable', pathId: 'control-memread-path' },
		{ source: 'Control.MemtoReg',     target: 'Mux3.option', pathId: 'control-memtoreg-path' },
		{ source: 'Control.ALUOp',        target: 'ALUControl.ALUOp', pathId: 'control-aluop-path' },
		{ source: 'Control.MemWrite',     target: 'DataMemory.writeEnable', pathId: 'control-memwrite-path' },
		{ source: 'Control.ALUSrc',       target: 'Mux2.option', pathId: 'control-alusrc-path' },
		{ source: 'Control.RegWrite',     target: 'Register.option', pathId: 'control-regwrite-path' }
	],

	ALUControl: [
		{ source: 'ALUControl.output', target: 'ALU.option', pathId: 'ALU-control-to-ALU-2-path' }
	],

	AndGate: [
		{ source: 'AndGate.output', target: 'OrGate.input2', pathId: 'AND-gate-to-OR-gate-path' }
	],

	OrGate: [
		{ source: 'OrGate.output', target: 'Mux0.option', pathId: 'OR-gate-to-mux-0-1-path' }
	]
};