
// Wait for the HTML document to be fully loaded
document.addEventListener('DOMContentLoaded', function() {

    const content = document.getElementById('zoomContent');
    const frame = document.getElementById('zoomFrame');

    // --- Zoom Variables (Existing) ---
    let scale = 1;

    // --- Drag/Pan Variables (NEW) ---
    let isDragging = false;
    let startX, startY;
    let currentX = 0; // Current X translation of the content
    let currentY = 0; // Current Y translation of the content

    // --- Initial Setup (NEW/MODIFIED) ---
    if (content) {
        // Apply initial transform
        content.style.transformOrigin = '0 0'; // Set transform origin for consistent scaling/panning
        content.style.transform = `translate(${currentX}px, ${currentY}px) scale(${scale})`;
    }
    if (frame) {
        frame.style.cursor = 'grab'; // Initial cursor style
        frame.style.overflow = 'hidden'; // Prevent scrollbars on the frame itself
    } else {
         console.error("Zoom frame element not found!");
    }
     if (!content) {
         console.error("Zoom content element not found!");
     }
    // ------------------------------------

    // --- Zoom Listener (Existing - slightly modified for safety) ---
    if (frame && content) {
        frame.addEventListener('wheel', function(e) {
			e.preventDefault(); // Prevent browser zoom

			// --- Calculate mouse position relative to the frame --- (NEW - for better zoom centering)
			const rect = frame.getBoundingClientRect();
			const mouseX = e.clientX - rect.left;
			const mouseY = e.clientY - rect.top;
			
			const delta = e.deltaY;
			const zoomFactor = 0.1;
			const oldScale = scale; // Store old scale

			if (delta > 0) {
				scale = Math.max(0.1, scale - zoomFactor);
			} else {
				scale = Math.min(5, scale + zoomFactor);
			}

				// --- Adjust translation to keep point under mouse stationary --- (NEW - Alternative to transform-origin)
				currentX = mouseX - (mouseX - currentX) * (scale / oldScale);
				currentY = mouseY - (mouseY - currentY) * (scale / oldScale);


			content.style.transform = `translate(${currentX}px, ${currentY}px) scale(${scale})`;
            
        }, { passive: false });
    }
    // ------------------------------------

    // --- Drag/Pan Listeners (NEW) ---
    if (frame && content) {
        // --- Mouse Down: Start Dragging ---
        frame.addEventListener('mousedown', (e) => {
            // Prevent dragging if Ctrl key is pressed (allow selection for zoom perhaps)
            // or if it's not the primary mouse button
            if (e.ctrlKey || e.button !== 0) return;

            isDragging = true;
            startX = e.clientX; // Use clientX relative to viewport
            startY = e.clientY;
            frame.style.cursor = 'grabbing'; // Change cursor
            // Prevent text selection during drag
            e.preventDefault();
        });

        // --- Mouse Move: Pan the Content ---
        // Listen on the frame, might need document listener for dragging outside
        frame.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            // Calculate distance moved
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            // Calculate new translation
            const newX = currentX + dx;
            const newY = currentY + dy;

            // Apply the combined transform (translate + scale)
            content.style.transform = `translate(${newX}px, ${newY}px) scale(${scale})`;
        });

        // --- Mouse Up: Stop Dragging ---
        const stopDragging = (e) => {
            if (!isDragging) return;

            isDragging = false;
            frame.style.cursor = 'grab'; // Reset cursor

            // Calculate final displacement and update current position state
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            currentX += dx;
            currentY += dy;
            // Final transform is already applied by mousemove, but we could re-apply here if needed
             content.style.transform = `translate(${currentX}px, ${currentY}px) scale(${scale})`;
        };

        frame.addEventListener('mouseup', stopDragging);

        // --- Mouse Leave: Also Stop Dragging ---
        frame.addEventListener('mouseleave', stopDragging); // Stop if mouse leaves the frame
    }
    // ------------------------------------
})