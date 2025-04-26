
const Connections = {
	PC: [
		{ source: 'PC.NewValue', target: 'InstructionMemory.ReadAddress', pathId: 'pc-to-instruction-memory-path' },
		{ source: 'PC.NewValue', target: 'Add0.input1', pathId: 'pc-to-ALU-add-0-path' },
		{ source: 'PC.NewValue', target: 'Add1.input1', pathId: 'pc-to-ALU-add-1-path' }
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
		{ source: 'ALU.zero',   target: 'AndGate.input2', pathId: 'ALU-add-2-zero-path' }
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
		{ source: 'Mux0.output', target: 'PC.NewValue', pathId: 'mux-0-to-pc-path' }
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

const requiredTriggers = {
	PC: 0,
	Const4: 0,
	InstructionMemory: 1,
	Register: 4,
	DataMemory: 3,
	Add0: 2,
	Add1: 2,
	ALU: 3,
	Control: 1,
	ShiftLeft2: 1,
	SignExtend: 1,
	ALUControl: 2,
	Mux0: 3,
	Mux1: 3,
	Mux2: 3,
	Mux3: 3,
	AndGate: 2,
	OrGate: 2
};

const shapes = {
	PC: {
		className: 'data-node',
		shapeType: 'rect'
	},
	Const4: {
		className: 'data-node',
		shapeType: 'rect'
	},
	InstructionMemory: {
		className: 'parsed-node',
		shapeType: 'rect'
	},
	Register: {
		className: 'parsed-node',
		shapeType: 'rect'
	},
	DataMemory: {
		className: 'parsed-node',
		shapeType: 'rect'
	},
	Add0: {
		className: 'parsed-node',
		shapeType: 'rect'
	},
	Add1: {
		className: 'parsed-node',
		shapeType: 'rect'
	},
	ALU: {
		className: 'parsed-node',
		shapeType: 'rect'
	},
	Control: {
		className: 'signal-control-unit',
		shapeType: 'circle'
	},
	ShiftLeft2: {
		className: 'parsed-node',
		shapeType: 'rect'
	},
	SignExtend: {
		className: 'parsed-node',
		shapeType: 'rect'
	},
	ALUControl: {
		className: 'parsed-node',
		shapeType: 'rect'
	},
	Mux0: {
		className: 'parsed-node',
		shapeType: 'rect'
	},
	Mux1: {
		className: 'parsed-node',
		shapeType: 'rect'
	},
	Mux2: {
		className: 'parsed-node',
		shapeType: 'rect'
	},
	Mux3: {
		className: 'parsed-node',
		shapeType: 'rect'
	},
	AndGate: {
		className: 'parsed-node',
		shapeType: 'rect'
	},
	OrGate: {
		className: 'parsed-node',
		shapeType: 'rect'
	}
};

const signalCallbackTable = {
	"InstructionMemory.ReadAddress": null,
	"Add0.input1": null,
	"Add1.input1": null,
	"Add0.input2": null,
	"Control.Input": null,
	"ALUControl.Opcode": null,
	"Register.Read1": null,
	"Register.WriteReg": null,
	"Mux1.input0": null,
	"Mux1.input1": null,
	"SignExtend.input": null,
	"Mux0.input0": null,
	"Mux1.option": null,
	"OrGate.input1": null,
	"AndGate.input1": null,
	"DataMemory.readEnable": null,
	"Mux3.option": null,
	"ALUControl.ALUOp": null,
	"DataMemory.writeEnable": null,
	"Mux2.option": null,
	"Register.option": null,
	"ShiftLeft2.input": null,
	"Mux2.input1": null,
	"Register.read2": null,
	"ALU.option": null,
	"Add1.input2": null,
	"Mux2.input0": null,
	"ALU.input2": null,
	"DataMemory.WriteData": null,
	"Mux0.input1": null,
	"Mux0.option": null,
	"ALU.input1": null,
	"Mux3.input1": null,
	"DataMemory.address": null,
	"Mux3.input0": null,
	"AndGate.input2": null,
	"Register.WriteData": null,
	"OrGate.input2": null,
	"PC.NewValue": null
};
  

import {createNodeWithAnimation} from "./animation.js"
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

function traverseAndAnimateBFS(startNode, components) {
	const queue = [{ node: startNode, depth: 0 }, {node: "Const4", depth: 0}];
	const triggerCount = {};
	Object.keys(requiredTriggers).forEach(key => {
		triggerCount[key] = 0;
	});

	while (queue.length > 0) {
		const { node: currentNode, depth } = queue.shift();

		const connections = Connections[currentNode];
		if (!connections) continue;
		
		connections.forEach(conn => {
			const { source, target, pathId } = conn;

			const value = getValueFromComponents(source, components);
			setValueInComponents(target, value, components);

			const targetComponent = target.split('.')[0];
			triggerCount[targetComponent]++;
			if (triggerCount[targetComponent] === requiredTriggers[targetComponent]) {
				queue.push({ node: targetComponent, depth: depth + 1 });
			}

			// console.log(`from: ${source} to : ${target}`);
			// console.log(`target : ${targetComponent} -> cnt: ${triggerCount[targetComponent]}`);
			console.log(`target : ${target}`);
			// if (signalCallbackTable[`${target}`])
			// 	console.warn(`onEndCallBack: ${signalCallbackTable[`${target}`]}`);

			dataSignalNodesGroup[depth].appendChild(createNodeWithAnimation({
				value: value,
				// fieldName: `${source}-to-${target}`,
				fieldName: `${target}`,
				onEndCallback: signalCallbackTable[`${target}`],
				pathId: pathId,
				duration: 2,
				className: shapes[currentNode].className,
				shapeType: shapes[currentNode].shapeType
			}));
		});
	}
}

export function trigger(components) {
	for (let i = 0; i <= 3; i++) {
		signalCallbackTable[`Mux${i}.option`] = [
			() => {
				document.getElementById(`mux-${i}-${components.Mux1.option}-selected`).style.visibility = "visible";
				document.getElementById(`mux-${i}-${components.Mux1.option ^ 1}-selected`).style.visibility = "hidden";
				document.getElementById(`mux-${i}-value`).textContent = components.Mux1.option;
			}
		];
	}

	new Set(['write', 'read']).forEach(val => {
		signalCallbackTable[`DataMemory.${val}Enable`] = [
			() => {
				document.getElementById(`data-memory-${val}-enable-value`).textContent = components.DataMemory[`${val}Enable`];
			}
		];
	})

	signalCallbackTable[`ALUControl.ALUOp`] = [
		() => {document.getElementById(`alu-control-aluop-value`).textContent = components.ALUControl.ALUOp;}
	];

	signalCallbackTable[`ALU.option`] = [
		() => {document.getElementById(`alu-option-value`).textContent = components.ALU.option;}
	];

	signalCallbackTable[`Register.option`] = [
		() => {document.getElementById(`register-option-value`).textContent = components.Register.option;}
	];

	for (let i = 1; i <= 2; i++) {
		signalCallbackTable[`AndGate.input${i}`] = [
			() => {document.getElementById(`and-gate-input${i}-value`).textContent = components.AndGate[`input${i}`];}
		];
		signalCallbackTable[`OrGate.input${i}`] = [
			() => {document.getElementById(`or-gate-input${i}-value`).textContent = components.OrGate[`input${i}`];}
		];
	}

	traverseAndAnimateBFS("PC", components);
}