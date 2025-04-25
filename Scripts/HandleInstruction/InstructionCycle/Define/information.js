const Components = {
	PC: {
		OldValue: 0,
		Newvalue: 15
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
		input0: 0,
		input1: 0,
		output: 0
	},
	OrGate: {
		input0: 0,
		input1: 0,
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


const Connections = {
	PC: [
		{ source: 'PC.Newvalue', target: 'InstructionMemory.ReadAddress', pathId: 'pc-to-instruction-memory-path' },
		{ source: 'PC.Newvalue', target: 'Add0.input1', pathId: 'pc-to-ALU-add-0-path' },
		{ source: 'PC.Newvalue', target: 'Add1.input1', pathId: 'pc-to-ALU-add-1-path' }
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

		// Immediate types
		{ source: 'InstructionMemory.Imm12_21_10', target: 'SignExtend.input', pathId: 'instruction-memory-to-sign-extend-path', condition: 'I-type' },
		{ source: 'InstructionMemory.Imm9_20_12',  target: 'SignExtend.input', pathId: 'instruction-memory-to-sign-extend-path', condition: 'D-type' },
		{ source: 'InstructionMemory.Imm19_23_5',  target: 'SignExtend.input', pathId: 'instruction-memory-to-sign-extend-path', condition: 'CB-type' },
		{ source: 'InstructionMemory.Imm26_25_0',  target: 'SignExtend.input', pathId: 'instruction-memory-to-sign-extend-path', condition: 'B-type' }
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
		{ source: 'ALU.zero',   target: 'AndGate.input1', pathId: 'ALU-add-2-zero-path' }
	],

	Mux3: [
		{ source: 'Mux3.output', target: 'Register.WriteData', pathId: 'mux-3-to-register-path' }
	],

	Mux2: [
		{ source: 'Mux2.output', target: 'ALU.input1', pathId: 'mux-2-to-ALU-add-2-path' }
	],

	Mux1: [
		{ source: 'Mux1.output', target: 'Register.read2', pathId: 'mux-1-to-register-path' }
	],

	Mux0: [
		{ source: 'Mux0.output', target: 'PC.Newvalue', pathId: 'mux-0-to-pc-path' }
	],

	DataMemory: [
		{ source: 'DataMemory.ReadData', target: 'Mux3.input1', pathId: 'data-memory-to-mux-3-1-path' }
	],

	Control: [
		{ source: 'Control.Reg2Loc',      target: 'Mux0.option', pathId: 'control-reg2loc-path' },
		{ source: 'Control.UncondBranch', target: 'OrGate.input1', pathId: 'control-uncondbranch-path' },
		{ source: 'Control.Branch',       target: 'AndGate.input0', pathId: 'control-branch-path' },
		{ source: 'Control.MemRead',      target: 'DataMemory.readEnable', pathId: 'control-memread-path' },
		{ source: 'Control.MemtoReg',     target: 'Mux3.option', pathId: 'control-memtoreg-path' },
		{ source: 'Control.ALUOp',        target: 'ALUControl.ALUOp', pathId: 'control-aluop-path' },
		{ source: 'Control.MemWrite',     target: 'DataMemory.writeEnable', pathId: 'control-memwrite-path' },
		{ source: 'Control.ALUSrc',       target: 'Mux2.option', pathId: 'control-alusrc-path' },
		{ source: 'Control.RegWrite',     target: 'Register.writeEnable', pathId: 'control-regwrite-path' }
	],

	ALUControl: [
		{ source: 'ALUControl.output', target: 'ALU.option', pathId: 'ALU-control-to-ALU-2-path' }
	],

	ANDGate: [
		{ source: 'AndGate.output', target: 'OrGate.input0', pathId: 'AND-gate-to-OR-gate-path' }
	],

	ORGate: [
		{ source: 'OrGate.output', target: 'Mux0.input1', pathId: 'OR-gate-to-mux-0-1-path' }
	]
};


import {createNodeWithAnimation} from "../animation.js"
const dataSignalNodesGroup = [
	document.getElementById('data-signal-nodes0'),
	document.getElementById('data-signal-nodes1'),
	document.getElementById('data-signal-nodes2'),
	document.getElementById('data-signal-nodes3'),
	document.getElementById('data-signal-nodes4'),
	document.getElementById('data-signal-nodes5'),
	document.getElementById('data-signal-nodes6'),
	document.getElementById('data-signal-nodes7'),
	document.getElementById('data-signal-nodes8'),
	document.getElementById('data-signal-nodes9')
];

function getValueFromComponents(source, components) {
	const [comp, field] = source.split('.');
	return components[comp]?.[field];
}

function setValueInComponents(target, value, components) {
	const [comp, field] = target.split('.');
	if (components[comp]) components[comp][field] = value;
}

function traverseAndAnimateBFS(startNode) {
	const visited = new Set();
	const queue = [{ node: startNode, depth: 0 }];
	while (queue.length > 0) {
		const { node: currentNode, depth } = queue.shift();
		if (visited.has(currentNode)) continue;
		visited.add(currentNode);

		const connections = Connections[currentNode];
		if (!connections) continue;
		console.log(`${depth}: currentNode ${currentNode}`);

		// First process all current connections (same level)
		connections.forEach(conn => {
			const { source, target, pathId } = conn;

			const value = getValueFromComponents(source, Components);
			setValueInComponents(target, value, Components);

			dataSignalNodesGroup[depth].appendChild(createNodeWithAnimation({
				value: value,
				fieldName: `${source}-to-${target}`,
				onEndCallback: null,
				pathId: pathId,
				duration: 2,
				className: 'parsed-node',
				shapeType: 'rect'
			}));
		});

		// Then enqueue target components for the next level
		connections.forEach(conn => {
			const targetComponent = conn.target.split('.')[0];
			if (!visited.has(targetComponent)) {
				queue.push({ node: targetComponent, depth: depth + 1 });
			}
		});
	}
}

export function run() {
	traverseAndAnimateBFS("PC");
}