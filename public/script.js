document.addEventListener('DOMContentLoaded', () => {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file');
    const qualitySlider = document.getElementById('quality');
    const qualityVal = document.getElementById('qualityVal');
    const converterForm = document.getElementById('converterForm');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // Update Quality Value Display
    qualitySlider.addEventListener('input', (e) => {
        qualityVal.textContent = `${e.target.value}%`;
    });

    // Drag and Drop Handlers
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.add('active'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.remove('active'), false);
    });

    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) {
            fileInput.files = files;
            handleFile(files[0]);
        }
    });

    fileInput.addEventListener('change', function() {
        if (this.files.length) {
            handleFile(this.files[0]);
        }
    });

    function handleFile(file) {
        // Validate Image
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file.');
            return;
        }

        // Preview Image
        const reader = new FileReader();
        reader.onload = (e) => {
            // Remove old image preview
            const oldImg = dropzone.querySelector('img');
            if (oldImg) oldImg.remove();
            
            // Add new image
            const img = document.createElement('img');
            img.src = e.target.result;
            dropzone.appendChild(img);
        }
        reader.readAsDataURL(file);
    }

    // Handle Form Submission
    converterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!fileInput.files.length) {
            alert('Please select an image first.');
            return;
        }

        loadingOverlay.classList.add('active');

        try {
            const formData = new FormData(converterForm);
            
            const response = await fetch('/image', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Conversion failed');
            }

            // Handle successful file download
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            
            // Get filename from Content-Disposition header if possible
            let filename = 'converted_image';
            const disposition = response.headers.get('Content-Disposition');
            if (disposition && disposition.indexOf('filename=') !== -1) {
                const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
                if (matches != null && matches[1]) { 
                    filename = matches[1].replace(/['"]/g, '');
                }
            } else {
                // Fallback using selected type
                const type = document.getElementById('conversionType').value;
                const ext = type === 'jpeg' ? 'jpg' : type;
                filename += `.${ext}`;
            }

            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            
            window.URL.revokeObjectURL(downloadUrl);
            a.remove();
            
        } catch (error) {
            console.error(error);
            alert(`Error: ${error.message}`);
        } finally {
            loadingOverlay.classList.remove('active');
        }
    });
});