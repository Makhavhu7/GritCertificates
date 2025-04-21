/*document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const lookupQrCode = document.getElementById('lookupQrCode');
    const errorMessage = document.getElementById('errorMessage');

    // Google Apps Script web app URL
    const API_URL = 'https://script.google.com/macros/s/AKfycbypHx5_k1PDoFSlNQx85O23qaPLAWUZmHEb7d5Akng3jGhQR_uesOexRz-THrAygcCe/exec';

    // Check URL for GL number
    function checkUrlForGLNumber() {
        const urlParams = new URLSearchParams(window.location.search);
        const glNumber = urlParams.get('gl');

        if (glNumber) {
            updateLookupQrCode(glNumber);
        } else {
            errorMessage.classList.remove('hidden');
            lookupQrCode.innerHTML = '';
        }
    }

    // Update QR code on lookup page
    function updateLookupQrCode(glNumber) {
        lookupQrCode.innerHTML = '';
        const qrUrl = `${API_URL}?action=getCertificatesByGL&glNumber=${glNumber}`;
        new QRCode(lookupQrCode, {
            text: qrUrl,
            width: 300,
            height: 300
        });
    }

    // Check URL on page load
    checkUrlForGLNumber();
});

*/