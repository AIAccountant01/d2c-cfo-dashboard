// ===== AI ACCOUNTANT — DASHBOARD APP ===== //
// Fetches data from /api/data and populates the entire dashboard

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
var C = {
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

// ===== HELPER: Format INR =====
function fmtINR(val) {
  if (val >= 100000) return '\u20B9' + (val/100000).toFixed(1) + 'L';
  if (val >= 1000) return '\u20B9' + (val/1000).toFixed(1) + 'K';
  return '\u20B9' + val.toLocaleString('en-IN');
}

function fmtNum(val) {
  return val.toLocaleString('en-IN');
}

// ===== WATERFALL COLOR MAP =====
var waterfallColorMap = {
  teal: C.teal,
  green: C.green,
  red: C.red,
  redLight: '#fca5a5'
};

// ===== NAV LOGIC =====
document.addEventListener('DOMContentLoaded', function() {
  var navLinks = document.querySelectorAll('#sidebarNav a');
  var sections = document.querySelectorAll('.section');

  navLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      var target = this.dataset.section;

      navLinks.forEach(function(l) { l.classList.remove('active'); });
      this.classList.add('active');

      sections.forEach(function(s) { s.classList.remove('active'); });
      document.getElementById('sec-' + target).classList.add('active');

      setTimeout(function() {
        var sec = document.getElementById('sec-' + target);
        sec.querySelectorAll('canvas').forEach(function(c) {
          var chart = Chart.getChart(c);
          if (chart) { chart.resize(); chart.update(); }
        });
      }, 50);

      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Fetch dashboard data
  fetchDashboardData();
});

// ===== FETCH DATA =====
function fetchDashboardData() {
  var token = window.AIA && window.AIA.Session.getToken();
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  fetch('/api/data', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    }
  })
  .then(function(res) {
    if (res.status === 401) {
      window.location.href = 'login.html';
      throw new Error('Unauthorized');
    }
    return res.json();
  })
  .then(function(data) {
    populateDashboard(data);
  })
  .catch(function(err) {
    if (err.message !== 'Unauthorized') {
      console.error('Failed to load dashboard data:', err);
    }
  });
}

