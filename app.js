// ===== NAV LOGIC =====
document.addEventListener('DOMContentLoaded', function() {
  const navLinks = document.querySelectorAll('#sidebarNav a');
  const sections = document.querySelectorAll('.section');

  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = this.dataset.section;

      navLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');

      sections.forEach(s => s.classList.remove('active'));
      document.getElementById('sec-' + target).classList.add('active');

      // Trigger resize on all chart canvases in this section
      setTimeout(() => {
        const sec = document.getElementById('sec-' + target);
        sec.querySelectorAll('canvas').forEach(c => {
          const chart = Chart.getChart(c);
          if (chart) { chart.resize(); chart.update(); }
        });
      }, 50);

      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Show all sections briefly to init charts, then hide
  sections.forEach(s => s.style.display = 'block');
  initOverviewCharts();
  initProfitabilityCharts();
  initRevenueCharts();
  initProductCharts();
  initPaymentCharts();
  initMarketingCharts();
  initCustomerCharts();
  initGeographyCharts();
  initCashflowCharts();
  // Reset sections — only overview visible
  sections.forEach(s => s.style.display = '');
  // Force resize overview
  document.querySelectorAll('#sec-overview canvas').forEach(c => {
    const chart = Chart.getChart(c);
    if (chart) chart.resize();
  });
});

// ===== CHART DEFAULTS =====
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = '#6b7280';
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.pointStyleWidth = 8;
Chart.defaults.plugins.legend.labels.padding = 16;
Chart.defaults.plugins.tooltip.backgroundColor = '#1f2937';
Chart.defaults.plugins.tooltip.titleFont = { size: 12, weight: '600' };
Chart.defaults.plugins.tooltip.bodyFont = { size: 11 };
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.tooltip.cornerRadius = 6;
Chart.defaults.plugins.tooltip.displayColors = true;
Chart.defaults.elements.bar.borderRadius = 4;
Chart.defaults.elements.point.radius = 3;
Chart.defaults.elements.point.hoverRadius = 5;
Chart.defaults.scale.grid.color = '#f3f4f6';

// ===== COLORS =====
const C = {
  teal: '#17b5a3',
  tealLight: 'rgba(23,181,163,0.12)',
  orange: '#f59e0b',
  orangeLight: 'rgba(245,158,11,0.12)',
  red: '#ef4444',
  redLight: 'rgba(239,68,68,0.12)',
  green: '#10b981',
  greenLight: 'rgba(16,185,129,0.12)',
  blue: '#3b82f6',
  blueLight: 'rgba(59,130,246,0.12)',
  gray: '#9ca3af',
  grayLight: 'rgba(156,163,175,0.12)',
  purple: '#8b5cf6',
  pink: '#ec4899',
};

// ===== DATA =====
const months = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const grossSales = [346441, 175501, 261863, 551440, 533735, 854058, 825433, 929292, 902597];
const totalSalesWithTax = [368519, 184080, 256461, 582845, 553901, 872345, 897867, 1032356, 977593];
const netSales = [316677,157121,220922,501683,476425,749055,770932,885067,835101];
const orders = [217,104,160,313,308,511,453,525,507];
const sessions = [31219,12919,14204,25517,28882,47963,70650,66962,78365];

// ===== HELPER: Format INR =====
function fmtINR(val) {
  if (val >= 100000) return '₹' + (val/100000).toFixed(1) + 'L';
  if (val >= 1000) return '₹' + (val/1000).toFixed(1) + 'K';
  return '₹' + val.toLocaleString('en-IN');
}

function fmtNum(val) {
  return val.toLocaleString('en-IN');
}

