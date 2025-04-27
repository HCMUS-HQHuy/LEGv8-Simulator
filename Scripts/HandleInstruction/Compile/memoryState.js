
export function watchDataMemory(DataMemory) {
    for (let i = 0; i < 64; i++) {
        const indexElement = `0x${(i*8).toString(16).toUpperCase().padStart(4, '0')}`;
        document.getElementById(indexElement).innerText = `0x${DataMemory.Values[i].toString(16).toUpperCase().padStart(4, '0')}`;
        console.log(`indexElement ${indexElement}`);
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