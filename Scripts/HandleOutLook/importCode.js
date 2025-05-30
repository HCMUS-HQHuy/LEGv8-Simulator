import {updateLineNumbers} from "./instructionCode.js"

document.addEventListener('DOMContentLoaded', () => {
	const instructionTextarea = document.getElementById('instructionCode');
    const importCodeInput = document.getElementById('import-code'); // The hidden one
    const fileNameDisplay = document.getElementById('file-name-display');

    updateLineNumbers();

    // --- MODIFIED File Import Logic ---
    if (importCodeInput) {
        // The 'change' event still happens on the *hidden* file input
        importCodeInput.addEventListener('change', function(event) {
            const file = event.target.files[0];

            if (file) {
                if (fileNameDisplay) {
                    fileNameDisplay.textContent = file.name; // Display the chosen file name
                }
                const reader = new FileReader();
                reader.onload = function(e) {
                    const fileContent = e.target.result;
                    if (instructionTextarea) {
                        instructionTextarea.value = fileContent;
                        updateLineNumbers();
                        console.log("File content loaded into textarea.");
                    }
                };
                reader.onerror = function(e) {
                    console.error("Error reading file:", e);
                    if (fileNameDisplay) {
                        fileNameDisplay.textContent = "Error loading file.";
                    }
                    alert("Error reading file: " + file.name);
                };
                reader.readAsText(file);
            } else {
                if (fileNameDisplay) {
                    fileNameDisplay.textContent = "No file chosen"; // Reset if no file
                }
                console.log("No file selected.");
            }
            event.target.value = null; // Reset file input
        });
    } else {
        if (!importCodeInput) console.warn("Hidden file input with ID 'import-code' not found.");
    }
});