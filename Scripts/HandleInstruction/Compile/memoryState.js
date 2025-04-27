
export function watchDataMemory(DataMemory) {
    const valuesProxy = new Proxy(DataMemory.Values, {
        set: function(target, prop, value) {
            // Check if we are modifying an element in the array (not adding/removing properties)
            if (prop >= 0 && prop < target.length) {
                console.log(`Values[${prop}] changed from ${target[prop]} to ${value}`);
            }
            target[prop] = value;
            return true;
        },
        get: function(target, prop) {
            return target[prop];
        }
    });
	DataMemory.Values = valuesProxy;
}

export function watchRegisters(Register) {
    const valuesProxy = new Proxy(Register.registerValues, {
        set: function(target, prop, value) {
            // Check if we are modifying an element in the array (not adding/removing properties)
            if (prop >= 0 && prop < target.length) {
                console.log(`Values[${prop}] changed from ${target[prop]} to ${value}`);
            }
            target[prop] = value;
            return true;
        },
        get: function(target, prop) {
            return target[prop];
        }
    });
	Register.registerValues = valuesProxy;
}