// ===== OVERVIEW CHARTS =====
function initOverviewCharts() {
  // Revenue Trend
  new Chart(document.getElementById('overviewRevenueChart'), {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Gross Sales',
          data: grossSales,
          borderColor: C.teal,
          backgroundColor: C.tealLight,
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
        },
        {
          label: 'Net Sales',
          data: netSales,
          borderColor: C.blue,
          backgroundColor: C.blueLight,
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          borderDash: [4, 3],
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: { callbacks: { label: ctx => ctx.dataset.label + ': ' + fmtINR(ctx.raw) } }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: v => fmtINR(v) }
        }
      }
    }
  });

  // Orders & Sessions
  new Chart(document.getElementById('overviewOrdersChart'), {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Orders',
          data: orders,
          backgroundColor: C.teal,
          yAxisID: 'y',
          barPercentage: 0.6,
        },
        {
          label: 'Sessions',
          data: sessions,
          type: 'line',
          borderColor: C.orange,
          backgroundColor: 'transparent',
          yAxisID: 'y1',
          tension: 0.35,
          borderWidth: 2,
          pointBackgroundColor: C.orange,
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: { callbacks: { label: ctx => ctx.dataset.label + ': ' + fmtNum(ctx.raw) } }
      },
      scales: {
        y: { beginAtZero: true, position: 'left', title: { display: true, text: 'Orders' } },
        y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Sessions' }, ticks: { callback: v => (v/1000).toFixed(0) + 'K' } }
      }
    }
  });
}

// ===== PROFITABILITY CHARTS =====
function initProfitabilityCharts() {
  // Profit waterfall — horizontal bar chart
  const wfItems = [
    { label: 'Sales Revenue', value: 4350756, color: C.teal },
    { label: 'Closing Stock', value: 1773000, color: C.green },
    { label: 'Purchases (COGS)', value: -2893627, color: '#fca5a5' },
    { label: 'Gross Profit', value: 3230129, color: C.green },
    { label: 'Advertising', value: -2268986, color: C.red },
    { label: 'General Expenses', value: -557858, color: '#fca5a5' },
    { label: 'Promotional', value: -453741, color: '#fca5a5' },
    { label: 'Shipping', value: -442023, color: '#fca5a5' },
    { label: 'Payment Collection', value: -50655, color: '#fca5a5' },
    { label: 'Other Expenses', value: -58501, color: '#fca5a5' },
    { label: 'Net Loss', value: -600636, color: C.red },
  ];

  new Chart(document.getElementById('waterfallChart'), {
    type: 'bar',
    data: {
      labels: wfItems.map(i => i.label),
      datasets: [{
        data: wfItems.map(i => Math.abs(i.value)),
        backgroundColor: wfItems.map(i => i.color),
        barPercentage: 0.65,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const item = wfItems[ctx.dataIndex];
              return item.label + ': ' + fmtINR(item.value);
            }
          }
        }
      },
      scales: {
        x: { ticks: { callback: v => fmtINR(v) } }
      }
    }
  });

  // Expense Breakdown
  new Chart(document.getElementById('expenseBreakdownChart'), {
    type: 'bar',
    data: {
      labels: ['Advertising', 'General Expenses', 'Promotional', 'Shipping', 'Payment Collection', 'Other'],
      datasets: [{
        data: [2268986, 557858, 453741, 442023, 50655, 58501],
        backgroundColor: [C.red, C.orange, C.purple, C.blue, C.teal, C.gray],
        barPercentage: 0.7,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => fmtINR(ctx.raw) } }
      },
      scales: {
        x: { ticks: { callback: v => fmtINR(v) } }
      }
    }
  });
}