// ===== POPULATE DASHBOARD =====
function populateDashboard(data) {
  var sections = document.querySelectorAll('.section');

  // Set text helper
  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }
  function setHTML(id, val) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = val;
  }

  // ===== OVERVIEW =====
  var ov = data.overview;
  setText('kpi-grossSales', ov.kpis.grossSales);
  setText('kpi-grossSalesSub', ov.kpis.grossSalesSub);
  setText('kpi-netSales', ov.kpis.netSales);
  setText('kpi-netSalesSub', ov.kpis.netSalesSub);
  setText('kpi-totalOrders', ov.kpis.totalOrders);
  setText('kpi-totalOrdersSub', ov.kpis.totalOrdersSub);
  setText('kpi-aov', ov.kpis.aov);
  setText('kpi-aovSub', ov.kpis.aovSub);
  setText('kpi-totalSessions', ov.kpis.totalSessions);
  setText('kpi-sessionsSub', ov.kpis.sessionsSub);
  setText('kpi-conversionRate', ov.kpis.conversionRate);
  setText('kpi-conversionSub', ov.kpis.conversionSub);
  setText('kpi-returnRate', ov.kpis.returnRate);
  setText('kpi-returnRateSub', ov.kpis.returnRateSub);
  setText('kpi-netMargin', ov.kpis.netMargin);
  setText('kpi-netMarginSub', ov.kpis.netMarginSub);
  setHTML('overview-advisory', ov.summary);

  // ===== PROFITABILITY =====
  var prof = data.profitability;
  setText('kpi-grossMargin', prof.kpis.grossMargin);
  setText('kpi-grossMarginSub', prof.kpis.grossMarginSub);
  setText('kpi-profitNetMargin', prof.kpis.netMargin);
  setText('kpi-profitNetMarginSub', prof.kpis.netMarginSub);
  setText('kpi-cogs', prof.kpis.cogs);
  setText('kpi-cogsSub', prof.kpis.cogsSub);
  setText('kpi-totalExpenses', prof.kpis.totalExpenses);
  setText('kpi-totalExpensesSub', prof.kpis.totalExpensesSub);

  // P&L table
  var pnlTbody = document.querySelector('#pnlTable tbody');
  if (pnlTbody) {
    pnlTbody.innerHTML = '';
    prof.pnl.forEach(function(row) {
      var tr = document.createElement('tr');
      var cls = '';
      if (row.type === 'total') cls = 'pnl-row-total';
      else if (row.type === 'subtotal') cls = 'pnl-row-subtotal';
      else if (row.type === 'indent') cls = 'pnl-row-indent';
      else if (row.type === 'bold') cls = 'pnl-row-bold';
      tr.className = cls;
      tr.innerHTML = '<td>' + row.label + '</td><td class="text-right ' + (row.class || '') + '">' + row.value + '</td>';
      pnlTbody.appendChild(tr);
    });
  }

  setHTML('profitability-advisory', prof.advisory);
  setText('profitability-dataGap', prof.dataGap);

  // ===== REVENUE =====
  var rev = data.revenue;
  setText('kpi-shopifyRevenue', rev.kpis.shopifyRevenue);
  setText('kpi-shopifyRevenueSub', rev.kpis.shopifyRevenueSub);
  setText('kpi-tallyRevenue', rev.kpis.tallyRevenue);
  setText('kpi-tallyRevenueSub', rev.kpis.tallyRevenueSub);
  setText('kpi-revenueGap', rev.kpis.gap);
  setText('kpi-revenueGapSub', rev.kpis.gapSub);
  setText('kpi-discountPct', rev.kpis.discountPct);
  setText('kpi-discountPctSub', rev.kpis.discountPctSub);
  setText('revenue-gapChartSub', 'Shopify vs Tally \u2014 ' + rev.kpis.gap + ' gap');
  setText('revenue-discountSub', rev.totalDiscounts + ' total discounts given');

  // Discount codes table
  var dcTbody = document.querySelector('#discountCodesTable tbody');
  if (dcTbody) {
    dcTbody.innerHTML = '';
    rev.discountCodes.forEach(function(dc, i) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td' + (i === 0 ? ' class="font-bold"' : '') + '>' + dc.code + '</td><td class="text-right">' + dc.orders + '</td>';
      dcTbody.appendChild(tr);
    });
  }

  setHTML('revenue-advisory', rev.advisory);

  // ===== PRODUCTS =====
  var prod = data.products;
  setText('products-concentrationSub', prod.concentrationSub);
  setHTML('products-deadStockAlert', prod.deadStockAlert);
  setHTML('products-inventoryNote', prod.inventoryNote);
  setHTML('products-advisory', prod.advisory);

  // Products table
  var prodTbody = document.querySelector('#productsTable tbody');
  if (prodTbody) {
    prodTbody.innerHTML = '';
    prod.items.forEach(function(p, i) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + (i+1) + '</td><td class="' + (i === 0 ? 'font-bold' : '') + '">' + p.name + '</td><td class="text-right">' + fmtNum(p.units) + '</td><td class="text-right">' + fmtINR(p.revenue) + '</td><td class="text-right font-bold">' + p.share + '%</td>';
      prodTbody.appendChild(tr);
    });
  }

  // ===== PAYMENTS =====
  var pay = data.payments;
  setText('kpi-codOrders', pay.kpis.codOrders);
  setText('kpi-codOrdersSub', pay.kpis.codSub);
  setText('kpi-prepaidOrders', pay.kpis.prepaidOrders);
  setText('kpi-prepaidOrdersSub', pay.kpis.prepaidSub);
  setText('kpi-codAov', pay.kpis.codAov);
  setText('kpi-codAovSub', pay.kpis.codAovSub);
  setText('kpi-prepaidAov', pay.kpis.prepaidAov);
  setText('kpi-prepaidAovSub', pay.kpis.prepaidAovSub);

  // Stacked bar
  var stackedBar = document.getElementById('payments-stackedBar');
  if (stackedBar) {
    stackedBar.innerHTML =
      '<div class="bar-segment" style="width:' + pay.kpis.codShare + ';background:var(--orange);">COD ' + pay.kpis.codShare + '</div>' +
      '<div class="bar-segment" style="width:' + pay.kpis.prepaidShare + ';background:var(--teal);">Prepaid ' + pay.kpis.prepaidShare + '</div>' +
      '<div class="bar-segment" style="width:' + pay.kpis.otherShare + ';background:var(--gray-300);font-size:9px;">Other</div>';
  }

  setHTML('payments-rtoAlert', pay.rtoAlert);
  setHTML('payments-unfulfilledAlert', pay.unfulfilledAlert);
  setHTML('payments-advisory', pay.advisory);

  // ===== MARKETING =====
  var mkt = data.marketing;
  setText('kpi-tallyAdSpend', mkt.kpis.tallyAdSpend);
  setText('kpi-tallyAdSpendSub', mkt.kpis.tallyAdSpendSub);
  setText('kpi-purchases', mkt.kpis.purchases);
  setText('kpi-purchasesSub', mkt.kpis.purchasesSub);
  setText('kpi-roas', mkt.kpis.roas);
  setText('kpi-roasSub', mkt.kpis.roasSub);
  setText('kpi-metaSpend', mkt.kpis.metaSpend);
  setText('kpi-metaSpendSub', mkt.kpis.metaSpendSub);
  setText('kpi-metaROAS', mkt.kpis.metaROAS);
  setText('kpi-metaROASSub', mkt.kpis.metaROASSub);
  setText('kpi-avgCPA', mkt.kpis.avgCPA);
  setText('kpi-avgCPASub', mkt.kpis.avgCPASub);
  setText('kpi-totalReach', mkt.kpis.totalReach);
  setText('kpi-totalReachSub', mkt.kpis.totalReachSub);
  if (mkt.metaAds) {
    var mo = mkt.metaAds.overview;
    setText('kpi-activeCampaigns', mo.activeCampaigns + ' / ' + mo.totalCampaigns);
    setText('kpi-activeCampaignsSub', mo.totalCampaigns + ' total, ' + (mo.totalCampaigns - mo.activeCampaigns) + ' paused');
  }
  setHTML('marketing-advisory', mkt.advisory);
  if (mkt.dataGap) {
    setHTML('marketing-dataGap', mkt.dataGap);
    var gapEl = document.getElementById('marketing-gap-note');
    if (gapEl) gapEl.style.display = 'flex';
  }

  // ===== CUSTOMERS =====
  var cust = data.customers;
  setText('kpi-uniqueCustomers', cust.kpis.uniqueCustomers);
  setText('kpi-uniqueCustomersSub', cust.kpis.uniqueCustomersSub);
  setText('kpi-repeatRate', cust.kpis.repeatRate);
  setText('kpi-repeatRateSub', cust.kpis.repeatRateSub);
  setText('kpi-oneTimeBuyers', cust.kpis.oneTimeBuyers);
  setText('kpi-oneTimeSub', cust.kpis.oneTimeSub);
  setText('kpi-repeatCustomers', cust.kpis.repeatCustomers);
  setText('kpi-repeatSub', cust.kpis.repeatSub);
  setHTML('customers-advisory', cust.advisory);
  setText('customers-dataGap', cust.dataGap);

  // ===== GEOGRAPHY =====
  setHTML('geography-advisory', data.geography.advisory);

  // ===== CASHFLOW =====
  var cf = data.cashflow;
  setText('kpi-openingBalance', cf.kpis.openingBalance);
  setText('kpi-openingSub', cf.kpis.openingSub);
  setText('kpi-closingBalance', cf.kpis.closingBalance);
  setText('kpi-closingSub', cf.kpis.closingSub);
  setText('kpi-netOutflow', cf.kpis.netOutflow);
  setText('kpi-netOutflowSub', cf.kpis.netOutflowSub);
  setText('kpi-timesAtZero', cf.kpis.timesAtZero);
  setText('kpi-timesAtZeroSub', cf.kpis.timesAtZeroSub);
  setText('cashflow-zeroAlertTitle', cf.zeroAlertTitle);
  setHTML('cashflow-zeroAlert', cf.zeroAlert);
  setText('cashflow-vendorPayablesSub', cf.vendorPayablesSub);
  setHTML('cashflow-advisory', cf.advisory);

  // Vendor payables table
  var vpTbody = document.querySelector('#vendorPayablesTable tbody');
  if (vpTbody) {
    vpTbody.innerHTML = '';
    cf.vendorPayables.forEach(function(vp, i) {
      var tr = document.createElement('tr');
      var isTotal = vp.vendor === 'Total Payable';
      if (isTotal) tr.className = 'pnl-row-total';
      tr.innerHTML = '<td' + (!isTotal && i === 0 ? ' class="font-bold"' : '') + '>' + vp.vendor + '</td>' +
        '<td class="text-right' + (isTotal || i === 0 ? ' text-red' : '') + '">' + vp.amount + '</td>' +
        '<td class="text-right">' + vp.aging + '</td>' +
        '<td class="text-right">' + vp.share + '</td>';
      vpTbody.appendChild(tr);
    });
  }

  // ===== NOTIFICATIONS =====
  var notifList = document.getElementById('notifList');
  if (notifList && data.notifications) {
    notifList.innerHTML = '';
    data.notifications.forEach(function(n) {
      var iconMap = { warning: '\u26A0\uFE0F', alert: '\uD83D\uDD34', info: '\u2139\uFE0F' };
      var div = document.createElement('div');
      div.className = 'notif-item';
      div.innerHTML = '<span class="notif-icon">' + (iconMap[n.type] || '\u2139\uFE0F') + '</span><div><strong>' + n.title + '</strong><p style="margin:2px 0 0;font-size:12px;color:#6b7280;">' + n.desc + '</p></div>';
      notifList.appendChild(div);
    });
  }

  // ===== INSIGHTS =====
  var insightsContainer = document.getElementById('insightsContainer');
  if (insightsContainer && data.insights) {
    insightsContainer.innerHTML = '';
    data.insights.forEach(function(ins) {
      var severityBadge = ins.severity === 'CRITICAL' ? 'badge-red' : ins.severity === 'WARNING' ? 'badge-orange' : 'badge-green';
      var numColor = ins.borderColor;
      var actions = ins.actions.map(function(a) { return '<li>' + a + '</li>'; }).join('');
      var card = document.createElement('div');
      card.className = 'insight-card border-' + ins.borderColor;
      card.innerHTML =
        '<div class="insight-number ' + numColor + '">' + ins.number + '</div>' +
        '<div class="insight-content">' +
          '<div class="insight-header">' +
            '<span class="insight-title">' + ins.title + '</span>' +
            '<span class="badge ' + severityBadge + '">' + ins.severity + '</span>' +
          '</div>' +
          '<div class="insight-body">' + ins.body + '</div>' +
          '<div class="insight-actions">' +
            '<strong>Recommended Actions</strong>' +
            '<ul>' + actions + '</ul>' +
          '</div>' +
        '</div>';
      insightsContainer.appendChild(card);
    });
  }

  // ===== DATA STATUS =====
  var dsAvail = document.getElementById('dataStatus-available');
  var dsPend = document.getElementById('dataStatus-pending');
  if (dsAvail && data.dataStatus) {
    dsAvail.innerHTML = '';
    data.dataStatus.available.forEach(function(item) {
      var li = document.createElement('li');
      li.innerHTML = '<span class="status-dot green"></span> ' + item;
      dsAvail.appendChild(li);
    });
  }
  if (dsPend && data.dataStatus) {
    dsPend.innerHTML = '';
    data.dataStatus.pending.forEach(function(item) {
      var li = document.createElement('li');
      li.innerHTML = '<span class="status-dot red"></span> ' + item;
      dsPend.appendChild(li);
    });
  }

  // ===== INIT ALL CHARTS =====
  sections.forEach(function(s) { s.style.display = 'block'; });

  initOverviewCharts(data);
  initProfitabilityCharts(data);
  initRevenueCharts(data);
  initProductCharts(data);
  initPaymentCharts(data);
  initMarketingCharts(data);
  initCustomerCharts(data);
  initGeographyCharts(data);
  initCashflowCharts(data);

  sections.forEach(function(s) { s.style.display = ''; });

  // Force resize overview
  document.querySelectorAll('#sec-overview canvas').forEach(function(c) {
    var chart = Chart.getChart(c);
    if (chart) chart.resize();
  });

  // Hide loading overlay
  var overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.style.display = 'none';
}

