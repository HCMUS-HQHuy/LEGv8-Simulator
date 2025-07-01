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

export function validateParsedResults(parsedResults, logBoxId = "log-box") {
    if (parsedResults == null) {
        const nullResultMessage = "Validation Error: Parsed results are null. Cannot proceed.";
        console.error(nullResultMessage);
        displayInLogBox(nullResultMessage, logBoxId, true);
        return false;
    }
    if (typeof parsedResults === 'string') {
        displayInLogBox(parsedResults, logBoxId, true);
        return false;
    }
	displayInLogBox("Compilation completed successfully.", logBoxId);
    return true;
}