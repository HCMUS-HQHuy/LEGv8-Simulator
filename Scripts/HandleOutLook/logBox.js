/**
 * Helper function to display a single message in the log box.
 * @param {string} message - The message to display.
 * @param {string} logBoxId - The ID of the log box element.
 * @param {boolean} isError - True if the message is an error, for styling.
 */
function displayInLogBox(message, logBoxId = "log-box", isError = false) {
	const logBox = document.getElementById(logBoxId);
	if (!logBox) {
		console.error(`Log box element with ID "${logBoxId}" not found for message: ${message}`);
		return;
	}

	// Clear previous classes
	logBox.classList.remove('log-error', 'log-success');

	if (logBox.tagName.toLowerCase() === 'pre') {
		logBox.textContent = message;
	} else {
		// Basic HTML escaping for other elements
		logBox.innerHTML = message.replace(/&/g, "&")
								  .replace(/</g, "<")
								  .replace(/>/g, ">");
	}

	if (isError) {
		logBox.classList.add('log-error');
	}
}


export function logParsingResults(parsedResults, logBoxId = "log-box") {
	const logBox = document.getElementById(logBoxId);
	if (!logBox) {
		console.error(`Log box element with ID "${logBoxId}" not found.`);
		return;
	}

	let errorMessages = [];
	let hasSuccess = false;
	let processedEntries = 0;

	if (!parsedResults) {
		logBox.textContent = "Error: No parsing results received (results array is null/undefined).";
		return;
	}
	if (parsedResults.length === 0) {
		logBox.textContent = "No instructions or labels found to process.";
		return;
	}

	parsedResults.forEach(result => {
		processedEntries++;
		if (result && result.parsed && result.parsed.error) {
			errorMessages.push(
				`Line ${result.lineNumber}: Error parsing "${result.assemblyInstruction || 'input'}": ${result.parsed.error}`
			);
		} else if (result && result.parsed && !result.parsed.error) {
			// We found at least one successfully parsed item (instruction or label)
			hasSuccess = true;
		}
	});

	// Determine what to display in the log box
	if (errorMessages.length > 0) {
		// There were errors, display them
		const fullLog = ["Parsing encountered errors:", ...errorMessages].join('\n');
		if (logBox.tagName.toLowerCase() === 'pre') {
			logBox.textContent = fullLog;
		} else {
			logBox.innerHTML = ["Parsing encountered errors:", ...errorMessages].map(msg =>
				msg.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">")
			).join('<br>');
		}
		// Add a class to indicate error state, e.g., for styling
		logBox.classList.add('log-error');
		logBox.classList.remove('log-success');
	} else if (hasSuccess) {
		// No errors, and at least one item was successfully processed
		const successMessage = `All ${processedEntries} relevant lines parsed successfully.`;
		if (logBox.tagName.toLowerCase() === 'pre') {
			logBox.textContent = successMessage;
		} else {
			logBox.innerHTML = successMessage.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
		}
		logBox.classList.add('log-success');
		logBox.classList.remove('log-error');
	} else {
		// No errors, but also no successful parses (e.g., only empty lines or only comments)
		// This case might be covered by `parsedResults.length === 0` if `getResult` filters them out before erroring
		const emptyMessage = "No executable instructions or defined labels found after processing.";
		 if (logBox.tagName.toLowerCase() === 'pre') {
			logBox.textContent = emptyMessage;
		} else {
			logBox.innerHTML = emptyMessage.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
		}
		logBox.classList.remove('log-error', 'log-success');
	}
}

/**
 * Validates the parsed results to check for any errors.
 * Logs errors to the console and the log-box if any are found.
 * @param {Array<object>} parsedResults - The array of results from getResult().
 * @param {string} logBoxId - The ID of the HTML element to log errors to.
 * @returns {boolean} - True if results are valid (no errors), false otherwise.
 */
export function validateParsedResults(parsedResults, logBoxId = "log-box") {
    if (parsedResults == null) {
        // This case should ideally be caught before calling this function,
        // but good to have a fallback.
        const nullResultMessage = "Validation Error: Parsed results are null. Cannot proceed.";
        console.error(nullResultMessage);
        displayInLogBox(nullResultMessage, logBoxId, true); // Assuming displayInLogBox is defined
        return false;
    }
    if (parsedResults.length === 0) {
        // No instructions or labels were found after parsing (e.g., empty input)
        // This might not be an "error" per se, but execution can't proceed.
        const emptyResultMessage = "Validation Info: No instructions found to validate or execute.";
        console.info(emptyResultMessage);
        displayInLogBox(emptyResultMessage, logBoxId, false);
        return false; // Or true if you consider empty as "valid but nothing to do"
    }

    const errorsFound = [];
    let executableInstructionsCount = 0;

    parsedResults.forEach(result => {
        if (result && result.parsed) {
            if (result.parsed.error) {
                errorsFound.push(
                    `Line ${result.lineNumber}: Error parsing "${result.assemblyInstruction || 'input'}": ${result.parsed.error}`
                );
            } else if (result.parsed.mnemonic && result.parsed.type !== 'LABEL_DEF') {
                // It's a successfully parsed instruction (not just a label)
                executableInstructionsCount++;
            }
        } else {
            // Malformed result object
            errorsFound.push(`Line ${result?.lineNumber || 'Unknown'}: Corrupted parsing result.`);
        }
    });

    if (errorsFound.length > 0) {
        const errorHeader = "Validation Failed: Parsing errors found. Cannot execute.";
        const fullLog = [errorHeader, ...errorsFound];
        console.error(errorHeader, errorsFound);
        displayInLogBox(fullLog.join('\n'), logBoxId, true); // Assuming displayInLogBox joins with <br> or \n
        return false; // Validation fails
    }

    if (executableInstructionsCount === 0) {
        // No errors, but also no actual instructions to execute (e.g., only labels and comments)
        const noExecutableMessage = "Validation Info: No executable instructions found.";
        console.info(noExecutableMessage);
        displayInLogBox(noExecutableMessage, logBoxId, false);
        return false; // Or true, depending on if you allow "execution" of no-ops
    }

    // If no errors and at least one executable instruction
    const successMessage = "Validation Successful: Code is ready for execution.";
    displayInLogBox(successMessage, logBoxId, false); // Display success in log-box
    return true; // Validation passes
}