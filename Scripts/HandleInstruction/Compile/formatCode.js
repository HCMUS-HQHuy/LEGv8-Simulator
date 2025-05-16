import {parseLegv8Instruction, buildLabelTable} from "./parser.js"


export function getResult() {
    const instructionTextarea = document.getElementById('instructionCode');
    if (!instructionTextarea) {
        console.error("Textarea with ID 'instructionCode' not found.");
        // Return an array with a single error object for consistency,
        // so logParsingResults can handle it.
        return [{
            lineNumber: 0, // Or some other indicator for a global error
            assemblyInstruction: "Error finding code input area.",
            parsed: { error: "Could not find instruction input textarea." }
        }];
    }
    const codeLines = instructionTextarea.value.split(/\r?\n/);

    const labelTable = buildLabelTable(codeLines);
    const results = []; // This array will be returned

    for (let i = 0; i < codeLines.length; i++) {
        const originalLineNumber = i + 1;
        const rawLineContent = codeLines[i]; // Keep for original context, especially for errors
        const trimmedLine = rawLineContent.replace(/(\/\/|;).*/, '').trim();

        // Skip empty lines or lines that are only comments
        if (!trimmedLine) {
            continue;
        }

        // Check for label definitions
        const labelMatch = trimmedLine.match(/^([a-zA-Z_][a-zA-Z0-9_]*):(.*)$/);
        let instructionPart = trimmedLine;
        let labelName = null;
        let isLabelDefinitionOnly = false;

        if (labelMatch) {
            labelName = labelMatch[1];
            instructionPart = labelMatch[2].trim(); // Get the part after the label
            if (!instructionPart) {
                isLabelDefinitionOnly = true;
            }
        }

        if (isLabelDefinitionOnly) {
            // It's just a label definition on this line.
            // Optionally, add it to results if you want to log label definitions.
            // results.push({
            //     lineNumber: originalLineNumber,
            //     assemblyInstruction: rawLineContent.trim(), // Show the original label line
            //     parsed: {
            //         type: 'LABEL_DEF',
            //         label: labelName,
            //         error: null
            //     }
            // });
            continue; // Move to the next line
        }

        // If we've reached here, 'instructionPart' should be an actual instruction to parse.
        const parsedInstruction = parseLegv8Instruction(instructionPart, labelTable);

        if (!parsedInstruction || parsedInstruction.error || (parsedInstruction.type === 'UNKNOWN' && parsedInstruction.mnemonic)) {
            // --- MODIFICATION HERE ---
            // Instead of just console.error and returning null,
            // add an error object to the results array.
            const errorMessage = parsedInstruction?.error || `Parser returned null or unknown mnemonic for: '${instructionPart.split(/\s+/)[0]}'`;
            console.error(`Error parsing line ${originalLineNumber} ("${rawLineContent.trim()}"): ${errorMessage}`); // Keep console.error for dev
            
            results.push({
                lineNumber: originalLineNumber,
                assemblyInstruction: rawLineContent.trim(), // Use the raw line for better error context
                parsed: {
                    error: errorMessage,
                    // Optionally include the attempted mnemonic if available
                    mnemonic: parsedInstruction?.mnemonic || instructionPart.split(/\s+/)[0]
                }
            });
            // Continue to the next line to parse other instructions,
            // rather than stopping the whole process.
            // If you wanted to stop on the first error, you would return `results` here or `null`.
            continue; 
        }

        // Successfully parsed instruction (and it's not just a label definition)
        // The check 'parsedInstruction.type !== 'LABEL_DEF'' might be redundant if 'isLabelDefinitionOnly' is handled correctly
        if (parsedInstruction.type !== 'LABEL_DEF') {
             results.push({
                lineNumber: originalLineNumber,
                assemblyInstruction: instructionPart, // The part that was actually parsed as an instruction
                parsed: parsedInstruction
            });
        }
    }

    return results; // Return all results, including errors and successful parses
}