// ===== OVERVIEW CHARTS =====
function initOverviewCharts(data) {
  var ch = data.charts;

  new Chart(document.getElementById('overviewRevenueChart'), {
    type: 'line',
    data: {
      labels: ch.months,
      datasets: [
        {
          label: 'Gross Sales',
          data: ch.grossSales,
          borderColor: C.teal,
          backgroundColor: C.tealLight,
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
        },
        {
          label: 'Net Sales',
          data: ch.netSales,
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
        tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ': ' + fmtINR(ctx.raw); } } }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: function(v) { return fmtINR(v); } }
        }
      }
    }
  });

  new Chart(document.getElementById('overviewOrdersChart'), {
    type: 'bar',
    data: {
      labels: ch.months,
      datasets: [
        {
          label: 'Orders',
          data: ch.orders,
          backgroundColor: C.teal,
          yAxisID: 'y',
          barPercentage: 0.6,
        },
        {
          label: 'Sessions',
          data: ch.sessions,
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
        tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ': ' + fmtNum(ctx.raw); } } }
      },
      scales: {
        y: { beginAtZero: true, position: 'left', title: { display: true, text: 'Orders' } },
        y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Sessions' }, ticks: { callback: function(v) { return (v/1000).toFixed(0) + 'K'; } } }
      }
    }
  });
}

