import {parseLegv8Instruction, buildLabelTable} from "./parser.js"

export function getResult() {
    const instructionTextarea = document.getElementById('instructionCode');

    if (!instructionTextarea) {
        console.error("Required elements 'instructionCode' or 'formattedCodeContainer' not found.");
        return [{ error: "UI elements for code processing are missing." }];
    }
    
    const codeLines = instructionTextarea.value.split(/\r?\n/);
    const labelTable = buildLabelTable(codeLines);
    const offset = (Object.keys(labelTable).length > 0 ? '\t' : '');

    const parsedResults = []; // Lưu trữ các lệnh đã parse thành công
    let formattedCodeHTML = ''; // Chuỗi HTML để hiển thị code đã format
    let effectiveLineCounter = 1; // Bắt đầu đếm từ dòng 1
    let currentLineIndex = 1;
    let lineHTML = '';

    for (const rawLineContent of codeLines) {
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
            formattedCodeHTML += `${labelName}:\n`;
            currentLineIndex++;
        }
        if (instructionPart) {
            const parsedInstruction = parseLegv8Instruction(instructionPart, labelTable);
            console.log(parsedInstruction);
            if (!parsedInstruction || parsedInstruction.error) {
                lineHTML += `${instructionPart}`;
                return `Error parsing line ${i + 1}: ${parsedInstruction?.error || 'Unknown error'}`;
            } else {                
                lineHTML += parsedInstruction.instruction;

                parsedResults.push({
                    lineNumber: currentLineIndex,
                    instructionIndex: effectiveLineCounter,
                    parsed: parsedInstruction
                });
            }
            lineHTML = `${offset}${lineHTML}`;
            effectiveLineCounter++;
            currentLineIndex++;
            formattedCodeHTML += lineHTML + '\n';
            lineHTML = '';
        }
    }
    instructionTextarea.value = formattedCodeHTML + lineHTML;
    return parsedResults;
}