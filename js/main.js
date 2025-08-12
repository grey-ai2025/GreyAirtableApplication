// === CONFIG: Replace these with your own ===
const AIRTABLE_API_KEY = 'pattLmEgp3TVmikeF.1aa58bcac47992cee372e5b52e5aff652f3b43eb4ed0e4a3114ec6351d4dde6c'; // ⚠️ Visible to everyone!
const BASE_ID = 'appglz8osEcl2HeoH';
const TABLE_NAME = 'Table 1'; // Match your table name exactly
const VIEW_NAME = 'Grid view'; // Optional: filter by view
// ===========================================

const API_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}?view=${VIEW_NAME}`;

// Show loader
function showLoader() {
    document.getElementById('loader').style.display = 'block';
    document.getElementById('summary-cards').style.display = 'none';
    document.getElementById('charts-row').style.display = 'none';
    document.getElementById('data-table-container').style.display = 'none';
}

// Hide loader, show content
function hideLoader() {
    document.getElementById('loader').style.display = 'none';
    document.getElementById('summary-cards').style.display = 'flex';
    document.getElementById('charts-row').style.display = 'flex';
    document.getElementById('data-table-container').style.display = 'flex';
}

// Fetch data
async function loadDashboard() {
    showLoader();

    try {
        const response = await fetch(API_URL, {
            headers: {
                Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Airtable API error: ${response.status}`);
        }

        const data = await response.json();
        const records = data.records;

        updateSummaryCards(records);
        renderRegionChart(records);
        renderStatusChart(records);
        populateTable(records);

    } catch (err) {
        console.error('Error loading data:', err);
        document.getElementById('loader').innerHTML = `
      <div class="alert alert-warning text-start">
        <strong>⚠️ Failed to load data</strong><br>
        ${err.message}
      </div>
    `;
    } finally {
        hideLoader();
    }
}

// Update summary cards
function updateSummaryCards(records) {
    const sales = records.map(r => r.fields.Sales || 0);
    const totalSales = sales.reduce((a, b) => a + b, 0);
    const avgSale = sales.length ? (totalSales / sales.length).toFixed(2) : '0.00';

    const regions = records.map(r => r.fields.Region).filter(Boolean);
    const topRegion = mode(regions) || '—';

    document.getElementById('total-sales').textContent = '$' + totalSales.toLocaleString();
    document.getElementById('total-records').textContent = records.length;
    document.getElementById('avg-sale').textContent = '$' + avgSale;
    document.getElementById('top-region').textContent = topRegion;
}

// Helper: Find most frequent item
function mode(arr) {
    const freq = {};
    arr.forEach(item => freq[item] = (freq[item] || 0) + 1);
    return Object.keys(freq).reduce((a, b) => freq[a] > freq[b] ? a : b, null);
}

// Chart: Sales by Region
function renderRegionChart(records) {
    const regionSales = {};
    records.forEach(r => {
        const region = r.fields.Region || 'Unknown';
        regionSales[region] = (regionSales[region] || 0) + (r.fields.Sales || 0);
    });

    const ctx = document.getElementById('regionChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(regionSales),
            datasets: [{
                label: 'Sales ($)',
                data: Object.values(regionSales),
                backgroundColor: '#4e73df',
                borderColor: '#3a58c2',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Chart: Status Distribution
function renderStatusChart(records) {
    const statusCount = {};
    records.forEach(r => {
        const status = r.fields.Status || 'Unknown';
        statusCount[status] = (statusCount[status] || 0) + 1;
    });

    const ctx = document.getElementById('statusChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(statusCount),
            datasets: [{
                data: Object.values(statusCount),
                backgroundColor: ['#1cc88a', '#f6c23e', '#4e73df']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Populate table with Gmail & Outlook buttons
function populateTable(records) {
    const tbody = document.querySelector('#data-table tbody');
    tbody.innerHTML = '';

    records.forEach(r => {
        const product = r.fields.Product || 'a product';
        const name = r.fields.Name || r.fields['Customer Name'] || 'there';
        const email = r.fields.Email || r.fields['Customer Email'] || '';
        const hasValidEmail = email && typeof email === 'string' && email.includes('@');

        const subject = `Follow-up on ${product}`;
        const body = `Hi ${name},

I'm following up on your order for ${product}. Let me know if you have any questions!

Best regards,
[Your Name]`;

        const gmailLink = hasValidEmail
            ? `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
            : '';

        const outlookLink = hasValidEmail
            ? `https://outlook.live.com/owa/?rru=compose&to=${email}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
            : '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${r.fields.Product || '—'}</td>
      <td>$${(r.fields.Sales || 0).toLocaleString()}</td>
      <td>${formatDate(r.fields.Date)}</td>
      <td>${r.fields.Region || '—'}</td>
      <td>${r.fields.Status || '—'}</td>
      <td>
        ${hasValidEmail ? `
          <div class="btn-group btn-group-sm w-100">
            <a href="${gmailLink}" class="btn btn-outline-danger" target="_blank">
              📧 Gmail
            </a>
            <a href="${outlookLink}" class="btn btn-outline-primary" target="_blank">
              📨 Outlook
            </a>
          </div>
        ` : `
          <small class="text-muted">No email</small>
        `}
      </td>
    `;
        tbody.appendChild(tr);
    });
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

// Load when DOM is ready
document.addEventListener('DOMContentLoaded', loadDashboard);