// ===== PROFITABILITY CHARTS =====
function initProfitabilityCharts(data) {
  var prof = data.profitability;

  var wfItems = prof.waterfall.map(function(w) {
    return { label: w.label, value: w.value, color: waterfallColorMap[w.color] || C.gray };
  });

  new Chart(document.getElementById('waterfallChart'), {
    type: 'bar',
    data: {
      labels: wfItems.map(function(i) { return i.label; }),
      datasets: [{
        data: wfItems.map(function(i) { return Math.abs(i.value); }),
        backgroundColor: wfItems.map(function(i) { return i.color; }),
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
            label: function(ctx) {
              var item = wfItems[ctx.dataIndex];
              return item.label + ': ' + fmtINR(item.value);
            }
          }
        }
      },
      scales: {
        x: { ticks: { callback: function(v) { return fmtINR(v); } } }
      }
    }
  });

  var eb = prof.expenseBreakdown;
  new Chart(document.getElementById('expenseBreakdownChart'), {
    type: 'bar',
    data: {
      labels: eb.labels,
      datasets: [{
        data: eb.data,
        backgroundColor: [C.red, C.orange, C.purple, C.blue, C.teal, C.gray],
        barPercentage: 0.7,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: function(ctx) { return fmtINR(ctx.raw); } } }
      },
      scales: {
        x: { ticks: { callback: function(v) { return fmtINR(v); } } }
      }
    }
  });
}

// ===== REVENUE CHARTS =====
function initRevenueCharts(data) {
  var ch = data.charts;
  var rev = data.revenue;

  var growthPct = ch.grossSales.map(function(v, i) {
    return i === 0 ? 0 : ((v - ch.grossSales[i-1]) / ch.grossSales[i-1] * 100).toFixed(1);
  });

  new Chart(document.getElementById('revenueMoMChart'), {
    type: 'bar',
    data: {
      labels: ch.months,
      datasets: [{
        label: 'Gross Sales',
        data: ch.grossSales,
        backgroundColor: ch.grossSales.map(function(v, i) { return i > 0 && v > ch.grossSales[i-1] ? C.teal : i === 0 ? C.teal : C.orange; }),
        barPercentage: 0.65,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(ctx) { return fmtINR(ctx.raw); },
            afterLabel: function(ctx) { return 'MoM: ' + (ctx.dataIndex === 0 ? '\u2014' : growthPct[ctx.dataIndex] + '%'); }
          }
        }
      },
      scales: {
        y: { ticks: { callback: function(v) { return fmtINR(v); } } }
      }
    }
  });

  new Chart(document.getElementById('revenueGapChart'), {
    type: 'bar',
    data: {
      labels: ['Shopify Revenue', 'Tally Revenue', 'Gap'],
      datasets: [{
        data: [rev.shopifyRevenueRaw, rev.tallyRevenueRaw, rev.gapRaw],
        backgroundColor: [C.teal, C.blue, C.red],
        barPercentage: 0.55,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: function(ctx) { return fmtINR(ctx.raw); } } }
      },
      scales: {
        y: { ticks: { callback: function(v) { return fmtINR(v); } } }
      }
    }
  });

  new Chart(document.getElementById('discountChart'), {
    type: 'bar',
    data: {
      labels: ch.months,
      datasets: [{
        label: 'Discounts',
        data: ch.discounts,
        backgroundColor: C.orange,
        barPercentage: 0.6,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: function(ctx) { return '\u20B9' + fmtNum(ctx.raw); } } }
      },
      scales: {
        y: { ticks: { callback: function(v) { return '\u20B9' + (v/1000).toFixed(0) + 'K'; } } }
      }
    }
  });

  new Chart(document.getElementById('returnsChart'), {
    type: 'bar',
    data: {
      labels: ch.months,
      datasets: [
        {
          label: 'Return Value (\u20B9)',
          data: ch.returnValues,
          backgroundColor: C.red,
          yAxisID: 'y',
          barPercentage: 0.5,
        },
        {
          label: 'Return Orders',
          data: ch.returnOrders,
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
        tooltip: { callbacks: { label: function(ctx) { return ctx.datasetIndex === 0 ? '\u20B9' + fmtNum(ctx.raw) : ctx.raw + ' orders'; } } }
      },
      scales: {
        y: { beginAtZero: true, position: 'left', title: { display: true, text: 'Value (\u20B9)' }, ticks: { callback: function(v) { return '\u20B9' + (v/1000).toFixed(0) + 'K'; } } },
        y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Orders' } }
      }
    }
  });
}

