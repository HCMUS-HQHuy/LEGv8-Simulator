package com.example.legv8sim;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SimulatorController {

    @GetMapping("/simulate")
    public String simulate(@RequestParam(value = "instruction", defaultValue = "NOP") String instruction) {
        String result;
        switch (instruction.toUpperCase()) {
            case "ADD X1, X2, X3":
                result = "Kết quả: X1 = X2 + X3";
                break;
            case "SUB X1, X2, X3":
                result = "Kết quả: X1 = X2 - X3";
                break;
            default:
                result = "Lệnh không hợp lệ: " + instruction;
        }
        return result;
    }
}