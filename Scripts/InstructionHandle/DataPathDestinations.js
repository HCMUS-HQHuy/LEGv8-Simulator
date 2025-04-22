const dataPathDestinations = {
    // From Instruction Memory outputs
    "instr_31_0_to_control": "instr-to-control-path",      // Full instruction to Control Unit (for Opcode)
    "instr_31_21_to_reg1":   "instr-rn-to-reg-path",       // Rn field (Read Register 1)
    "instr_9_5_to_reg2":     "instr-rm-to-reg-path",       // Rm field (Read Register 2 for R-type)
    "instr_20_16_to_reg2":   "instr-rt-to-reg-path",       // Rt field (Read Register 2 for CBZ, or Dest for LDUR/STUR)
    "instr_4_0_to_write_reg": "instr-rd-to-reg-path",      // Rd field (Write Register)
    "instr_31_0_to_sign_ext": "instr-to-sign-extend-path", // Field for sign extension (e.g., immediate)
    "instr_branch_addr" :    "instr-branch-addr-to-shift-path", // Address field for branch instructions
    // Add other paths as needed (e.g., from ALU to MUX, Memory to MUX, etc.)
};

export default dataPathDestinations;