// ===== PRODUCT CHARTS =====
function initProductCharts(data) {
  var prod = data.products;

  new Chart(document.getElementById('productConcentrationChart'), {
    type: 'bar',
    data: {
      labels: prod.items.slice(0, 8).map(function(p) { return p.name.length > 18 ? p.name.slice(0,18)+'\u2026' : p.name; }),
      datasets: [{
        data: prod.items.slice(0, 8).map(function(p) { return p.share; }),
        backgroundColor: prod.items.slice(0, 8).map(function(p, i) { return i === 0 ? C.red : i < 3 ? C.orange : C.teal; }),
        barPercentage: 0.7,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: function(ctx) { return ctx.raw + '% of revenue'; } } }
      },
      scales: {
        x: { max: 60, ticks: { callback: function(v) { return v + '%'; } } }
      }
    }
  });

  new Chart(document.getElementById('sizeChart'), {
    type: 'doughnut',
    data: {
      labels: prod.sizes.labels,
      datasets: [{
        data: prod.sizes.data,
        backgroundColor: [C.teal, C.blue, C.orange, C.green, C.purple],
        borderWidth: 2,
        borderColor: '#fff',
      }]
    },
    options: {
      responsive: true,
      cutout: '55%',
      plugins: {
        tooltip: { callbacks: { label: function(ctx) { return ctx.label + ': ' + fmtNum(ctx.raw) + ' units'; } } }
      }
    }
  });
}

