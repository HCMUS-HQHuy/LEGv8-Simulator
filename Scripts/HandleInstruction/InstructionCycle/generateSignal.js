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

import { Connections } from "../Compile/Define/Connections.js"
import {createNodeWithAnimation} from "./animation.js"
import {startSignalAnimation} from "./animation.js"
import {setTimestamp} from "./animation.js"
import { computeOutputs } from "./computationOutputs.js";
import { encodeLegv8Instruction } from "../Compile/parser.js";
import { DURATION_ANIMATION, DURATION_RESET_COLOR } from "./animationSpeed.js";
import { watchDataMemory } from "../Compile/memoryState.js";
import { watchRegisters } from "../Compile/memoryState.js";
import { watchFlags } from "../Compile/memoryState.js";
import { shapes } from "./shape.js";
import { state } from "./animationSpeed.js";
import { B_TYPE_OPCODES } from "../Compile/Define/Opcode.js"

function getValueFromComponents(source, components) {
	const [comp, field] = source.split('.');
	return components[comp]?.[field];
}

function setValueInComponents(target, value, components) {
	const [comp, field] = target.split('.');
	if (components[comp]) components[comp][field] = value;
}

export let pcSignalPromiseResolve = null

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
			setValueInComponents(target, value, components);

			const targetComponent = target.split('.')[0];
			triggerCount[targetComponent]++;			
			
            // These callbacks will be executed when the animation for the current `conn` (source -> target) ends.
			const originalCallbacks = signalCallbackTable[target] ? [...signalCallbackTable[target]] : [];

			if (triggerCount[targetComponent] === requiredTriggers[targetComponent]) {
				computeOutputs(targetComponent, components);
				queue.push({ node: targetComponent, depth: depth + 1 });
				originalCallbacks.push(() => {
                    const outgoingFromFiredComponent = Connections[targetComponent];
                    if (outgoingFromFiredComponent) {
                        outgoingFromFiredComponent.forEach(outConn => {
							// console.log(`[Callback] Priming signal animation for next step: ${targetComponent} -> ${outConn.target} (pathId: ${outConn.pathId || 'N/A'})`);
							startSignalAnimation(outConn.target); 
                        });
                    }
				});
			}

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
			} else if (currentNode == "InstructionMemory" || currentNode == "Mux1") {
				cloneValue = `0b${value}`;
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

function formatSignedBigInt(n, k) {
    const absStr = String(n < 0n ? -n : n).padStart(k - 1, '0');
    return (n < 0n ? '-' : '0') + absStr;
}

function resetComponents(Components) {
	state.currentStep = 0;
	const specialNode = ["InstructionMemory.ReadAddress", "Register.Read1", "ALU.input2", "DataMemory.address","Mux0.option"]
	for (const key of Object.keys(signalCallbackTable))
		if (signalCallbackTable.hasOwnProperty(key))
			signalCallbackTable[key] = [() => {
				if (specialNode.includes(key)) {
					state.currentStep = (specialNode.indexOf(key) + 1);
					if (state.stepByStepMode) {
						state.executing = false;
					}
				}
			}];
	
	for (let i = 0; i <= 3; i++) {
		signalCallbackTable[`Mux${i}.option`].push(
			() => {
				document.getElementById(`mux-${i}-${Components[`Mux${i}`].option}-selected`).style.visibility = "visible";
				document.getElementById(`mux-${i}-${Components[`Mux${i}`].option ^ 1}-selected`).style.visibility = "hidden";
			}
		);
	}
	
	signalCallbackTable[`DataMemory.address`].push(
		() => {
			document.getElementById('data-memory-address-value').textContent = formatSignedBigInt('0', 4);
			document.getElementById('data-read-data-value').textContent = formatSignedBigInt('0', 4);
			if (Components.DataMemory.writeEnable === 0) return;
			const index = BigInt(Components.DataMemory.address);
			const indexHex = `0x${(index * 8n).toString(16).toUpperCase().padStart(4, '0')}`;
			document.getElementById('data-memory-address-value').textContent = indexHex;
			document.getElementById('data-read-data-value').textContent = formatSignedBigInt(Components.DataMemory.Values[index], 4);
			
			const bigIntValue = Components.DataMemory.Values[index];
			let valueToDisplay;
			if (bigIntValue < 0n) {
				const mask16 = 0xFFFFn;
				valueToDisplay = (bigIntValue & mask16).toString(16).toUpperCase().padStart(4, '0');
			} else {
				valueToDisplay = bigIntValue.toString(16).toUpperCase().padStart(4, '0');
			}

			document.getElementById(indexHex).innerText = `0x${valueToDisplay}`;
			document.getElementById(`row-${indexHex}`).style.backgroundColor = "yellow";
			document.getElementById(`row-${indexHex}`).style.color = "red";
			setTimeout(() => {
				document.getElementById(`row-${indexHex}`).style.backgroundColor = "";
				document.getElementById(`row-${indexHex}`).style.color = "";
			}, DURATION_RESET_COLOR);
		}
	);
	
	signalCallbackTable[`DataMemory.WriteData`].push(
		() => { 
			const rawValue = Components.DataMemory.WriteData;
			const bigIntValue = typeof rawValue === 'bigint' ? rawValue : BigInt(rawValue);
			const formattedHex = `0x${bigIntValue.toString(16).toUpperCase().padStart(4, '0')}`
			document.getElementById('data-memory-write-data-value').textContent = formattedHex;
		}
	);

	const flag = JSON.parse(JSON.stringify(Components.ALU.Flags));

	signalCallbackTable[`ALU.input2`].push(
		() => {
			document.getElementById('add-2-output-value').textContent  = formatSignedBigInt(Components.ALU.output, 4);
			document.getElementById('add-2-input-2-value').textContent = formatSignedBigInt(Components.ALU.input2, 4);
			const flagNames = ['N', 'Z', 'V', 'C'];

			flagNames.forEach(flagName => {
				const element = document.getElementById(flagName);
				if (!element) {
					console.error(`Flag element with ID '${flagName}' not found.`);
					return; // Skip to the next flag if element is not found
				}
				document.getElementById(`add-2-${flagName}-value`).textContent = Components.ALU.Flags[flagName];
				if (Components.ALU.Flags[flagName] !== flag[flagName]) {
					element.innerText = Components.ALU.Flags[flagName];
					const parentRow = element.closest('tr');
					if (parentRow) {
						parentRow.style.backgroundColor = 'yellow';
						parentRow.style.color = 'red';
						setTimeout(() => {
							parentRow.style.backgroundColor = "";
							parentRow.style.color = "";
						}, DURATION_RESET_COLOR);
					}
				}
			});
		}
	);
	signalCallbackTable[`ALU.input1`].push(
		() => { document.getElementById('add-2-input-1-value').textContent = formatSignedBigInt(Components.ALU.input1, 4); }
	);
	
	const currentPC = Components.PC.value;
	signalCallbackTable[`Register.WriteData`].push(() => {
		const index = Components.Register.WriteReg;
		if (index === 31) {
			return;
		}
		if (Components.Register.option === 0) return;

		let indexHex = `X${index.toString().padStart(2, '0')}`;
		let rawValue = Components.Mux3.output;

		const opcode = Components.InstructionMemory.Opcode_31_21.substring(0, 6);
		if (Object.values(B_TYPE_OPCODES).includes(opcode) && opcode === '100101') {
			indexHex = 'X30';
			rawValue = currentPC;
		}

		// Safely assign BigInt (or convert if needed)
		const bigIntValue = BigInt(rawValue);
		Components.Register.registerValues[index] = bigIntValue;
		let valueToDisplay;
		if (bigIntValue < 0n) {
			const mask32 = 0xFFFFFFFFn;
			valueToDisplay = (bigIntValue & mask32).toString(16).toUpperCase().padStart(8, '0');
		} else {
			valueToDisplay = bigIntValue.toString(16).toUpperCase().padStart(8, '0');
		}

		const regElem = document.getElementById(indexHex);
		if (regElem) {
			regElem.innerText = `0x${valueToDisplay}`;
			regElem.style.backgroundColor = 'yellow';
			regElem.style.color = 'red';
			setTimeout(() => {
				regElem.style.backgroundColor = '';
				regElem.style.color = '';
			}, DURATION_RESET_COLOR);
		}

		const writeDataElem = document.getElementById(`register-WriteData-value`);
		if (writeDataElem) {
			writeDataElem.textContent = `0x${valueToDisplay.substring(4)}`;
		}
	});	
	new Set(['Read1', 'Read2', 'WriteReg']).forEach(val => {
		signalCallbackTable[`Register.${val}`].push(
			() => {
				document.getElementById(`register-${val}-value`).textContent = formatSignedBigInt(Components.Register[`${val}`], 4);
				if (val === 'Read2') {
					document.getElementById(`register-ReadData1-value`).textContent = formatSignedBigInt(Components.Register[`ReadData1`], 4);
					document.getElementById(`register-ReadData2-value`).textContent = formatSignedBigInt(Components.Register[`ReadData2`], 4);
				}
			}
		);
	})
	
	signalCallbackTable[`PC.value`].push(() => {
			document.getElementById(`pc-value-text`).textContent = `0x${(Components.PC.value).toString(16).padStart(4, '0').toUpperCase()}`;
			pcSignalPromiseResolve();
		});
	
	signalCallbackTable[`InstructionMemory.ReadAddress`].push(
		() => {
			document.getElementById(`instruction-memory-read-address-value`).textContent = `0x${(Components.InstructionMemory.ReadAddress).toString(16).padStart(2, '0').toUpperCase()}`;
			const InstructionMemory = Components.InstructionMemory;
			const encodedInstruction = InstructionMemory.instruction[((InstructionMemory.ReadAddress - Components.PC.offset) >> 2n)];
			document.getElementById(`instruction-memory-instruction-[31-0]-value`).textContent = `0x${parseInt(encodedInstruction, 2).toString(16).padStart(8, '0').toUpperCase()}`;
		}
	);
}

export function initialize(code, Components) {
	setTimestamp(new Date());
	if (Components == null) return;
	resetComponents(Components)
	watchDataMemory(Components.DataMemory);
	watchRegisters(Components.Register);
	watchFlags(Components.ALU);
	
	if (code != null) {
		Components.PC.value = Components.PC.offset;
		code.forEach(key => {
			const encodedInstruction = encodeLegv8Instruction(key.parsed, (key.instructionIndex - 1) << 2);
			if (encodedInstruction.error) console.error(encodedInstruction.error);
	
			Components.InstructionMemory.instruction.push(encodedInstruction);
			Components.InstructionMemory.instructionType.push(`${key.parsed.type}`);
		});
	}
	document.getElementById(`pc-value-text`).textContent = `0x${(Components.PC.value).toString(16).padStart(4, '0').toUpperCase()}`;
	return Components;
}

export async function start(Components) {
	if (((Components.PC.value - Components.PC.offset) >> 2n) > Components.InstructionMemory.instruction.length) {
		console.warn("In start pos = -1");
		return -1;
	}

	if (((Components.PC.value - Components.PC.offset) >> 2n) == Components.InstructionMemory.instruction.length) {
		return ((Components.PC.value - Components.PC.offset) >> 2n);
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
	return ((Components.PC.value - Components.PC.offset) >> 2n);
}