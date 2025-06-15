function updateValue(target, prop, value) {
    if (prop >= 0 && prop < target.length) {
        console.log(`Values[${prop}] changed from ${target[prop]} to ${value}`);
        target[prop] = value;
        return true;
    }
    console.error(`Cannot update memory: ${prop}`);
    return false;
}

function getValue(target, prop) {
    if (prop < 0 || prop >= target.length)
        console.error(`Cannot access memory: ${prop}`);
    return target[prop];
}


export function watchDataMemory(DataMemory) {
    for (let i = 0; i < 64; i++) {
        const indexElement = `0x${(i*8).toString(16).toUpperCase().padStart(4, '0')}`;
        document.getElementById(indexElement).innerText = `0x${DataMemory.Values[i].toString(16).toUpperCase().padStart(4, '0')}`;
        // console.log(`indexElement ${indexElement}`);
    }

    const valuesProxy = new Proxy(DataMemory.Values, {
        set: function(target, prop, value) {
            return updateValue(target, prop, value);
        },
        get: function(target, prop) {
            return getValue(target, prop);
        }
    });
	DataMemory.Values = valuesProxy;
}

export function watchRegisters(Register) {
    
    for (let i = 0; i < 31; i++) {
        const indexElement = `X${(i).toString(10).padStart(2, '0')}`;
        document.getElementById(indexElement).innerText = `0x${Register.registerValues[i].toString(16).toUpperCase().padStart(8, '0')}`;
    }
    if (Register.registerValues[31] != 0)
        console.warn(`XZR is modified!`);
    else document.getElementById(`XZR`).innerText = `0x${Register.registerValues[31].toString(16).toUpperCase().padStart(8, '0')}`;

    const valuesProxy = new Proxy(Register.registerValues, {
        set: function(target, prop, value) {
            return updateValue(target, prop, value);
        },
        get: function(target, prop) {
            return getValue(target, prop);
        }
    });
	Register.registerValues = valuesProxy;
}


export function watchFlags(ALU) {
    // Check if ALU and ALU.Flags exist to prevent errors
    if (!ALU || typeof ALU.Flags !== 'object') {
        console.error("watchFlags Error: Invalid ALU object or ALU.Flags is missing.");
        return;
    }
    
    // 1. Khởi tạo giá trị ban đầu trên giao diện
    updateFlagDOM('N', ALU.Flags.N);
    updateFlagDOM('Z', ALU.Flags.Z);
    updateFlagDOM('V', ALU.Flags.V);
    updateFlagDOM('C', ALU.Flags.C);

    // 2. Tạo một Proxy để theo dõi đối tượng Flags
    const flagsProxy = new Proxy(ALU.Flags, {
        set: function(target, prop, value) {
            if (value != target[prop]) {
                console.log(`Flag '${prop}' changed from ${target[prop]} to ${value}`);
                
                target[prop] = value;
                
                // updateFlagDOM(prop, value);    
            }
            return true;
        },
        get: function(target, prop) {
            return target[prop];
        }
    });
    ALU.Flags = flagsProxy;
}

// The helper function updateFlagDOM remains the same.
function updateFlagDOM(flagName, value) {
    const element = document.getElementById(flagName);
    if (element) {
        element.innerText = value;
        element.classList.add('changed');
        setTimeout(() => {
            element.classList.remove('changed');
        }, 500);
    } else {
        console.error(`Flag element with ID '${flagName}' not found.`);
    }
}