// ===== PAYMENT CHARTS =====
function initPaymentCharts(data) {
  var pay = data.payments;

  new Chart(document.getElementById('cancelRateChart'), {
    type: 'bar',
    data: {
      labels: ['COD Cancel Rate', 'Prepaid Cancel Rate'],
      datasets: [{
        data: [pay.cancelRate.cod, pay.cancelRate.prepaid],
        backgroundColor: [C.red, C.green],
        barPercentage: 0.5,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Cancellation Rate \u2014 COD vs Prepaid', font: { size: 13, weight: '700' }, color: '#1f2937' },
        tooltip: { callbacks: { label: function(ctx) { return ctx.raw + '%'; } } }
      },
      scales: {
        y: { ticks: { callback: function(v) { return v + '%'; } }, max: 6 }
      }
    }
  });

  new Chart(document.getElementById('paymentAovChart'), {
    type: 'bar',
    data: {
      labels: ['COD AOV', 'Prepaid AOV'],
      datasets: [{
        data: [pay.aovComparison.cod, pay.aovComparison.prepaid],
        backgroundColor: [C.orange, C.teal],
        barPercentage: 0.5,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Average Order Value by Payment', font: { size: 13, weight: '700' }, color: '#1f2937' },
        tooltip: { callbacks: { label: function(ctx) { return '\u20B9' + fmtNum(ctx.raw); } } }
      },
      scales: {
        y: { ticks: { callback: function(v) { return '\u20B9' + fmtNum(v); } }, beginAtZero: false, min: 1500 }
      }
    }
  });
}

// ===== MARKETING CHARTS =====
function initMarketingCharts(data) {
  var mkt = data.marketing;
  var meta = mkt.metaAds;

  // ROAS Benchmark (now includes Meta-reported)
  new Chart(document.getElementById('roasChart'), {
    type: 'bar',
    data: {
      labels: ['Tally ROAS', 'Meta ROAS', 'Min Target', 'Industry Avg'],
      datasets: [{
        data: [
          mkt.roasBenchmark.dioste,
          mkt.roasBenchmark.metaReported || 0,
          mkt.roasBenchmark.minimum,
          mkt.roasBenchmark.industry
        ],
        backgroundColor: [C.red, C.blue, C.orange, C.green],
        barPercentage: 0.5,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: function(ctx) { return ctx.raw + 'x'; } } }
      },
      scales: {
        y: { beginAtZero: true, max: 5, ticks: { callback: function(v) { return v + 'x'; } } }
      }
    }
  });

  // Ad Spend Sources
  new Chart(document.getElementById('adSpendGapChart'), {
    type: 'bar',
    data: {
      labels: mkt.adSpendGap.labels,
      datasets: [{
        data: mkt.adSpendGap.data,
        backgroundColor: [C.blue, C.orange, C.red],
        barPercentage: 0.45,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: function(ctx) { return fmtINR(ctx.raw); } } }
      },
      scales: {
        y: { ticks: { callback: function(v) { return fmtINR(v); } } }
      }
    }
  });

  if (!meta) return;

  // Campaign Type — Spend & Purchases (grouped bar)
  var ctp = meta.campaignTypePerformance;
  new Chart(document.getElementById('campTypeChart'), {
    type: 'bar',
    data: {
      labels: ctp.labels,
      datasets: [
        { label: 'Spend (₹)', data: ctp.spend, backgroundColor: C.blue, yAxisID: 'y', barPercentage: 0.7 },
        { label: 'Purchases', data: ctp.purchases, backgroundColor: C.teal, yAxisID: 'y1', barPercentage: 0.7 }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top', labels: { boxWidth: 12 } },
        tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label === 'Spend (₹)' ? fmtINR(ctx.raw) : ctx.raw + ' purchases'; } } }
      },
      scales: {
        y: { position: 'left', ticks: { callback: function(v) { return fmtINR(v); } } },
        y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { callback: function(v) { return v; } } }
      }
    }
  });

  // Campaign Type — ROAS & CPA
  new Chart(document.getElementById('campTypeROASChart'), {
    type: 'bar',
    data: {
      labels: ctp.labels,
      datasets: [
        { label: 'ROAS', data: ctp.roas, backgroundColor: C.green, yAxisID: 'y', barPercentage: 0.7 },
        { label: 'CPA (₹)', data: ctp.cpa, backgroundColor: C.orange, yAxisID: 'y1', barPercentage: 0.7 }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top', labels: { boxWidth: 12 } },
        tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label === 'ROAS' ? ctx.raw + 'x' : fmtINR(ctx.raw); } } }
      },
      scales: {
        y: { position: 'left', ticks: { callback: function(v) { return v + 'x'; } } },
        y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { callback: function(v) { return fmtINR(v); } } }
      }
    }
  });

  // Top Campaigns Table
  var tcBody = document.querySelector('#topCampaignsTable tbody');
  if (tcBody && meta.topCampaigns) {
    tcBody.innerHTML = '';
    meta.topCampaigns.forEach(function(c) {
      var roasClass = c.roas >= 3 ? 'text-green' : (c.roas >= 2 ? 'text-orange' : 'text-red');
      var cpaClass = c.cpa <= 700 ? 'text-green' : (c.cpa <= 900 ? '' : 'text-red');
      tcBody.innerHTML += '<tr>' +
        '<td>' + c.name + '</td>' +
        '<td><span class="badge badge-' + (c.type === 'CBO' ? 'green' : (c.type === 'ABO' ? 'blue' : 'gray')) + '">' + c.type + '</span></td>' +
        '<td class="text-right">' + fmtINR(c.spend) + '</td>' +
        '<td class="text-right">' + c.purchases + '</td>' +
        '<td class="text-right ' + roasClass + ' font-bold">' + c.roas + 'x</td>' +
        '<td class="text-right ' + cpaClass + '">' + fmtINR(c.cpa) + '</td>' +
        '<td class="text-right">' + c.ctr + '%</td>' +
        '</tr>';
    });
  }

  // Best ROAS Table
  fillROASTable('bestROASTable', meta.bestROASCampaigns, 'text-green');
  fillROASTable('worstROASTable', meta.worstROASCampaigns, 'text-red');

  // Demographics — Age Chart
  var agd = meta.demographics.ageBreakdown;
  new Chart(document.getElementById('ageChart'), {
    type: 'bar',
    data: {
      labels: agd.labels,
      datasets: [
        { label: 'Spend (₹)', data: agd.spend, backgroundColor: C.blue, yAxisID: 'y', barPercentage: 0.65 },
        { label: 'Purchases', data: agd.purchases, backgroundColor: C.teal, yAxisID: 'y1', barPercentage: 0.65 }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top', labels: { boxWidth: 12 } } },
      scales: {
        y: { position: 'left', ticks: { callback: function(v) { return fmtINR(v); } } },
        y1: { position: 'right', grid: { drawOnChartArea: false } }
      }
    }
  });

  // Demographics — Gender Chart (doughnut)
  var gnd = meta.demographics.genderBreakdown;
  new Chart(document.getElementById('genderChart'), {
    type: 'doughnut',
    data: {
      labels: gnd.labels,
      datasets: [{
        data: gnd.purchases,
        backgroundColor: ['#ec4899', '#3b82f6', '#9ca3af'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      cutout: '55%',
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { callbacks: { label: function(ctx) { return ctx.label + ': ' + ctx.raw + ' purchases (CPA ' + fmtINR(gnd.cpa[ctx.dataIndex]) + ')'; } } }
      }
    }
  });

  // Demographic Segments Table
  var dsBody = document.querySelector('#demoSegmentsTable tbody');
  if (dsBody && meta.demographics.topSegments) {
    dsBody.innerHTML = '';
    meta.demographics.topSegments.forEach(function(s) {
      var cpaClass = s.cpa <= 800 ? 'text-green' : (s.cpa <= 1000 ? '' : 'text-red');
      dsBody.innerHTML += '<tr>' +
        '<td>' + s.age + ' · ' + s.gender + '</td>' +
        '<td class="text-right">' + fmtINR(s.spend) + '</td>' +
        '<td class="text-right">' + s.spendPct + '%</td>' +
        '<td class="text-right font-bold">' + s.purchases + '</td>' +
        '<td class="text-right ' + cpaClass + '">' + fmtINR(s.cpa) + '</td>' +
        '</tr>';
    });
  }

  // Top Creatives Table
  var crBody = document.querySelector('#topCreativesTable tbody');
  if (crBody && meta.creativePerformance.topCreatives) {
    crBody.innerHTML = '';
    meta.creativePerformance.topCreatives.forEach(function(cr) {
      var roasClass = cr.roas >= 3 ? 'text-green' : (cr.roas >= 2 ? '' : 'text-red');
      function rankBadge(val) {
        if (val === 'Above average') return '<span class="badge badge-green">Above Avg</span>';
        if (val === 'Average') return '<span class="badge badge-yellow">Average</span>';
        if (val === 'Below average (bottom 35%)') return '<span class="badge badge-red">Below Avg</span>';
        return '<span class="badge badge-gray">' + val + '</span>';
      }
      crBody.innerHTML += '<tr>' +
        '<td>' + cr.name + '</td>' +
        '<td class="text-right font-bold">' + cr.purchases + '</td>' +
        '<td class="text-right">' + fmtINR(cr.spend) + '</td>' +
        '<td class="text-right ' + roasClass + '">' + cr.roas + 'x</td>' +
        '<td>' + rankBadge(cr.quality) + '</td>' +
        '<td>' + rankBadge(cr.engagement) + '</td>' +
        '<td>' + rankBadge(cr.conversion) + '</td>' +
        '</tr>';
    });
  }

  // Ad Set Status Chart (doughnut)
  var asStatus = meta.adSetPerformance.statusBreakdown;
  new Chart(document.getElementById('adSetStatusChart'), {
    type: 'doughnut',
    data: {
      labels: ['Active (' + asStatus.active.count + ')', 'Inactive (' + asStatus.inactive.count + ')', 'Not Delivering (' + asStatus.notDelivering.count + ')'],
      datasets: [{
        data: [asStatus.active.spend, asStatus.inactive.spend, asStatus.notDelivering.spend],
        backgroundColor: [C.green, C.grayLight, C.orange],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      cutout: '55%',
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { callbacks: { label: function(ctx) { return ctx.label + ': ' + fmtINR(ctx.raw) + ' spend'; } } }
      }
    }
  });

  // Active Ad Sets Table
  var aaBody = document.querySelector('#activeAdSetsTable tbody');
  if (aaBody && meta.adSetPerformance.activeAdSets) {
    aaBody.innerHTML = '';
    meta.adSetPerformance.activeAdSets.forEach(function(a) {
      var roasClass = a.roas >= 3 ? 'text-green' : (a.roas >= 2 ? '' : 'text-red');
      aaBody.innerHTML += '<tr>' +
        '<td>' + a.name + '</td>' +
        '<td class="text-right">' + fmtINR(a.spend) + '</td>' +
        '<td class="text-right">' + a.purchases + '</td>' +
        '<td class="text-right ' + roasClass + ' font-bold">' + a.roas + 'x</td>' +
        '</tr>';
    });
  }

  // Best/Worst Ad Sets Tables
  fillROASTable('bestAdSetsTable', meta.adSetPerformance.bestROASAdSets, 'text-green');
  fillROASTable('worstAdSetsTable', meta.adSetPerformance.worstROASAdSets, 'text-red');
}

function fillROASTable(tableId, items, colorClass) {
  var body = document.querySelector('#' + tableId + ' tbody');
  if (!body || !items) return;
  body.innerHTML = '';
  items.forEach(function(c) {
    body.innerHTML += '<tr>' +
      '<td>' + c.name + '</td>' +
      '<td class="text-right ' + colorClass + ' font-bold">' + c.roas + 'x</td>' +
      '<td class="text-right">' + fmtINR(c.spend) + '</td>' +
      '<td class="text-right">' + fmtINR(c.cpa || (c.spend / Math.max(c.purchases, 1))) + '</td>' +
      '</tr>';
  });
}

// ===== CUSTOMER CHARTS =====
function initCustomerCharts(data) {
  var ch = data.charts;
  var cust = data.customers;

  new Chart(document.getElementById('returningRateChart'), {
    type: 'bar',
    data: {
      labels: ch.months,
      datasets: [{
        label: 'Returning Customer Rate',
        data: ch.retRates,
        backgroundColor: ch.retRates.map(function(v) { return v > 0 ? C.teal : C.grayLight; }),
        borderColor: ch.retRates.map(function(v) { return v > 0 ? C.teal : '#e5e7eb'; }),
        borderWidth: 1,
        barPercentage: 0.6,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: function(ctx) { return ctx.raw + '%'; } } }
      },
      scales: {
        y: { max: 1, ticks: { callback: function(v) { return v + '%'; } } }
      }
    }
  });

  new Chart(document.getElementById('orderFreqChart'), {
    type: 'bar',
    data: {
      labels: cust.orderFrequency.labels,
      datasets: [{
        data: cust.orderFrequency.data,
        backgroundColor: [C.gray, C.teal, C.green],
        barPercentage: 0.55,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: function(ctx) { return fmtNum(ctx.raw) + ' customers'; } } }
      },
      scales: {
        y: { ticks: { callback: function(v) { return fmtNum(v); } } }
      }
    }
  });
}

// ===== GEOGRAPHY CHARTS =====
function initGeographyCharts(data) {
  var geo = data.geography;

  new Chart(document.getElementById('stateOrdersChart'), {
    type: 'bar',
    data: {
      labels: geo.states.names,
      datasets: [{
        data: geo.states.orders,
        backgroundColor: geo.states.orders.map(function(v, i) { return i < 2 ? C.teal : i < 5 ? C.blue : C.gray; }),
        barPercentage: 0.7,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: function(ctx) { return fmtNum(ctx.raw) + ' orders'; } } }
      }
    }
  });

  new Chart(document.getElementById('cityOrdersChart'), {
    type: 'bar',
    data: {
      labels: geo.cities.names,
      datasets: [{
        data: geo.cities.orders,
        backgroundColor: geo.cities.orders.map(function(v, i) { return i === 0 ? C.teal : i < 5 ? C.blue : C.gray; }),
        barPercentage: 0.7,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: function(ctx) { return fmtNum(ctx.raw) + ' orders'; } } }
      }
    }
  });

  new Chart(document.getElementById('sessionsVsOrdersChart'), {
    type: 'bar',
    data: {
      labels: geo.states.names,
      datasets: [
        {
          label: 'Orders',
          data: geo.states.orders,
          backgroundColor: C.teal,
          yAxisID: 'y',
          barPercentage: 0.6,
        },
        {
          label: 'Sessions',
          data: geo.states.sessions,
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
        y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Sessions' }, ticks: { callback: function(v) { return (v/1000).toFixed(0) + 'K'; } } }
      }
    }
  });
}

