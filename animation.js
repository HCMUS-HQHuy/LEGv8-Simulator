

/**
 * Quét qua tất cả các dòng code để xây dựng một bảng ánh xạ từ nhãn sang địa chỉ.
 * @param {string[]} codeLines - Mảng các dòng code assembly.
 * @param {number} startAddress - Địa chỉ bắt đầu của lệnh đầu tiên (thường là 0).
 * @param {number} instructionSize - Kích thước của mỗi lệnh (thường là 4 byte).
 * @returns {object} - Một đối tượng (bảng băm) với key là tên nhãn và value là địa chỉ.
 */
function buildLabelTable(codeLines, startAddress = 0, instructionSize = 4) {
  const labelTable = {};
  let currentAddress = startAddress;
  let actualInstructionCount = 0; // Đếm số lệnh thực tế để tính địa chỉ

  for (let i = 0; i < codeLines.length; i++) {
      let line = codeLines[i].replace(/(\/\/|;).*/, '').trim(); // Xóa comment, trim

      if (!line) {
          continue; // Bỏ qua dòng trống
      }

      // Kiểm tra xem dòng có chứa định nghĩa nhãn không (ví dụ: "MyLabel:")
      const labelMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):(.*)$/);

      if (labelMatch) {
          const labelName = labelMatch[1];
          const restOfLine = labelMatch[2].trim();

          if (labelTable.hasOwnProperty(labelName)) {
              // Có thể cảnh báo hoặc báo lỗi nếu nhãn bị định nghĩa lại
              console.warn(`Warning: Label "${labelName}" redefined at line ${i + 1}.`);
          }
          // Nhãn trỏ đến địa chỉ của lệnh *tiếp theo* (nếu có) hoặc lệnh trên cùng dòng
          labelTable[labelName] = currentAddress;

          if (restOfLine) { // Nếu có lệnh trên cùng dòng với nhãn
              line = restOfLine; // Xử lý phần còn lại như một lệnh
          } else {
              continue; // Nếu chỉ có nhãn, chuyển sang dòng tiếp theo
          }
      }

      // Nếu dòng (hoặc phần còn lại của dòng sau nhãn) không trống,
      // thì nó được coi là một lệnh và tăng địa chỉ.
      // Chúng ta cần một cách sơ bộ để biết nó có phải là lệnh không,
      // có thể dựa vào việc nó không phải là một định nghĩa nhãn khác.
      // Hoặc, tốt hơn là, chỉ tăng currentAddress nếu dòng đó thực sự là một lệnh.
      // Điều này hơi khó nếu không parse sâu, tạm thời giả định dòng không rỗng sau khi xử lý nhãn là lệnh.
      if (line) {
          currentAddress += instructionSize;
          actualInstructionCount++;
      }
  }
  // console.log("Label Table:", labelTable);
  return labelTable;
}



