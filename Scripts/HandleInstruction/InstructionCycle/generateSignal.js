const requiredTriggers = {
	PC: 0,
	Const4: 0,
	InstructionMemory: 1,
	Register: 4,
	DataMemory: 4,
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
	"Register.Read2": null,
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
	"PC.value": null
};
  
import { getComponents } from "../Compile/Define/components.js";
import { Connections } from "../Compile/Define/Connections.js"
import {createNodeWithAnimation} from "./animation.js"
import { computeOutputs } from "./computationOutputs.js";
import { encodeLegv8Instruction } from "../Compile/parser.js";

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

			// console.log(`source: ${source} -> ${target} value: ${value}`);

			setValueInComponents(target, value, components);

			const targetComponent = target.split('.')[0];
			triggerCount[targetComponent]++;
			if (triggerCount[targetComponent] === requiredTriggers[targetComponent]) {
				computeOutputs(targetComponent, components);
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
				duration: 1,
				className: shapes[currentNode].className,
				shapeType: shapes[currentNode].shapeType
			}));
		});
	}
}

export function initialize(code) {
	const Components = getComponents();
	for (let i = 0; i <= 3; i++) {
		signalCallbackTable[`Mux${i}.option`] = [
			() => {
				document.getElementById(`mux-${i}-${Components.Mux1.option}-selected`).style.visibility = "visible";
				document.getElementById(`mux-${i}-${Components.Mux1.option ^ 1}-selected`).style.visibility = "hidden";
				document.getElementById(`mux-${i}-value`).textContent = Components.Mux1.option;
			}
		];
	}

	new Set(['write', 'read']).forEach(val => {
		signalCallbackTable[`DataMemory.${val}Enable`] = [
			() => {
				document.getElementById(`data-memory-${val}-enable-value`).textContent = Components.DataMemory[`${val}Enable`];
			}
		];
	})

	signalCallbackTable[`ALUControl.ALUOp`] = [
		() => {document.getElementById(`alu-control-aluop-value`).textContent = Components.ALUControl.ALUOp;}
	];

	signalCallbackTable[`ALU.option`] = [
		() => {document.getElementById(`alu-option-value`).textContent = Components.ALU.option;}
	];

	signalCallbackTable[`Register.option`] = [
		() => {document.getElementById(`register-option-value`).textContent = Components.Register.option;}
	];

	for (let i = 1; i <= 2; i++) {
		signalCallbackTable[`AndGate.input${i}`] = [
			() => {document.getElementById(`and-gate-input${i}-value`).textContent = Components.AndGate[`input${i}`];}
		];
		signalCallbackTable[`OrGate.input${i}`] = [
			() => {document.getElementById(`or-gate-input${i}-value`).textContent = Components.OrGate[`input${i}`];}
		];
	}

	signalCallbackTable[`PC.value`] = [
		() => {document.getElementById(`pc-value-text`).textContent = `0x${(Components.PC.value).toString(16).toUpperCase()}`;}
	];

	Components.PC.value = 0;
	
	code.forEach(key => {
		const encodedInstruction = encodeLegv8Instruction(key.parsed);
		Components.InstructionMemory.instruction.push(encodedInstruction);
	});
	
	return Components;
}

export function start(Components) {
	if (Components.PC.value >= Components.InstructionMemory.instruction.length * 4) {
		return -1;
	}
	traverseAndAnimateBFS("PC", Components);
	return Components.InstructionMemory.ReadAddress;
}