// ===== CASHFLOW CHARTS =====
function initCashflowCharts(data) {
  var cf = data.cashflow;

  new Chart(document.getElementById('dailyBalanceChart'), {
    type: 'line',
    data: {
      labels: cf.dailyBalance.map(function(d) { return d.d; }),
      datasets: [{
        label: 'Bank Balance',
        data: cf.dailyBalance.map(function(d) { return d.v; }),
        borderColor: C.red,
        backgroundColor: 'rgba(239,68,68,0.08)',
        fill: true,
        tension: 0.2,
        borderWidth: 2,
        pointBackgroundColor: cf.dailyBalance.map(function(d) { return d.v === 0 ? C.red : C.blue; }),
        pointBorderColor: cf.dailyBalance.map(function(d) { return d.v === 0 ? C.red : 'transparent'; }),
        pointRadius: cf.dailyBalance.map(function(d) { return d.v === 0 ? 5 : 2; }),
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: { callbacks: { label: function(ctx) { return fmtINR(ctx.raw); } } },
        annotation: undefined
      },
      scales: {
        y: { beginAtZero: true, ticks: { callback: function(v) { return fmtINR(v); } } },
        x: { ticks: { maxRotation: 45, font: { size: 10 } } }
      }
    }
  });

  new Chart(document.getElementById('inflowOutflowChart'), {
    type: 'bar',
    data: {
      labels: cf.monthly.months,
      datasets: [
        { label: 'Credits (In)', data: cf.monthly.credits, backgroundColor: C.green, barPercentage: 0.6 },
        { label: 'Debits (Out)', data: cf.monthly.debits, backgroundColor: C.red, barPercentage: 0.6 }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ': ' + fmtINR(ctx.raw); } } }
      },
      scales: {
        y: { ticks: { callback: function(v) { return fmtINR(v); } } }
      }
    }
  });

  new Chart(document.getElementById('inflowDonutChart'), {
    type: 'doughnut',
    data: {
      labels: cf.inflowSources.labels,
      datasets: [{
        data: cf.inflowSources.data,
        backgroundColor: [C.teal, C.orange, C.gray],
        borderWidth: 2,
        borderColor: '#fff',
      }]
    },
    options: {
      responsive: true,
      cutout: '55%',
      plugins: {
        tooltip: { callbacks: { label: function(ctx) { return ctx.label + ': ' + ctx.raw + '%'; } } }
      }
    }
  });

  new Chart(document.getElementById('outflowDonutChart'), {
    type: 'doughnut',
    data: {
      labels: cf.outflowSources.labels,
      datasets: [{
        data: cf.outflowSources.data,
        backgroundColor: [C.purple, C.red, C.orange, C.gray],
        borderWidth: 2,
        borderColor: '#fff',
      }]
    },
    options: {
      responsive: true,
      cutout: '55%',
      plugins: {
        tooltip: { callbacks: { label: function(ctx) { return ctx.label + ': ' + ctx.raw + '%'; } } }
      }
    }
  });
}
