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

const arrayPath = [
	'sign-extend-to-shift-left-2-path',
	'shift-left-2-to-add-1-path',
	'sign-extend-to-mux-2-1-path',
	'shift-left-2-to-add-1-path',
	'ALU-add-1-to-mux-0-1-path',
	'ALU-add-0-to-mux-0-0-path'
];

const PCPath = [
	'pc-to-ALU-add-0-path',
	'const-4-to-ALU-add-0-path',
	'pc-to-ALU-add-1-path',
	'pc-to-instruction-memory-path',
	'mux-0-to-pc-path'
]

import { getComponents } from "../Compile/Define/components.js";
import { Connections } from "../Compile/Define/Connections.js"
import {createNodeWithAnimation} from "./animation.js"
import {startSignalAnimation} from "./animation.js"
import { computeOutputs } from "./computationOutputs.js";
import { encodeLegv8Instruction } from "../Compile/parser.js";
import { DURATION_ANIMATION } from "./animationSpeed.js";
import { watchDataMemory } from "../Compile/memoryState.js";
import { watchRegisters } from "../Compile/memoryState.js";
import { shapes } from "./shape.js";
import { state } from "./animationSpeed.js";

function getValueFromComponents(source, components) {
	const [comp, field] = source.split('.');
	return components[comp]?.[field];
}

function setValueInComponents(target, value, components) {
	const [comp, field] = target.split('.');
	if (components[comp]) components[comp][field] = value;
}

let pcSignalPromiseResolve = null

function traverseAndAnimateBFS(components) {
	// Initial queue setup as in the example
	const queue = [{ node: "PC", depth: 0 }];
	queue.push({node: "Const4", depth: 0});
	
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
			console.log(`Signal: ${source} -> ${target}, Value: ${value}`);
			setValueInComponents(target, value, components);

			const targetComponent = target.split('.')[0];
			triggerCount[targetComponent]++;			
			
            // These callbacks will be executed when the animation for the current `conn` (source -> target) ends.
			const originalCallbacks = signalCallbackTable[target] ? [...signalCallbackTable[target]] : [];

			if (triggerCount[targetComponent] === requiredTriggers[targetComponent]) {
				console.log(`Component ${targetComponent} has all required inputs. Computing outputs.`);
				computeOutputs(targetComponent, components);
				queue.push({ node: targetComponent, depth: depth + 1 });
				originalCallbacks.push(() => {
                    const outgoingFromFiredComponent = Connections[targetComponent];
                    if (outgoingFromFiredComponent) {
                        outgoingFromFiredComponent.forEach(outConn => {
							console.log(`[Callback] Priming signal animation for next step: ${targetComponent} -> ${outConn.target} (pathId: ${outConn.pathId || 'N/A'})`);
							startSignalAnimation(outConn.target); 
                        });
                    }
				});
			}

			console.log(`Creating animation for: ${source} -> ${target} (pathId: ${pathId})`);
			let cloneValue = value;
			if (arrayPath.includes(pathId)){
				const bigValue = BigInt(value); // Convert to BigInt
				const hexValue = (bigValue & 0xFFFFFFFFFFFFFFFFn) // Mask to 64 bits
					.toString(16)
					.toUpperCase()
					.padStart(16, '0');
				cloneValue = `0x${hexValue}`;
			}
			else if (PCPath.includes(pathId)){
				const bigValue = BigInt(value); // Convert to BigInt
				const hexValue = (bigValue & 0xFFFFFFFFFFFFFFFFn) // Mask to 64 bits
					.toString(16)
					.toUpperCase()
					.padStart(4, '0');
				cloneValue = `0x${hexValue}`;
			}

			createNodeWithAnimation({
				value: cloneValue,
				fieldName: `${target}`,
				onEndCallback: originalCallbacks,
				pathId: pathId,
				duration: DURATION_ANIMATION,
				className: shapes[target].className,
				shapeType: shapes[target].shapeType
			});
		});
	}
}