function parseLegv8Instruction(line, labelTable = {}) { // Thêm labelTable làm tham số tùy chọn
  if (!line) {
      return null;
  }

  // 1. Remove comments and trim whitespace
  let cleanedLine = line.replace(/(\/\/|;).*/, '').trim();

  // --- BỎ QUA NẾU DÒNG LÀ ĐỊNH NGHĨA NHÃN ---
  // Nếu một dòng chứa nhãn VÀ lệnh, hàm buildLabelTable đã xử lý phần nhãn
  // và cleanedLine ở đây sẽ là phần lệnh còn lại.
  // Nếu dòng CHỈ là nhãn, buildLabelTable đã continue, hoặc dòng này sẽ trông như "LabelName:"
  // Ta cần đảm bảo không parse "LabelName:" như một mnemonic.
  // Một cách đơn giản là nếu cleanedLine kết thúc bằng ':' và không có gì khác, coi như chỉ là nhãn.
  // Tuy nhiên, việc tiền xử lý loại bỏ dòng chỉ chứa nhãn sẽ tốt hơn.
  // Giả định rằng dòng truyền vào đây ĐÃ được xác định là một lệnh tiềm năng.
  const labelDefinitionMatch = cleanedLine.match(/^([a-zA-Z_][a-zA-Z0-9_]*):$/);
  if (labelDefinitionMatch && cleanedLine.endsWith(':') && cleanedLine.indexOf(' ') === -1) {
      // console.log(`Skipping label-only line: ${cleanedLine}`);
      return { type: 'LABEL_DEF', label: labelDefinitionMatch[1], error: null }; // Trả về thông tin nhãn nếu muốn
  }
  // Hoặc nếu dòng đã được tiền xử lý, cleanedLine sẽ không còn nhãn đứng một mình.
  // Nếu có lệnh trên cùng dòng với nhãn, cleanedLine sẽ là phần lệnh đó.

  if (!cleanedLine) {
      return null;
  }

  // 2. Split into mnemonic and the rest
  const parts = cleanedLine.split(/\s+/);
  let mnemonic = parts[0].toUpperCase();
  const operandString = parts.slice(1).join(' ');

  // Xử lý trường hợp nhãn đứng trước lệnh trên cùng dòng, ví dụ "Else: ADDI..."
  // Hàm buildLabelTable đã lấy nhãn, ở đây ta cần đảm bảo mnemonic là "ADDI" chứ không phải "Else:".
  if (mnemonic.includes(':')) {
      const splitByColon = mnemonic.split(':');
      // labelName = splitByColon[0]; // Nhãn này đã được xử lý ở buildLabelTable
      mnemonic = splitByColon[1]?.toUpperCase(); // Lấy mnemonic sau dấu :
      if (!mnemonic) { // Nếu chỉ có "Label:" và không có lệnh theo sau trên dòng
          return { type: 'LABEL_DEF', label: splitByColon[0], error: null };
      }
  }


  const result = {
      instruction: cleanedLine, // Lưu lại dòng lệnh gốc đã clean
      mnemonic: mnemonic,
      operands: [],
      type: 'UNKNOWN',
      structuredOperands: null,
      error: null,
      targetAddress: null // Thêm trường này để lưu địa chỉ đích nếu là branch/jump
  };

  try {
      const rawOperands = operandString.match(/[^,\s\[\]]+|\[[^\]]*\]/g) || [];
      result.operands = rawOperands.map(op => op.trim()).filter(op => op !== '');

      const opCount = result.operands.length;
      const ops = result.operands;

      // --- Sửa các phần parse lệnh B và CBZ/CBNZ ---
      if (['B', 'BL'].includes(mnemonic)) {
          if (opCount === 1) {
              result.type = 'B';
              const labelName = ops[0];
              result.structuredOperands = { label: labelName };
              if (labelTable && labelTable.hasOwnProperty(labelName)) {
                  result.targetAddress = labelTable[labelName];
              } else if (labelTable) { // Chỉ báo lỗi nếu labelTable được cung cấp nhưng không tìm thấy
                  // Nếu không có labelTable, có thể đang parse ở bước 1
                  throw new Error(`Label "${labelName}" not found for B instruction.`);
              }
          } else {
              throw new Error(`Invalid operands for B-type instruction ${mnemonic}`);
          }
      } else if (['CBZ', 'CBNZ'].includes(mnemonic)) {
          if (opCount === 2 && ops[0].match(/^X([0-9]|1[0-9]|2[0-7]|SP|ZR)$/i)) {
              result.type = 'CB';
              const labelName = ops[1];
              result.structuredOperands = { Rt: ops[0], label: labelName };
               if (labelTable && labelTable.hasOwnProperty(labelName)) {
                  result.targetAddress = labelTable[labelName];
              } else if (labelTable) {
                  throw new Error(`Label "${labelName}" not found for ${mnemonic} instruction.`);
              }
          } else {
              throw new Error(`Invalid operands for CB-type instruction ${mnemonic}`);
          }
      }
      // --- GIỮ NGUYÊN CÁC PHẦN PARSE KHÁC (R, D, I, IW, SYS, NOP) ---
      else if (['ADD', 'SUB', 'AND', 'ORR', 'EOR', 'LSL', 'LSR', 'ASR', 'MUL', 'SDIV', 'UDIV', 'SUBS'].includes(mnemonic)) {
           if (opCount === 3 && ops[0].match(/^X([0-9]|1[0-9]|2[0-7]|SP|ZR)$/i) && ops[1].match(/^X([0-9]|1[0-9]|2[0-7]|SP|ZR)$/i) && ops[2].match(/^X([0-9]|1[0-9]|2[0-7]|SP|ZR)$/i)) {
              result.type = 'R';
              result.structuredOperands = { Rd: ops[0], Rn: ops[1], Rm: ops[2] };
          } else if (opCount === 3 && ops[0].match(/^X([0-9]|1[0-9]|2[0-7]|SP|ZR)$/i) && ops[1].match(/^X([0-9]|1[0-9]|2[0-7]|SP|ZR)$/i) && ops[2].match(/^#\d+$/)) {
               result.type = 'R_Shift';
               result.structuredOperands = { Rd: ops[0], Rn: ops[1], shift_imm: ops[2] };
          } else {
               throw new Error(`Invalid operands for R-type instruction ${mnemonic}`);
          }
      } else if (['ADDI', 'SUBI', 'ANDI', 'ORRI', 'EORI', 'SUBIS'].includes(mnemonic)) {
           if (opCount === 3 && ops[0].match(/^X([0-9]|1[0-9]|2[0-7]|SP|ZR)$/i) && ops[1].match(/^X([0-9]|1[0-9]|2[0-7]|SP|ZR)$/i) && ops[2].match(/^#-?\d+$/)) {
              result.type = 'I';
              result.structuredOperands = { Rd: ops[0], Rn: ops[1], immediate: ops[2] };
          } else {
              throw new Error(`Invalid operands for I-type instruction ${mnemonic}`);
          }
      } else if (['LDUR', 'STUR', 'LDURSW', 'LDURH', 'STURH', 'LDURB', 'STURB'].includes(mnemonic)) {
          if (opCount === 2 && ops[0].match(/^X([0-9]|1[0-9]|2[0-7]|SP|ZR)$/i) && ops[1].match(/^\[X([0-9]|1[0-9]|2[0-7]|SP|ZR)\s*(,\s*#-?\d+)?\s*\]$/i)) {
              result.type = 'D';
              const memMatch = ops[1].match(/^\[(X[0-9]+|XSP|XZR)\s*(?:,\s*(#-?\d+))?\s*\]$/i);
              if (memMatch) {
                  result.structuredOperands = {
                      Rt: ops[0],
                      Rn: memMatch[1].toUpperCase(),
                      address_imm: memMatch[2] || '#0'
                  };
              } else {
                  throw new Error(`Could not parse memory operand for ${mnemonic}: ${ops[1]}`);
              }
          } else {
              throw new Error(`Invalid operands for D-type instruction ${mnemonic}`);
          }
      } else if (['MOVZ', 'MOVK'].includes(mnemonic)) {
           if (opCount >= 2 && opCount <= 4 && ops[0].match(/^X([0-9]|1[0-9]|2[0-7]|SP|ZR)$/i) && ops[1].match(/^#-?\d+$/)) {
               result.type = 'IW';
               result.structuredOperands = { Rd: ops[0], immediate: ops[1], shift: null };
               if (opCount > 2) {
                   if (ops[2].toUpperCase() === 'LSL' && opCount === 4 && ops[3].match(/^#(0|16|32|48)$/)) {
                        result.structuredOperands.shift = { type: 'LSL', amount: ops[3] };
                   } else {
                        throw new Error(`Invalid shift operand for ${mnemonic}`);
                   }
               }
           } else {
               throw new Error(`Invalid operands for IW-type instruction ${mnemonic}`);
           }
      } else if (['BRK', 'SVC', 'HLT'].includes(mnemonic)) {
          if (opCount === 1 && ops[0].match(/^#\d+$/)) {
              result.type = 'SYS';
              result.structuredOperands = { immediate: ops[0] };
          } else {
               throw new Error(`Invalid operands for System instruction ${mnemonic}`);
          }
      } else if (mnemonic === 'NOP') {
           if (opCount === 0) {
                result.type = 'NOP';
                result.structuredOperands = {};
           } else {
                throw new Error('NOP instruction takes no operands');
           }
      } else {
           // Kiểm tra xem có phải là định nghĩa nhãn không (trường hợp "LABEL:" rồi hết)
           // Phần này có thể không cần nếu việc lọc dòng chỉ chứa nhãn đã tốt
           if (opCount === 0 && mnemonic.endsWith(':')) {
                result.type = 'LABEL_DEF';
                result.label = mnemonic.slice(0, -1);
                result.mnemonic = null; // Không phải lệnh
           } else if (result.type === 'UNKNOWN') { // Nếu không khớp lệnh nào ở trên
               result.error = `Unknown mnemonic or invalid operands: ${mnemonic}`;
               // result.structuredOperands = { raw: result.operands }; // Có thể bỏ
           }
      }


  } catch (e) {
      result.error = e.message;
      result.type = null;
      result.structuredOperands = null;
  }

  // Nếu không có lỗi và không phải là định nghĩa nhãn, thì nó là một lệnh hợp lệ.
  // Nếu type vẫn UNKNOWN và không có lỗi, có thể là mnemonic không được hỗ trợ.
  if (result.type === 'UNKNOWN' && !result.error) {
      result.error = `Unsupported mnemonic: ${mnemonic}`;
  }

  // Chỉ trả về kết quả nếu nó là một lệnh thực sự hoặc một định nghĩa nhãn (nếu bạn muốn xử lý)
  if (result.error || (result.mnemonic && result.type !== 'UNKNOWN' && result.type !== 'LABEL_DEF') || result.type === 'LABEL_DEF') {
      return result;
  }
  return null; // Bỏ qua các dòng không parse được hoàn toàn hoặc không phải lệnh/nhãn
}

// --- Cách sử dụng đề xuất ---
const codeString = `
  CBNZ X20, Else
  ADDI X19, X19, #1
  B End_If
Else:
  ADDI X19, X19, #2
End_If:
  // Dòng comment
  NOP
`;

const codeLines = codeString.split(/\r?\n/);
const instructions = []; // Mảng để lưu các lệnh đã parse
const instructionAddresses = []; // Địa chỉ của mỗi lệnh

// Pass 1: Xây dựng bảng nhãn
const labelTable = buildLabelTable(codeLines);
console.log("Label Table:", labelTable);

// Pass 2: Parse từng lệnh và lưu trữ
let currentAddress = 0;
const instructionSize = 4;

for (let i = 0; i < codeLines.length; i++) {
  const line = codeLines[i];
  let cleanedLineForParse = line.replace(/(\/\/|;).*/, '').trim();

  // Bỏ qua dòng trống
  if (!cleanedLineForParse) continue;

  // Kiểm tra xem dòng này có định nghĩa nhãn và lệnh trên cùng dòng không
  const labelMatch = cleanedLineForParse.match(/^([a-zA-Z_][a-zA-Z0-9_]*):(.*)$/);
  let instructionPart = cleanedLineForParse;

  if (labelMatch) {
      instructionPart = labelMatch[2].trim(); // Lấy phần lệnh sau nhãn
      if (!instructionPart) { // Nếu chỉ có nhãn trên dòng này
          // console.log(`Line ${i+1} is label only: ${labelMatch[1]}`);
          continue; // Bỏ qua, nhãn đã được xử lý
      }
  }


  const parsed = parseLegv8Instruction(instructionPart, labelTable);

  if (parsed && !parsed.error && parsed.type !== 'LABEL_DEF') {
      // Chỉ thêm vào nếu là lệnh hợp lệ và không phải chỉ là định nghĩa nhãn
      parsed.address = currentAddress; // Gán địa chỉ cho lệnh
      instructions.push(parsed);
      instructionAddresses.push(currentAddress);
      currentAddress += instructionSize;
  } else if (parsed && parsed.error) {
      console.error(`Error parsing line ${i + 1} ("${line}"): ${parsed.error}`);
      // Quyết định có dừng lại hay tiếp tục
  } else if (parsed && parsed.type === 'LABEL_DEF') {
      // Đã được xử lý bởi buildLabelTable, không cần làm gì ở đây trừ khi muốn lưu thông tin
  } else {
      // Dòng không parse được thành lệnh hợp lệ (ví dụ, chỉ có nhãn và đã continue)
      // Hoặc dòng trống sau khi clean
  }
}

console.log("\nParsed Instructions:");
instructions.forEach(instr => {
  console.log(`Addr: ${instr.address}, Mnemonic: ${instr.mnemonic}, Type: ${instr.type}, Operands:`, instr.structuredOperands, instr.targetAddress ? `TargetAddr: ${instr.targetAddress}` : '');
});