// ===== REVENUE CHARTS =====
function initRevenueCharts() {
  // MoM
  const growthPct = grossSales.map((v, i) => i === 0 ? 0 : ((v - grossSales[i-1]) / grossSales[i-1] * 100).toFixed(1));

  new Chart(document.getElementById('revenueMoMChart'), {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{
        label: 'Gross Sales',
        data: grossSales,
        backgroundColor: grossSales.map((v, i) => i > 0 && v > grossSales[i-1] ? C.teal : i === 0 ? C.teal : C.orange),
        barPercentage: 0.65,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => fmtINR(ctx.raw),
            afterLabel: ctx => 'MoM: ' + (ctx.dataIndex === 0 ? '—' : growthPct[ctx.dataIndex] + '%')
          }
        }
      },
      scales: {
        y: { ticks: { callback: v => fmtINR(v) } }
      }
    }
  });

  // Revenue Gap
  new Chart(document.getElementById('revenueGapChart'), {
    type: 'bar',
    data: {
      labels: ['Shopify Revenue', 'Tally Revenue', 'Gap'],
      datasets: [{
        data: [5380000, 4349782, 1030218],
        backgroundColor: [C.teal, C.blue, C.red],
        barPercentage: 0.55,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => fmtINR(ctx.raw) } }
      },
      scales: {
        y: { ticks: { callback: v => fmtINR(v) } }
      }
    }
  });

  // Discount by month
  const discounts = [22118, 16700, 35847, 40091, 50500, 89844, 30111, 37023, 63137];
  new Chart(document.getElementById('discountChart'), {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{
        label: 'Discounts',
        data: discounts,
        backgroundColor: C.orange,
        barPercentage: 0.6,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => '₹' + fmtNum(ctx.raw) } }
      },
      scales: {
        y: { ticks: { callback: v => '₹' + (v/1000).toFixed(0) + 'K' } }
      }
    }
  });

  // Returns
  const returnValues = [7646, 1680, 5094, 9666, 6810, 15159, 24390, 7203, 4359];
  const returnOrders = [23, 12, 29, 33, 40, 65, 36, 32, 49];

  new Chart(document.getElementById('returnsChart'), {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Return Value (₹)',
          data: returnValues,
          backgroundColor: C.red,
          yAxisID: 'y',
          barPercentage: 0.5,
        },
        {
          label: 'Return Orders',
          data: returnOrders,
          type: 'line',
          borderColor: C.orange,
          backgroundColor: 'transparent',
          yAxisID: 'y1',
          tension: 0.3,
          borderWidth: 2,
          pointBackgroundColor: C.orange,
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: { callbacks: { label: ctx => ctx.datasetIndex === 0 ? '₹' + fmtNum(ctx.raw) : ctx.raw + ' orders' } }
      },
      scales: {
        y: { beginAtZero: true, position: 'left', title: { display: true, text: 'Value (₹)' }, ticks: { callback: v => '₹' + (v/1000).toFixed(0) + 'K' } },
        y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Orders' } }
      }
    }
  });
}

