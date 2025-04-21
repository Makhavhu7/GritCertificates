document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginContainer = document.getElementById('loginContainer');
    const adminDashboard = document.getElementById('adminDashboard');
    const logoutBtn = document.getElementById('logoutBtn');
    const certificatesTableBody = document.getElementById('certificatesTableBody');
    const totalCertificates = document.getElementById('totalCertificates');
    const distinctionCount = document.getElementById('distinctionCount');
    const passCount = document.getElementById('passCount');
    const lastUpdated = document.getElementById('lastUpdated');
    const searchCertificates = document.getElementById('searchCertificates');
    const sendEmailsBtn = document.getElementById('sendEmailsBtn');
    const exportDataBtn = document.getElementById('exportDataBtn');
    const qrCodeModal = document.getElementById('qrCodeModal');
  
    const API_URL = 'https://script.google.com/macros/s/AKfycbwPUe2u4B-kBEFvDOWIFK570gS_XPrXoKUrGWJ8VtangkByOzdMTjukJAo5Hfx7--uN/exec';
  
    let certificates = [];
  
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
  
      if (username === 'admin' && password === 'admin') {
        loginContainer.parentElement.classList.add('hidden');
        adminDashboard.classList.remove('hidden');
        searchCertificates.value = '';
        await syncAndFetchCertificates();
        console.log('Admin logged in successfully');
      } else {
        alert('Invalid credentials. Use "admin" for both username and password.');
        console.log('Login failed: Invalid credentials');
      }
    });
  
    logoutBtn.addEventListener('click', function() {
      loginContainer.parentElement.classList.remove('hidden');
      adminDashboard.classList.add('hidden');
      document.getElementById('username').value = '';
      document.getElementById('password').value = '';
      console.log('Admin logged out');
    });
  
    async function syncAndFetchCertificates() {
      try {
        console.log('Syncing certificates from Drive...');
        const syncResponse = await fetch(`${API_URL}?action=syncCertificates`);
        if (!syncResponse.ok) {
          throw new Error(`Sync HTTP error! status: ${syncResponse.status}`);
        }
        const syncResult = await syncResponse.json();
        if (!syncResult.success) {
          throw new Error(syncResult.error || 'Sync failed');
        }
        console.log(`Synced ${syncResult.count} certificates`);
  
        console.log('Fetching certificates from API...');
        const fetchResponse = await fetch(`${API_URL}?action=getAllCertificates`);
        if (!fetchResponse.ok) {
          throw new Error(`Fetch HTTP error! status: ${fetchResponse.status}`);
        }
        certificates = await fetchResponse.json();
        console.log('Certificates fetched:', certificates);
        if (!Array.isArray(certificates)) {
          console.error('Expected an array, got:', certificates);
          certificates = [];
        }
        updateDashboardStats();
        renderCertificatesTable();
      } catch (error) {
        console.error('Error syncing/fetching certificates:', error);
        alert('Error syncing/fetching certificates: ' + error.message);
        certificates = [];
        updateDashboardStats();
        renderCertificatesTable();
      }
    }
  
    sendEmailsBtn.addEventListener('click', async function() {
      try {
        const hasUrls = certificates.some(cert => cert.certificate && cert.qrCode);
        if (!hasUrls) {
          alert('No certificates with URLs and QR codes found. Please ensure certificates are synced.');
          return;
        }
        const response = await fetch(`${API_URL}?action=sendEmails`);
        const result = await response.json();
        if (result.success) {
          alert(`Emails sent to ${result.count} students.`);
        } else {
          alert('Error sending emails: ' + (result.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error sending emails:', error);
        alert('Error sending emails: ' + error.message);
      }
    });
  
    exportDataBtn.addEventListener('click', function() {
      const jsonData = JSON.stringify(certificates, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'certificates.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      console.log('Certificate data exported');
    });
  
    document.querySelector('.close-modal-btn').addEventListener('click', function() {
      qrCodeModal.classList.add('hidden');
    });
  
    function updateDashboardStats() {
      totalCertificates.textContent = certificates.length;
      const distinction = certificates.filter(cert => cert.status === 'Passed with Distinction').length;
      distinctionCount.textContent = distinction;
      const pass = certificates.filter(cert => cert.status === 'Passed').length;
      passCount.textContent = pass;
      const now = new Date();
      lastUpdated.textContent = now.toLocaleString();
    }
  
    function renderCertificatesTable() {
      console.log('Rendering certificates table with data:', certificates);
      certificatesTableBody.innerHTML = '';
      const searchTerm = searchCertificates.value.toLowerCase();
      const filteredCertificates = certificates.filter(cert => {
        return cert.glNumber.toLowerCase().includes(searchTerm) ||
               cert.studentCode.toLowerCase().includes(searchTerm) ||
               cert.firstName.toLowerCase().includes(searchTerm) ||
               cert.lastName.toLowerCase().includes(searchTerm) ||
               cert.status.toLowerCase().includes(searchTerm);
      });
      console.log('Filtered certificates:', filteredCertificates);
  
      if (filteredCertificates.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 5;
        cell.style.textAlign = 'center';
        cell.textContent = certificates.length === 0 
          ? 'No certificates found in Google Drive. Upload PDFs to the Drive folder.'
          : 'No certificates match the search criteria.';
        row.appendChild(cell);
        certificatesTableBody.appendChild(row);
        return;
      }
  
      filteredCertificates.forEach(cert => {
        const row = document.createElement('tr');
        const glCell = document.createElement('td');
        glCell.textContent = cert.glNumber || 'N/A';
        row.appendChild(glCell);
        const nameCell = document.createElement('td');
        nameCell.textContent = `${cert.firstName || ''} ${cert.lastName || ''}`.trim() || 'N/A';
        row.appendChild(nameCell);
        const emailCell = document.createElement('td');
        emailCell.textContent = cert.email || 'N/A';
        row.appendChild(emailCell);
        const statusCell = document.createElement('td');
        statusCell.textContent = cert.status || 'N/A';
        statusCell.style.color = cert.status === 'Passed with Distinction' ? 'var(--success-color)' : 'var(--primary-color)';
        statusCell.style.fontWeight = '500';
        row.appendChild(statusCell);
        const actionsCell = document.createElement('td');
        actionsCell.className = 'table-actions';
        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn primary-btn';
        viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
        viewBtn.title = 'View Certificate';
        viewBtn.dataset.gl = cert.glNumber;
        viewBtn.addEventListener('click', viewCertificate);
        const qrBtn = document.createElement('button');
        qrBtn.className = 'btn secondary-btn';
        qrBtn.innerHTML = '<i class="fas fa-qrcode"></i>';
        qrBtn.title = 'View QR Code';
        qrBtn.dataset.gl = cert.glNumber;
        qrBtn.addEventListener('click', viewQRCode);
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn secondary-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = 'Delete Certificate';
        deleteBtn.dataset.gl = cert.glNumber;
        deleteBtn.addEventListener('click', deleteCertificate);
        actionsCell.appendChild(viewBtn);
        actionsCell.appendChild(qrBtn);
        actionsCell.appendChild(deleteBtn);
        row.appendChild(actionsCell);
        certificatesTableBody.appendChild(row);
      });
    }
  
    function viewCertificate(e) {
      const glNumber = e.currentTarget.dataset.gl;
      const cert = certificates.find(c => c.glNumber === glNumber);
      if (cert && cert.certificate) {
        window.open(cert.certificate, '_blank');
        console.log(`Viewing certificate: ${cert.certificate}`);
      } else {
        alert('Certificate file not uploaded.');
      }
    }
  
    function viewQRCode(e) {
      const glNumber = e.currentTarget.dataset.gl;
      const cert = certificates.find(c => c.glNumber === glNumber);
      if (cert) {
        document.getElementById('qrCodeStudentName').textContent = `${cert.firstName} ${cert.lastName}`;
        document.getElementById('qrGlNumber').textContent = cert.glNumber;
        const scanUrl = `${window.location.origin}/scan.html?gl=${cert.glNumber}`;
        document.getElementById('qrCodeLink').textContent = scanUrl;
        const qrContainer = document.getElementById('qrCodeDisplay');
        qrContainer.innerHTML = cert.qrCode ? `<img src="${cert.qrCode}" width="200" alt="QR Code">` : '<span>QR Code not generated</span>';
        qrCodeModal.classList.remove('hidden');
      }
    }
  
    document.getElementById('downloadQrBtn').addEventListener('click', function() {
      const img = document.querySelector('#qrCodeDisplay img');
      if (img) {
        const link = document.createElement('a');
        link.href = img.src;
        link.download = `qrcode_${document.getElementById('qrGlNumber').textContent}.png`;
        link.click();
        console.log(`QR code downloaded for: ${document.getElementById('qrGlNumber').textContent}`);
      }
    });
  
    document.getElementById('printQrBtn').addEventListener('click', function() {
      const img = document.querySelector('#qrCodeDisplay img');
      if (img) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
          <html>
          <head>
            <title>QR Code - ${document.getElementById('qrGlNumber').textContent}</title>
            <style>
              body { 
                display: flex; 
                justify-content: center;
                align-items: center;
                height: 100vh;
                flex-direction: column;
                font-family: Arial, sans-serif;
              }
              img { 
                max-width: 300px; 
                border: 1px solid #ccc;
              }
              .info {
                margin-top: 20px;
                text-align: center;
              }
              @media print {
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <img src="${img.src}" alt="QR Code">
            <div class="info">
              <p>GL Number: ${document.getElementById('qrGlNumber').textContent}</p>
              <p>Student: ${document.getElementById('qrCodeStudentName').textContent}</p>
            </div>
            <button class="no-print" onclick="window.print();window.close();" style="margin-top:20px; padding:10px 20px;">Print QR Code</button>
          </body>
          </html>
        `);
        printWindow.document.close();
        console.log(`Printing QR code for: ${document.getElementById('qrGlNumber').textContent}`);
      }
    });
  
    async function deleteCertificate(e) {
      const glNumber = e.currentTarget.dataset.gl;
      if (confirm(`Are you sure you want to delete certificate ${glNumber}?`)) {
        try {
          const response = await fetch(`${API_URL}?action=delete&glNumber=${glNumber}`);
          const result = await response.json();
          if (result.success) {
            alert(`Certificate ${glNumber} deleted successfully.`);
            await syncAndFetchCertificates();
          } else {
            alert('Error deleting certificate: ' + (result.error || 'Unknown error'));
          }
        } catch (error) {
          console.error('Error deleting certificate:', error);
          alert('Error deleting certificate: ' + error.message);
        }
      }
    }
  
    searchCertificates.addEventListener('input', renderCertificatesTable);
});