document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const lookupForm = document.getElementById('lookupForm');
    const glNumberInput = document.getElementById('glNumber');
    const certificateResult = document.getElementById('certificateResult');
    const certificateNotFound = document.getElementById('certificateNotFound');
    const closeResultBtn = document.getElementById('closeResult');
    const tryAgainBtn = document.getElementById('tryAgainBtn');
    const notFoundGlNumber = document.getElementById('notFoundGlNumber');
    const viewCertificateBtn = document.getElementById('viewCertificate');
    const downloadCertificateBtn = document.getElementById('downloadCertificate');
    const certificateViewer = document.getElementById('certificateViewer');
    const closeViewerBtn = document.getElementById('closeViewer');
    const certificateDisplay = document.getElementById('certificateDisplay');
    const scanQrBtn = document.getElementById('scanQrBtn');
    const qrCodeModal = document.getElementById('qrCodeModal');
    const closeQrModal = document.getElementById('closeQrModal');
    const qrModalDisplay = document.getElementById('qrModalDisplay');
    const qrModalMessage = document.getElementById('qrModalMessage');

    // Google Apps Script web app URL
    const API_URL = 'https://script.google.com/macros/s/AKfycbxheTXaZNaL5NERN_JQZDtPM7kO-hkOFAz5KLuWHqDt1YmuPuszz09vg36LUO87sSb0/exec';

    // Check URL for GL number query parameter
    function checkUrlForGLNumber() {
        const urlParams = new URLSearchParams(window.location.search);
        const glNumber = urlParams.get('gl');
        
        if (glNumber) {
            glNumberInput.value = glNumber;
            lookupCertificate(glNumber);
        }
    }

    // Handle form submission
    lookupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const glNumber = glNumberInput.value.trim();
        lookupCertificate(glNumber);
    });

    // Lookup certificate function
    async function lookupCertificate(glNumber) {
        certificateResult.classList.add('hidden');
        certificateNotFound.classList.add('hidden');
        const qrCodeDisplay = document.getElementById('qrCodeDisplay');
        if (qrCodeDisplay) qrCodeDisplay.innerHTML = '';

        try {
            const response = await fetch(`${API_URL}?action=lookup&glNumber=${glNumber}`);
            const cert = await response.json();

            if (cert.error) {
                notFoundGlNumber.textContent = glNumber;
                certificateNotFound.classList.remove('hidden');
                console.log(`No certificate found for GL number: ${glNumber}`);
                return false;
            }

            document.getElementById('studentName').textContent = cert.studentName;
            document.getElementById('studentCode').textContent = cert.studentCode;
            document.getElementById('resultGlNumber').textContent = cert.glNumber;
            document.getElementById('certificateStatus').textContent = cert.status;

            const statusElement = document.getElementById('certificateStatus');
            if (cert.status === 'Passed with Distinction') {
                statusElement.className = 'detail-value status-pass';
                statusElement.style.color = '#34a853';
            } else {
                statusElement.className = 'detail-value status-pass';
                statusElement.style.color = '#1a73e8';
            }

            // Use backend's QR code URL
            if (qrCodeDisplay) {
                const response = await fetch(`${API_URL}?action=getAllCertificates`);
                const allCerts = await response.json();
                const certData = allCerts.find(c => c.glNumber === glNumber);
                if (certData && certData.qrCode) {
                    qrCodeDisplay.innerHTML = `<img src="${certData.qrCode}" width="100" alt="QR Code">`;
                } else {
                    qrCodeDisplay.innerHTML = '<span>QR Code not generated</span>';
                }
            }

            certificateResult.classList.remove('hidden');
            console.log(`Certificate found for GL number: ${glNumber}`);
            return true;
        } catch (error) {
            console.error('Error fetching certificate:', error);
            notFoundGlNumber.textContent = glNumber;
            certificateNotFound.classList.remove('hidden');
            return false;
        }
    }

    // View QR code button
    scanQrBtn.addEventListener('click', async function() {
        const glNumber = glNumberInput.value.trim();
        qrModalDisplay.innerHTML = '';
        qrModalMessage.textContent = '';

        if (!glNumber) {
            qrModalMessage.textContent = 'Please enter a GL number to view the QR code.';
            qrCodeModal.classList.remove('hidden');
            return;
        }

        try {
            const response = await fetch(`${API_URL}?action=lookup&glNumber=${glNumber}`);
            const cert = await response.json();

            if (cert.error) {
                qrModalMessage.textContent = `No certificate found for GL number: ${glNumber}`;
                qrCodeModal.classList.remove('hidden');
                console.log(`No certificate found for GL number: ${glNumber}`);
                return;
            }

            const allCertsResponse = await fetch(`${API_URL}?action=getAllCertificates`);
            const allCerts = await allCertsResponse.json();
            const certData = allCerts.find(c => c.glNumber === glNumber);
            if (certData && certData.qrCode) {
                qrModalDisplay.innerHTML = `<img src="${certData.qrCode}" width="200" alt="QR Code">`;
                qrModalMessage.textContent = `QR Code for ${cert.studentName} (${glNumber})`;
            } else {
                qrModalMessage.textContent = `QR Code not generated for ${glNumber}`;
            }
            qrCodeModal.classList.remove('hidden');
            console.log(`Displayed QR code for GL number: ${glNumber}`);
        } catch (error) {
            console.error('Error fetching QR code:', error);
            qrModalMessage.textContent = `Error fetching QR code for GL number: ${glNumber}`;
            qrCodeModal.classList.remove('hidden');
        }
    });

    // Close QR modal
    closeQrModal.addEventListener('click', function() {
        qrCodeModal.classList.add('hidden');
        qrModalDisplay.innerHTML = '';
        qrModalMessage.textContent = '';
    });

    // Close result button
    closeResultBtn.addEventListener('click', function() {
        certificateResult.classList.add('hidden');
    });

    // Try again button
    tryAgainBtn.addEventListener('click', function() {
        certificateNotFound.classList.add('hidden');
        glNumberInput.value = '';
        glNumberInput.focus();
    });

    // View certificate
    viewCertificateBtn.addEventListener('click', async function() {
        const glNumber = document.getElementById('resultGlNumber').textContent;
        try {
            const response = await fetch(`${API_URL}?action=lookup&glNumber=${glNumber}`);
            const cert = await response.json();

            if (cert.certificate) {
                window.open(cert.certificate, '_blank');
            } else {
                alert('Certificate file not found.');
            }
        } catch (error) {
            console.error('Error viewing certificate:', error);
            alert('Error viewing certificate.');
        }
    });

    // Download certificate
    downloadCertificateBtn.addEventListener('click', async function() {
        const glNumber = document.getElementById('resultGlNumber').textContent;
        try {
            const response = await fetch(`${API_URL}?action=lookup&glNumber=${glNumber}`);
            const cert = await response.json();

            if (cert.certificate) {
                const link = document.createElement('a');
                link.href = cert.certificate;
                link.download = `${glNumber}.pdf`;
                link.click();
            } else {
                alert('Certificate file not found.');
            }
        } catch (error) {
            console.error('Error downloading certificate:', error);
            alert('Error downloading certificate.');
        }
    });

    // Close certificate viewer
    closeViewerBtn.addEventListener('click', function() {
        certificateViewer.classList.add('hidden');
        certificateDisplay.innerHTML = '';
    });

    // Check URL on page load
    checkUrlForGLNumber();
});