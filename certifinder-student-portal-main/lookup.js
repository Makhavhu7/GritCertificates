document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const lookupQrCode = document.getElementById('lookupQrCode');
    const webcamContainer = document.getElementById('webcamContainer');
    const webcam = document.getElementById('webcam');
    const webcamCanvas = document.getElementById('webcamCanvas');
    const webcamMessage = document.getElementById('webcamMessage');
    const closeWebcamBtn = document.getElementById('closeWebcam');
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

    // Google Apps Script web app URL
    const API_URL = 'https://script.google.com/macros/s/AKfycbxyiFwyEwVHH3ijw2eXQzi0y3YQ8wS0kgKLh7LVmuGYA22WxH9IjKsn_oAOyiQf1wm-/exec';

    let stream = null;

    // Check URL for GL number and scan parameter
    function checkUrlForGLNumber() {
        const urlParams = new URLSearchParams(window.location.search);
        const glNumber = urlParams.get('gl');
        const scan = urlParams.get('scan');

        if (glNumber) {
            updateLookupQrCode(glNumber);
            if (scan === 'true') {
                startWebcamScanner(glNumber);
            } else {
                lookupCertificate(glNumber);
            }
        } else {
            certificateNotFound.classList.remove('hidden');
            notFoundGlNumber.textContent = 'None';
            lookupQrCode.innerHTML = '<p>No GL number provided. Please access this page via the link in your email.</p>';
        }
    }

    // Update QR code on lookup page
    function updateLookupQrCode(glNumber) {
        lookupQrCode.innerHTML = '';
        const qrUrl = `${API_URL}?action=getCertificatesByGL&glNumber=${glNumber}`;
        new QRCode(lookupQrCode, {
            text: qrUrl,
            width: 150,
            height: 150
        });
    }

    // Start webcam scanner
    async function startWebcamScanner(glNumber) {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            webcam.srcObject = stream;
            webcamContainer.classList.remove('hidden');
            webcamMessage.textContent = 'Scanning for QR code...';
            scanQrCode(glNumber);
        } catch (error) {
            console.error('Error accessing webcam:', error);
            webcamMessage.textContent = 'Error accessing webcam. Please ensure camera access is allowed.';
        }
    }

    // Stop webcam
    function stopWebcam() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        webcamContainer.classList.add('hidden');
        webcamMessage.textContent = '';
    }

    // Scan QR code using jsQR
    function scanQrCode(glNumber) {
        const context = webcamCanvas.getContext('2d');
        webcamCanvas.width = webcam.videoWidth;
        webcamCanvas.height = webcam.videoHeight;

        function tick() {
            if (webcam.readyState === webcam.HAVE_ENOUGH_DATA) {
                context.drawImage(webcam, 0, 0, webcamCanvas.width, webcamCanvas.height);
                const imageData = context.getImageData(0, 0, webcamCanvas.width, webcamCanvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);

                if (code) {
                    stopWebcam();
                    handleScannedQrCode(code.data, glNumber);
                    return;
                }
            }
            requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    // Handle scanned QR code
    async function handleScannedQrCode(qrUrl, glNumber) {
        try {
            const response = await fetch(qrUrl);
            const certificates = await response.json();

            if (certificates.error) {
                webcamMessage.textContent = `No certificates found for GL number: ${glNumber}`;
                certificateNotFound.classList.remove('hidden');
                notFoundGlNumber.textContent = glNumber;
                return;
            }

            displayCertificates(certificates);
        } catch (error) {
            console.error('Error fetching certificates from QR code:', error);
            webcamMessage.textContent = 'Error fetching certificates. Please try again.';
            certificateNotFound.classList.remove('hidden');
            notFoundGlNumber.textContent = glNumber;
        }
    }

    // Lookup certificate function
    async function lookupCertificate(glNumber) {
        certificateResult.classList.add('hidden');
        certificateNotFound.classList.add('hidden');

        try {
            const response = await fetch(`${API_URL}?action=getCertificatesByGL&glNumber=${glNumber}`);
            const certificates = await response.json();

            if (certificates.error) {
                notFoundGlNumber.textContent = glNumber;
                certificateNotFound.classList.remove('hidden');
                console.log(`No certificates found for GL number: ${glNumber}`);
                return false;
            }

            displayCertificates(certificates);
            return true;
        } catch (error) {
            console.error('Error fetching certificates:', error);
            notFoundGlNumber.textContent = glNumber;
            certificateNotFound.classList.remove('hidden');
            return false;
        }
    }

    // Display multiple certificates
    function displayCertificates(certificates) {
        certificateResult.classList.remove('hidden');
        certificateNotFound.classList.add('hidden');
        const detailsContainer = document.querySelector('.certificate-details');
        detailsContainer.innerHTML = '';

        const cert = certificates[0]; // Use first certificate for basic info
        detailsContainer.innerHTML = `
            <div class="detail-group">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${cert.firstName} ${cert.lastName}</span>
            </div>
            <div class="detail-group">
                <span class="detail-label">Student Code:</span>
                <span class="detail-value">${cert.studentCode}</span>
            </div>
            <div class="detail-group">
                <span class="detail-label">GL Number:</span>
                <span class="detail-value">${cert.glNumber}</span>
            </div>
        `;

        const certList = document.createElement('div');
        certList.className = 'certificate-list';
        certificates.forEach((cert, index) => {
            const certItem = document.createElement('div');
            certItem.className = 'certificate-item';
            certItem.innerHTML = `
                <div class="detail-group">
                    <span class="detail-label">Certificate ${index + 1} Status:</span>
                    <span class="detail-value status-pass">${cert.status}</span>
                </div>
                <div class="detail-group">
                    <span class="detail-label">Certificate Link:</span>
                    <a href="${cert.certificate}" target="_blank">View Certificate ${index + 1}</a>
                </div>
            `;
            certList.appendChild(certItem);
        });
        detailsContainer.appendChild(certList);

        // Update action buttons
        viewCertificateBtn.onclick = () => {
            window.open(certificates[0].certificate, '_blank');
        };
        downloadCertificateBtn.onclick = () => {
            certificates.forEach((cert, index) => {
                const link = document.createElement('a');
                link.href = cert.certificate;
                link.download = `${cert.glNumber}_${index + 1}.pdf`;
                link.click();
            });
        };
    }

    // Close webcam
    closeWebcamBtn.addEventListener('click', stopWebcam);

    // Close result button
    closeResultBtn.addEventListener('click', function() {
        certificateResult.classList.add('hidden');
    });

    // Try again button
    tryAgainBtn.addEventListener('click', function() {
        certificateNotFound.classList.add('hidden');
        window.location.href = 'lookup.html';
    });

    // Close certificate viewer
    closeViewerBtn.addEventListener('click', function() {
        certificateViewer.classList.add('hidden');
        certificateDisplay.innerHTML = '';
    });

    // Check URL on page load
    checkUrlForGLNumber();
});