// ===== PRODUCT CHARTS =====
function initProductCharts() {
  const products = [
    { name: 'Gingham Grace dress', units: 1703, revenue: 2771248, share: 51.5 },
    { name: 'Wine Bodycon Dress', units: 289, revenue: 514853, share: 9.6 },
    { name: 'Pink Gingham Grace dress', units: 297, revenue: 492664, share: 9.2 },
    { name: 'Cherry Blossom Dress', units: 160, revenue: 342503, share: 6.4 },
    { name: 'Blue Breeze Shirt Dress', units: 140, revenue: 235627, share: 4.4 },
    { name: 'Belle Ruched Dress', units: 129, revenue: 204560, share: 3.8 },
    { name: 'Marilyn striped dress', units: 86, revenue: 143496, share: 2.7 },
    { name: 'Blue gingham Grace Dress', units: 81, revenue: 134187, share: 2.5 },
    { name: 'PINK PUFF Long Dress', units: 39, revenue: 87229, share: 1.6 },
    { name: 'Sera red dress', units: 45, revenue: 67495, share: 1.3 },
    { name: 'Moonlit skater dress', units: 40, revenue: 64361, share: 1.2 },
    { name: 'Country Breeze Gingham Dress', units: 35, revenue: 59527, share: 1.1 },
    { name: 'RUBY SLIT LONG DRESS', units: 22, revenue: 42652, share: 0.8 },
    { name: 'Margot Bodycon Dress', units: 25, revenue: 45979, share: 0.9 },
    { name: 'Eden bloom dress', units: 14, revenue: 21268, share: 0.4 },
  ];

  const tbody = document.querySelector('#productsTable tbody');
  products.forEach((p, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td><td class="${i === 0 ? 'font-bold' : ''}">${p.name}</td><td class="text-right">${fmtNum(p.units)}</td><td class="text-right">${fmtINR(p.revenue)}</td><td class="text-right font-bold">${p.share}%</td>`;
    tbody.appendChild(tr);
  });

  // Concentration
  new Chart(document.getElementById('productConcentrationChart'), {
    type: 'bar',
    data: {
      labels: products.slice(0, 8).map(p => p.name.length > 18 ? p.name.slice(0,18)+'…' : p.name),
      datasets: [{
        data: products.slice(0, 8).map(p => p.share),
        backgroundColor: products.slice(0, 8).map((p, i) => i === 0 ? C.red : i < 3 ? C.orange : C.teal),
        barPercentage: 0.7,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ctx.raw + '% of revenue' } }
      },
      scales: {
        x: { max: 60, ticks: { callback: v => v + '%' } }
      }
    }
  });

  // Size Distribution
  new Chart(document.getElementById('sizeChart'), {
    type: 'doughnut',
    data: {
      labels: ['M', 'S', 'L', 'XS', 'XL'],
      datasets: [{
        data: [862, 690, 672, 564, 437],
        backgroundColor: [C.teal, C.blue, C.orange, C.green, C.purple],
        borderWidth: 2,
        borderColor: '#fff',
      }]
    },
    options: {
      responsive: true,
      cutout: '55%',
      plugins: {
        tooltip: { callbacks: { label: ctx => ctx.label + ': ' + fmtNum(ctx.raw) + ' units' } }
      }
    }
  });
}

// ===== PAYMENT CHARTS =====
function initPaymentCharts() {
  // Cancel rate comparison
  new Chart(document.getElementById('cancelRateChart'), {
    type: 'bar',
    data: {
      labels: ['COD Cancel Rate', 'Prepaid Cancel Rate'],
      datasets: [{
        data: [4.2, 0.8],
        backgroundColor: [C.red, C.green],
        barPercentage: 0.5,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Cancellation Rate — COD vs Prepaid', font: { size: 13, weight: '700' }, color: '#1f2937' },
        tooltip: { callbacks: { label: ctx => ctx.raw + '%' } }
      },
      scales: {
        y: { ticks: { callback: v => v + '%' }, max: 6 }
      }
    }
  });

  // AOV comparison
  new Chart(document.getElementById('paymentAovChart'), {
    type: 'bar',
    data: {
      labels: ['COD AOV', 'Prepaid AOV'],
      datasets: [{
        data: [2044, 1844],
        backgroundColor: [C.orange, C.teal],
        barPercentage: 0.5,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Average Order Value by Payment', font: { size: 13, weight: '700' }, color: '#1f2937' },
        tooltip: { callbacks: { label: ctx => '₹' + fmtNum(ctx.raw) } }
      },
      scales: {
        y: { ticks: { callback: v => '₹' + fmtNum(v) }, beginAtZero: false, min: 1500 }
      }
    }
  });
}

// ===== MARKETING CHARTS =====
function initMarketingCharts() {
  // ROAS benchmark
  new Chart(document.getElementById('roasChart'), {
    type: 'bar',
    data: {
      labels: ['DIOSTE ROAS (Tally)', 'Minimum Target', 'Industry Avg'],
      datasets: [{
        data: [1.92, 3.0, 3.5],
        backgroundColor: [C.red, C.orange, C.green],
        barPercentage: 0.5,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ctx.raw + 'x' } }
      },
      scales: {
        y: { beginAtZero: true, max: 5, ticks: { callback: v => v + 'x' } }
      }
    }
  });

  // Ad spend gap
  new Chart(document.getElementById('adSpendGapChart'), {
    type: 'bar',
    data: {
      labels: ['Bank Payments (Apr-Dec)', 'Tally Books (Apr-Dec)', 'Meta Report (Apr-Feb)'],
      datasets: [{
        data: [693000, 2152886, 2583302],
        backgroundColor: [C.blue, C.orange, C.red],
        barPercentage: 0.45,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => fmtINR(ctx.raw) } }
      },
      scales: {
        y: { ticks: { callback: v => fmtINR(v) } }
      }
    }
  });
}

// ===== CUSTOMER CHARTS =====
function initCustomerCharts() {
  const retRates = [0, 0, 0, 0, 0.2, 0, 0, 0, 0];

  new Chart(document.getElementById('returningRateChart'), {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{
        label: 'Returning Customer Rate',
        data: retRates,
        backgroundColor: retRates.map(v => v > 0 ? C.teal : C.grayLight),
        borderColor: retRates.map(v => v > 0 ? C.teal : '#e5e7eb'),
        borderWidth: 1,
        barPercentage: 0.6,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ctx.raw + '%' } }
      },
      scales: {
        y: { max: 1, ticks: { callback: v => v + '%' } }
      }
    }
  });

  // Order frequency
  new Chart(document.getElementById('orderFreqChart'), {
    type: 'bar',
    data: {
      labels: ['1 Order', '2 Orders', '3+ Orders'],
      datasets: [{
        data: [2470, 225, 30],
        backgroundColor: [C.gray, C.teal, C.green],
        barPercentage: 0.55,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => fmtNum(ctx.raw) + ' customers' } }
      },
      scales: {
        y: { ticks: { callback: v => fmtNum(v) } }
      }
    }
  });
}

// ===== GEOGRAPHY CHARTS =====
function initGeographyCharts() {
  const stateLabels = ['KA','MH','TN','TS','UP','GJ','KL','DL','HR','WB','AP','RJ','OR','MP','AS'];
  const stateOrders = [634,619,322,300,141,138,132,125,93,81,70,52,47,46,40];
  const stateNames = ['Karnataka','Maharashtra','Tamil Nadu','Telangana','Uttar Pradesh','Gujarat','Kerala','Delhi','Haryana','West Bengal','Andhra Pradesh','Rajasthan','Odisha','Madhya Pradesh','Assam'];

  new Chart(document.getElementById('stateOrdersChart'), {
    type: 'bar',
    data: {
      labels: stateNames,
      datasets: [{
        data: stateOrders,
        backgroundColor: stateOrders.map((v, i) => i < 2 ? C.teal : i < 5 ? C.blue : C.gray),
        barPercentage: 0.7,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => fmtNum(ctx.raw) + ' orders' } }
      }
    }
  });

  const cities = ['Bangalore','Mumbai','Hyderabad','Pune','Chennai','Thane','Gurgaon','K.V.Rangareddy','Ahmedabad','Coimbatore','Ernakulam','Kanchipuram','Tiruvallur','Kolkata','Gautam B. Nagar'];
  const cityOrders = [502,254,170,161,110,99,61,60,56,53,46,41,38,37,35];

  new Chart(document.getElementById('cityOrdersChart'), {
    type: 'bar',
    data: {
      labels: cities,
      datasets: [{
        data: cityOrders,
        backgroundColor: cityOrders.map((v, i) => i === 0 ? C.teal : i < 5 ? C.blue : C.gray),
        barPercentage: 0.7,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => fmtNum(ctx.raw) + ' orders' } }
      }
    }
  });

  // Sessions vs Orders by state
  const sessionsByState = [58826,69034,30106,30934,11074,20201,19696,23628,5733,11983,4803,7578,5809,8120,7282];

  new Chart(document.getElementById('sessionsVsOrdersChart'), {
    type: 'bar',
    data: {
      labels: stateNames,
      datasets: [
        {
          label: 'Orders',
          data: stateOrders,
          backgroundColor: C.teal,
          yAxisID: 'y',
          barPercentage: 0.6,
        },
        {
          label: 'Sessions',
          data: sessionsByState,
          type: 'line',
          borderColor: C.orange,
          backgroundColor: 'transparent',
          yAxisID: 'y1',
          tension: 0.3,
          borderWidth: 2,
          pointBackgroundColor: C.orange,
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, position: 'left', title: { display: true, text: 'Orders' } },
        y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Sessions' }, ticks: { callback: v => (v/1000).toFixed(0) + 'K' } }
      }
    }
  });
}

// ===== CASHFLOW CHARTS =====
function initCashflowCharts() {
  // Daily balance
  const dailyData = [
    {d:'Apr 02',v:210740},{d:'Apr 10',v:109270},{d:'Apr 20',v:116975},{d:'Apr 30',v:120579},
    {d:'May 10',v:148154},{d:'May 20',v:179121},{d:'May 31',v:118996},
    {d:'Jun 10',v:66687},{d:'Jun 20',v:106871},{d:'Jun 30',v:77134},
    {d:'Jul 10',v:36082},{d:'Jul 20',v:78105},{d:'Jul 31',v:164026},
    {d:'Aug 10',v:86289},{d:'Aug 20',v:28997},{d:'Aug 30',v:136679},
    {d:'Sep 05',v:227604},{d:'Sep 10',v:338274},{d:'Sep 17',v:10128},{d:'Sep 29',v:14542},
    {d:'Oct 01',v:542},{d:'Oct 02',v:0},
    {d:'Nov 19',v:1900},{d:'Nov 24',v:59},{d:'Nov 28',v:35},
    {d:'Dec 05',v:0},{d:'Dec 10',v:0},{d:'Dec 14',v:0},{d:'Dec 20',v:0},{d:'Dec 28',v:1640},
    {d:'Jan 04',v:0},{d:'Jan 06',v:0},{d:'Jan 15',v:2174}
  ];

  new Chart(document.getElementById('dailyBalanceChart'), {
    type: 'line',
    data: {
      labels: dailyData.map(d => d.d),
      datasets: [{
        label: 'Bank Balance',
        data: dailyData.map(d => d.v),
        borderColor: C.red,
        backgroundColor: 'rgba(239,68,68,0.08)',
        fill: true,
        tension: 0.2,
        borderWidth: 2,
        pointRadius: 2,
        pointBackgroundColor: dailyData.map(d => d.v === 0 ? C.red : C.blue),
        pointBorderColor: dailyData.map(d => d.v === 0 ? C.red : 'transparent'),
        pointRadius: dailyData.map(d => d.v === 0 ? 5 : 2),
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: { callbacks: { label: ctx => fmtINR(ctx.raw) } },
        annotation: undefined
      },
      scales: {
        y: { beginAtZero: true, ticks: { callback: v => fmtINR(v) } },
        x: { ticks: { maxRotation: 45, font: { size: 10 } } }
      }
    }
  });

  // Monthly Inflow vs Outflow
  const bankMonths = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan'];
  const credits = [309992,181246,182712,530276,630297,417893,0,69422,274364,109211];
  const debits = [392178,181759,222893,451466,650742,520046,14542,69387,273578,107858];

  new Chart(document.getElementById('inflowOutflowChart'), {
    type: 'bar',
    data: {
      labels: bankMonths,
      datasets: [
        { label: 'Credits (In)', data: credits, backgroundColor: C.green, barPercentage: 0.6 },
        { label: 'Debits (Out)', data: debits, backgroundColor: C.red, barPercentage: 0.6 }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: { callbacks: { label: ctx => ctx.dataset.label + ': ' + fmtINR(ctx.raw) } }
      },
      scales: {
        y: { ticks: { callback: v => fmtINR(v) } }
      }
    }
  });

  // Inflow donut
  new Chart(document.getElementById('inflowDonutChart'), {
    type: 'doughnut',
    data: {
      labels: ['Razorpay', 'Shiprocket COD', 'Other Credits'],
      datasets: [{
        data: [40, 33, 27],
        backgroundColor: [C.teal, C.orange, C.gray],
        borderWidth: 2,
        borderColor: '#fff',
      }]
    },
    options: {
      responsive: true,
      cutout: '55%',
      plugins: {
        tooltip: { callbacks: { label: ctx => ctx.label + ': ' + ctx.raw + '%' } }
      }
    }
  });

  // Outflow donut
  new Chart(document.getElementById('outflowDonutChart'), {
    type: 'doughnut',
    data: {
      labels: ['Self Transfer', 'Meta Ads', 'NOWDEZ', 'Other'],
      datasets: [{
        data: [26, 24, 21, 29],
        backgroundColor: [C.purple, C.red, C.orange, C.gray],
        borderWidth: 2,
        borderColor: '#fff',
      }]
    },
    options: {
      responsive: true,
      cutout: '55%',
      plugins: {
        tooltip: { callbacks: { label: ctx => ctx.label + ': ' + ctx.raw + '%' } }
      }
    }
  });
}
