# LEGv8 Single-Cycle Simulator

A web-based, visual LEGv8 instruction set simulator designed for educational purposes. This tool helps students and enthusiasts understand the flow of data and control signals within a single-cycle LEGv8 processor datapath for each instruction.

<p align="center">
  <img src="./image.png" alt="Legv8-Simulator Screenshot" width="400"/>
  <br/>
  <em>Legv8-Simulator Screenshot</em>
</p>

## ✨ Features

- 🧠 **Visual Datapath**: Interactive SVG diagram shows how each LEGv8 instruction flows through the datapath.
- 🎞 **Real-Time Animation**: Control and data signals animate as instructions execute.
- 🔁 **Step-by-Step Execution**: Observe internal states per instruction.
- ✍️ **Code Editor**: Simple in-browser editor with line numbers and import support.
- 🧪 **Parser & Validator**: Validates syntax, resolves labels, and logs errors before execution.
- 🔍 **Optional State Inspection**: (if implemented) View contents of all registers and memory locations.

## 🚀 Getting Started

1.  **Open the Simulator:** Simply open the `index.html` file in a modern web browser (Chrome, Firefox, Edge).
2.  **Write or Import Code:**
    *   Type your LEGv8 assembly code directly into the code editor.
    *   Or, click the **"📤 Import Code File"** button to load an assembly file (`.s`, `.asm`, `.txt`) from your computer.
3.  **Compile:** Click the **"⚙️ Compile"** button. This will:
    *   Parse your assembly code.
    *   Resolve any labels used in branch instructions.
    *   Validate the syntax.
    *   Report any errors or a success message in the **Log** panel.
4.  **Execute:** If compilation is successful, the **"▶ Execute"** button will be enabled.
    *   Click **"▶ Execute"** to run the entire program with full animation.
    *   (Optional, if implemented) Use the "Step" button to execute one instruction at a time.
5.  **Restart:** Click the **"↺ Replay"** button to stop the current execution, clear the animation, and reset the simulation state, allowing you to run the code again from the beginning.

## 🛠️ Supported Instruction Set

| Type      | Supported Mnemonics                                                    |
|-----------|-------------------------------------------------------------------------|
| R-Type    | `ADD`, `SUB`, `AND`, `ORR`, `EOR`, `ADDS`, `SUBS`, `ANDS`              |
| D-Type    | `LDUR`, `STUR`                                                         |
| I-Type    | `ADDI`, `SUBI`, `ANDI`, `ORRI`, `EORI`, `SUBIS`                        |
| B-Type    | `B`, `BL`                                                              |
| CB-Type   | `CBZ`, `CBNZ`                                                          |
| B.cond    | `B.EQ`, `B.NE`, `B.GT`, `B.LT`, `B.GE`, `B.LE`, etc.                   |

> 💡 **Syntax Notes**:
> - Use `//` for comments.
> - Define labels with `LabelName:`.
> - Registers: `X0–X30`, `XZR`.
> - Immediates: decimal (`#10`).

---

## 🔗 Try It Online

👉 **Live Version:** [https://hcmus-hqhuy.github.io/LEGv8-Simulator/](https://hcmus-hqhuy.github.io/LEGv8-Simulator/)

Just open in any modern browser — no setup required!

---

## 👨‍💻 Contributors

- [@HCMUS-HQHuy](https://github.com/HCMUS-HQHuy) – Huỳnh Quốc Huy  
- [@77x17](https://github.com/77x17) – Phan Ngưng

---

## 🙌 Feedback & Contributions

💬 Found a bug?  
🧠 Want to add a feature?  
🛠 Submit a PR or open an issue!

👉 [Issues](https://github.com/HCMUS-HQHuy/LEGv8-Simulator/issues)  
👉 [Pull Requests](https://github.com/HCMUS-HQHuy/LEGv8-Simulator/pulls)

---

> LEGv8 is a simplified ARMv8 architecture model used in education. This simulator is not intended for production ARM development.