function resetComponents(Components) {
	for (const key in signalCallbackTable)
		if (signalCallbackTable.hasOwnProperty(key))
			signalCallbackTable[key] = [() => {
				if (state.stepByStepMode)
					state.executing = false;
			}];
	
	
	for (let i = 0; i <= 3; i++) {
		signalCallbackTable[`Mux${i}.option`].push(
			() => {
				document.getElementById(`mux-${i}-${Components[`Mux${i}`].option}-selected`).style.visibility = "visible";
				document.getElementById(`mux-${i}-${Components[`Mux${i}`].option ^ 1}-selected`).style.visibility = "hidden";
				// document.getElementById(`mux-${i}-value`).textContent = Components[`Mux${i}`].option;
			}
		);
	}
	
	new Set(['write', 'read']).forEach(val => {
		signalCallbackTable[`DataMemory.${val}Enable`].push(
			() => {
				// document.getElementById(`data-memory-${val}-enable-value`).textContent = Components.DataMemory[`${val}Enable`];
			}
		);
	})
	
	signalCallbackTable[`DataMemory.address`].push(
		() => {
			const index = Components.DataMemory.address;
			const indexHex = `0x${(index*8).toString(16).toUpperCase().padStart(4, '0')}`;
			document.getElementById('data-memory-address-value').textContent = indexHex;
			document.getElementById('data-read-data-value').textContent = Components.DataMemory.Values[index];
			if (Components.DataMemory.writeEnable === 0) return;
			document.getElementById(indexHex).innerText = `0x${Components.DataMemory.Values[index].toString(16).toUpperCase().padStart(4, '0')}`;
			document.getElementById(`row-${indexHex}`).style.backgroundColor = "yellow";
			document.getElementById(`row-${indexHex}`).style.color = "red";
			setTimeout(() => {
				document.getElementById(`row-${indexHex}`).style.backgroundColor = "";
				document.getElementById(`row-${indexHex}`).style.color = "";
			}, DURATION_ANIMATION);
		}
	);
	
	signalCallbackTable[`DataMemory.WriteData`].push(
		() => { document.getElementById('data-memory-write-data-value').textContent = Components.DataMemory.WriteData}
	);
	
	signalCallbackTable[`ALU.input2`].push(
		() => { document.getElementById('add-2-input-2-value').textContent = Components.ALU.input2; }
	);
	signalCallbackTable[`ALU.input1`].push(
		() => {
			document.getElementById('add-2-input-1-value').textContent = Components.ALU.input1; 
			document.getElementById('add-2-output-value').textContent = Components.ALU.output; 
		}
	);
	
	signalCallbackTable[`SignExtend.input`].push(
		() => {
			document.getElementById('sign-extend-input-value').textContent = Components.SignExtend.input.toString(2).padStart(8, '0');
			document.getElementById('sign-extend-output-value').textContent = Components.SignExtend.output; 
		}
	);
	
	signalCallbackTable['ShiftLeft2.input'].push(
		() => {
			document.getElementById('shift-left-2-input-value').textContent = Components.ShiftLeft2.input; 
			document.getElementById('shift-left-2-output-value').textContent = Components.ShiftLeft2.output; 
		}
	);
	
	signalCallbackTable[`Register.WriteData`].push(
		() => {
			const index = Components.Register.WriteReg;
			if (index == 31) {
				console.warn(`Modify XZR register`);
				return;
			}
			if (Components.Register.option === 0) return;
			const indexHex = `X${index.toString().padStart(2, '0')}`;
	
			const value = Components.Mux3.output;
			Components.Register.registerValues[index] = value;
			document.getElementById(indexHex).innerText = `0x${value.toString(16).toUpperCase().padStart(8, '0')}`;
			
			document.getElementById(`${indexHex}`).style.backgroundColor = "yellow";
			document.getElementById(`${indexHex}`).style.color = "red";
			setTimeout(() => {
				document.getElementById(`${indexHex}`).style.backgroundColor = "";
				document.getElementById(`${indexHex}`).style.color = "";
			}, DURATION_ANIMATION);
			document.getElementById(`register-WriteData-value`).textContent = `0x${value.toString(16).toUpperCase().padStart(2, '0')}`;
		}
	);
	
	new Set(['Read1', 'Read2', 'WriteReg']).forEach(val => {
		signalCallbackTable[`Register.${val}`].push(
			() => {
				document.getElementById(`register-${val}-value`).textContent = `${Components.Register[`${val}`]}`;
				if (val === 'Read2') {
					document.getElementById(`register-ReadData1-value`).textContent = `${Components.Register[`ReadData1`]}`;
					document.getElementById(`register-ReadData2-value`).textContent = `${Components.Register[`ReadData2`]}`;
				}
			}
		);
	})
	
	// signalCallbackTable[`Register.Read1`] = [
	// 	() => {document.getElementById(`alu-control-aluop-value`).textContent = Components.ALUControl.ALUOp;}
	// ]
	
	
	// signalCallbackTable[`ALUControl.ALUOp`].push(
	// 	() => {document.getElementById(`alu-control-aluop-value`).textContent = Components.ALUControl.ALUOp;}
	// );
	
	// signalCallbackTable[`ALU.option`].push(
	// 	() => {document.getElementById(`alu-option-value`).textContent = Components.ALU.option;}
	// );
	
	// signalCallbackTable[`Register.option`].push(
	// 	() => {document.getElementById(`register-option-value`).textContent = Components.Register.option;}
	// );

	for (let i = 1; i <= 2; i++) {
		signalCallbackTable[`AndGate.input${i}`].push(
			// () => {document.getElementById(`and-gate-input${i}-value`).textContent = Components.AndGate[`input${i}`];}
		);
		signalCallbackTable[`OrGate.input${i}`].push(
			// () => {document.getElementById(`or-gate-input${i}-value`).textContent = Components.OrGate[`input${i}`];}
		);
	}
	
	signalCallbackTable[`PC.value`].push(
		async () => {
			// document.getElementById(`pc-value-text`).textContent = `0x${(Components.PC.value).toString(16).toUpperCase()}`;
			pcSignalPromiseResolve();
		}
	);
	
	signalCallbackTable[`InstructionMemory.ReadAddress`].push(
		() => {
			document.getElementById(`instruction-memory-read-address-value`).textContent = `0x${(Components.InstructionMemory.ReadAddress).toString(16).padStart(2, '0').toUpperCase()}`;
			const InstructionMemory = Components.InstructionMemory;
			const encodedInstruction = InstructionMemory.instruction[InstructionMemory.ReadAddress >> 2];
			document.getElementById(`instruction-memory-instruction-[31-0]-value`).textContent = `0x${parseInt(encodedInstruction, 2).toString(16).padStart(8, '0').toUpperCase()}`;
		}
	);
}

export function initialize(code) {
	const Components = getComponents();
	resetComponents(Components)
	watchDataMemory(Components.DataMemory);
	watchRegisters(Components.Register);
	Components.PC.value = 0;
	
	code.forEach(key => {
		const encodedInstruction = encodeLegv8Instruction(key.parsed);
		Components.InstructionMemory.instruction.push(encodedInstruction);
		Components.InstructionMemory.instructionType.push(`${key.parsed.type}-type`);
		console.log(key.parsed.type);
	});
	
	return Components;
}

export async function start(Components, promise) {
	if ((Components.PC.value >> 2) >= Components.InstructionMemory.instruction.length) {
		promise(-1);
		return -1;
	}
	resetComponents(Components);
	traverseAndAnimateBFS(Components);
	startSignalAnimation("InstructionMemory.ReadAddress")
	startSignalAnimation("Add0.input1")
	startSignalAnimation("Add1.input1")
	startSignalAnimation("Add0.input2")
	
	await new Promise((promise) => {
		pcSignalPromiseResolve = promise;
	});
	promise(Components.PC.value >> 2);
}