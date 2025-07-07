import {parseLegv8Instruction, buildLabelTable} from "./parser.js"

export function getResult() {
    const instructionTextarea = document.getElementById('instructionCode');

    if (!instructionTextarea) {
        console.error("Required elements 'instructionCode' or 'formattedCodeContainer' not found.");
        return [{ error: "UI elements for code processing are missing." }];
    }
    
    const codeLines = instructionTextarea.value.split(/\r?\n/);
    const labelTable = buildLabelTable(codeLines);
    
    const parsedResults = []; // Lưu trữ các lệnh đã parse thành công
    let formattedCodeHTML = ''; // Chuỗi HTML để hiển thị code đã format
    let effectiveLineCounter = 1; // Bắt đầu đếm từ dòng 1
    let lineHTML = '';

    for (let i = 0; i < codeLines.length; i++) {
        const rawLineContent = codeLines[i];
        let cleanedLine = rawLineContent.replace(/(\/\/|;).*/, '').trim();
        if (!cleanedLine) {
            continue;
        }

        // Tách nhãn và lệnh
        const labelMatch = cleanedLine.match(/^([a-zA-Z_][a-zA-Z0-9_]*):(.*)$/);
        let instructionPart = cleanedLine;
        let labelName = null;

        if (labelMatch) {
            labelName = labelMatch[1];
            instructionPart = labelMatch[2].trim();
        }

        // Thêm nhãn nếu có
        if (labelName) {
            lineHTML += `${labelName}: `;
        }
        if (instructionPart) {
            const parsedInstruction = parseLegv8Instruction(instructionPart, labelTable);

            if (!parsedInstruction || parsedInstruction.error) {
                lineHTML += `${instructionPart}`;
                return `Error parsing line ${i + 1}: ${parsedInstruction?.error || 'Unknown error'}`;
            } else {
                const mnemonic = parsedInstruction.mnemonic.toUpperCase();
                const ops = parsedInstruction.operands.join(', ');
                const formattedInstruction = `${mnemonic} ${ops}`;
                
                lineHTML += formattedInstruction;

                parsedResults.push({
                    lineNumber: effectiveLineCounter,
                    assemblyInstruction: `${mnemonic} ${ops}`,
                    parsed: parsedInstruction
                });
            }
            if (!labelName) {
                lineHTML = `${lineHTML}`;
            }
            effectiveLineCounter++;
            formattedCodeHTML += lineHTML + '\n';
            lineHTML = '';
        }
    }
    instructionTextarea.value = formattedCodeHTML + lineHTML;
    return parsedResults;
}