'use strict';

(function () {
  var NHIL_BP = 250;
  var GETFUND_BP = 250;
  var VAT_BP = 1500;

  function formatCents(cents) {
    var sign = cents < 0 ? '-' : '';
    var abs = Math.abs(cents);
    var whole = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    var pesewas = abs % 100;
    var frac = pesewas < 10 ? '0' + pesewas : String(pesewas);
    return 'GH¢ ' + sign + whole + '.' + frac;
  }

  function parseCents(raw) {
    var cleaned = String(raw == null ? '' : raw).replace(/,/g, '').trim();
    if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return { ok: false, cents: 0 };
    var cedis = Number(cleaned);
    if (!Number.isFinite(cedis)) return { ok: false, cents: 0 };
    return { ok: true, cents: Math.round(cedis * 100) };
  }

  function levyCents(amountCents, rateBp) {
    return Math.round(amountCents * rateBp / 10000);
  }

  function calculateExclusive(taxableCents) {
    var nhil = levyCents(taxableCents, NHIL_BP);
    var getfund = levyCents(taxableCents, GETFUND_BP);
    var vat = levyCents(taxableCents, VAT_BP);
    return {
      taxable: taxableCents,
      nhil: nhil,
      getfund: getfund,
      vat: vat,
      total: taxableCents + nhil + getfund + vat
    };
  }

  function calculateInclusive(finalCents) {
    var nhil = Math.round(finalCents * NHIL_BP / 12000);
    var getfund = Math.round(finalCents * GETFUND_BP / 12000);
    var vat = Math.round(finalCents * VAT_BP / 12000);
    return {
      taxable: finalCents - nhil - getfund - vat,
      nhil: nhil,
      getfund: getfund,
      vat: vat,
      total: finalCents
    };
  }

  function ensureMarkup() {
    var mount = document.getElementById('gra-vat-calculator');
    if (!mount || mount.querySelector('#vat-form')) return;

    try {
      var hasGoodlayersLayout = !!(
        document.getElementById('gdlr-core-column-paye') ||
        document.querySelector('.gdlr-core-pbf-sidebar-wrapper') ||
        document.querySelector('.gdlr-core-page-builder-body')
      );
      if (!hasGoodlayersLayout) {
        mount.classList.add('gra-vat-standalone');
      } else {
        mount.classList.remove('gra-vat-standalone');
      }
    } catch (e) {
      // ignore
    }

    mount.innerHTML = [
      '<div class="gra-main-panel paye-vat-shell">',
      '  <div class="paye-vat-header"><h5>VAT &amp; Levies Calculator</h5></div>',
      '  <div class="paye-vat-body">',
      '    <div class="paye-vat-grid" style="display: block;">',
      '      <div class="paye-vat-col" style="max-width: 95%; margin: 0 auto 40px;">',
      '        <div class="paye-vat-card">',
      '          <div class="paye-vat-section-title">Calculate VAT &amp; Levies</div>',
      '          <form id="vat-form" novalidate>',
      '            <div class="gra-field">',
      '              <label class="gra-label">Mode</label>',
      '              <div class="paye-type-toggle" style="margin-top: 6px;">',
      '                <label><input type="radio" name="vatMode" id="vatModeExclusive" value="exclusive" checked /> <span class="paye-type-option">Exclusive (before taxes)</span></label>',
      '                <label><input type="radio" name="vatMode" id="vatModeInclusive" value="inclusive" /> <span class="paye-type-option">Inclusive (final cost)</span></label>',
      '              </div>',
      '            </div>',
      '            <div class="paye-field-divider"></div>',
      '            <div class="gra-field">',
      '              <label id="vatAmountLabel" for="vatAmount" class="gra-label">Taxable amount <span aria-hidden="true" style="color: #b91c1c;">*</span></label>',
      '              <div class="gra-input-wrap" style="margin-top: 6px;">',
      '                <span class="gra-input-prefix">GH¢</span>',
      '                <input id="vatAmount" class="gra-input" inputmode="decimal" autocomplete="off" placeholder="e.g. 1000.00" required />',
      '              </div>',
      '              <p id="vatError" class="gra-error"><span id="vatErrorText">Please enter a valid amount greater than zero.</span></p>',
      '              <span id="vatHint" class="gra-hint" style="margin-top: 6px;">NHIL 2.5%, GETFund 2.5%, and VAT 15% are each charged on the taxable value.</span>',
      '            </div>',
      '            <div class="gra-actions" style="flex-direction: column; align-items: stretch;">',
      '              <button type="submit" class="gra-btn-primary">Calculate</button>',
      '              <button type="button" id="resetBtn" class="gra-btn-secondary" style="width: 100%;">Clear</button>',
      '            </div>',
      '          </form>',
      '          <section id="vat-results" class="gra-results is-hidden" aria-live="polite">',
      '            <div class="paye-results-simple">',
      '              <div class="paye-result-line"><span class="paye-result-label">TAXABLE VALUE:</span><span id="resultTaxable" class="paye-result-value"></span></div>',
      '              <div class="paye-result-line"><span class="paye-result-label">NHIL (2.5%):</span><span id="resultNhil" class="paye-result-value"></span></div>',
      '              <div class="paye-result-line"><span class="paye-result-label">GETFUND LEVY (2.5%):</span><span id="resultGetfund" class="paye-result-value"></span></div>',
      '              <div class="paye-result-line"><span class="paye-result-label">VAT (15%):</span><span id="resultVat" class="paye-result-value"></span></div>',
      '              <div class="paye-result-line" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #cbd5e1;">',
      '                <span class="paye-result-label">FINAL COST (INCL. TAXES):</span><span id="resultTotal" class="paye-result-value"></span>',
      '              </div>',
      '            </div>',
      '            <button type="button" id="breakdownToggleBtn" class="gra-btn-secondary" style="width: 100%; margin-top: 10px;">View breakdown</button>',
      '            <div id="vatBreakdown" class="is-hidden" aria-label="VAT breakdown">',
      '              <div class="table-wrapper">',
      '                <table class="fl-table">',
      '                  <thead><tr><th><strong>Item</strong></th><th><strong>Rate</strong></th><th><strong>Base</strong></th><th><strong>Amount (GH¢)</strong></th><th><strong>Notes</strong></th></tr></thead>',
      '                  <tbody id="vatBreakdownBody"></tbody>',
      '                </table>',
      '              </div>',
      '            </div>',
      '          </section>',
      '        </div>',
      '      </div>',
      '      <div class="paye-vat-col" style="max-width: 95%; margin: 0 auto 20px;">',
      '        <div class="paye-vat-card">',
      '          <div class="paye-vat-section-title">Rates Used</div>',
      '          <p class="gra-hint">From 1 January 2026 (Value Added Tax Act, 2025, Act 1151). The COVID-19 levy is not included.</p>',
      '          <div class="table-wrapper">',
      '            <table class="fl-table" aria-label="VAT rates">',
      '              <thead><tr><th><strong>Levy</strong></th><th><strong>Rate</strong></th><th><strong>Applied on</strong></th><th><strong>Formula</strong></th><th><strong>Effect</strong></th></tr></thead>',
      '              <tbody>',
      '                <tr><td><strong>NHIL</strong></td><td><strong>2.5%</strong></td><td><strong>Taxable value</strong></td><td><strong>2.5% × taxable value</strong></td><td><strong>Adds 2.5%</strong></td></tr>',
      '                <tr><td><strong>GETFund Levy</strong></td><td><strong>2.5%</strong></td><td><strong>Taxable value</strong></td><td><strong>2.5% × taxable value</strong></td><td><strong>Adds 2.5%</strong></td></tr>',
      '                <tr><td><strong>VAT</strong></td><td><strong>15%</strong></td><td><strong>Taxable value</strong></td><td><strong>15% × taxable value</strong></td><td><strong>Adds 15%</strong></td></tr>',
      '                <tr><td colspan="4"><strong>Total add-on (NHIL + GETFund + VAT)</strong></td><td><strong>20% of taxable value</strong></td></tr>',
      '              </tbody>',
      '            </table>',
      '          </div>',
      '        </div>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');

    try {
      var existingPanel = document.getElementById('vat-explainer-panel');
      if (!existingPanel) {
        var panel = document.createElement('div');
        panel.id = 'vat-explainer-panel';
        panel.style.marginTop = '18px';
        panel.innerHTML =
          '<div style="font-weight:700; color:#3e4494; margin-bottom:6px;">VAT explained</div>' +
          '<div class="gra-hint" style="margin-top: 0;">' +
          'Understand VAT, NHIL, and the GETFund Levy, how they work, and the latest guidance. ' +
          '<a href="https://gra.gov.gh/domestic-tax/tax-types/vat/">Open VAT information page</a>' +
          '</div>' +
          '<div style="font-weight:700; color:#3e4494; margin-bottom:6px; margin-top:18px;">File and Pay taxes</div>' +
          '<div class="gra-hint" style="margin-top: 0;">' +
          'Register, file your returns, and pay your taxes online through the GRA portal. ' +
          '<a href="https://taxpayersportal.com/auth">Open File and Pay portal</a>' +
          '</div>';

        var vatCards = mount.querySelectorAll('.paye-vat-col .paye-vat-card');
        var vatRatesCard = vatCards && vatCards.length > 1 ? vatCards[1] : null;
        if (vatRatesCard && vatRatesCard.parentNode) {
          if (vatRatesCard.nextSibling) {
            vatRatesCard.parentNode.insertBefore(panel, vatRatesCard.nextSibling);
          } else {
            vatRatesCard.parentNode.appendChild(panel);
          }
        }
      }
    } catch (e) {
      // ignore
    }

    try {
      var existingDisclaimer = document.getElementById('vat-disclaimer-section');
      if (!existingDisclaimer) {
        var disclaimer = document.createElement('div');
        disclaimer.id = 'vat-disclaimer-section';
        disclaimer.style.marginTop = '130px';
        disclaimer.className = 'gdlr-core-pbf-element';
        disclaimer.innerHTML =
          '<div class="gdlr-core-title-item gdlr-core-item-pdb clearfix gdlr-core-left-align gdlr-core-title-item-caption-bottom gdlr_core-item-pdlr" style="padding-left: 20px;">' +
          '<div class="gdlr-core-title-item-title-wrap">' +
          '<h3 class="gdlr-core-title-item-title gdlr-core-skin-title" style="font-size: 20px; font-weight: 600; text-transform: none; color: #313787;">' +
          'Disclaimer on Use Of Tax Calculators' +
          '<span class="gdlr-core-title-item-title-divider gdlr-core-skin-divider"></span>' +
          '</h3>' +
          '</div>' +
          '<span class="gdlr-core-title-item-caption gdlr-core-info-font gdlr-core-skin-caption">' +
          'The use of the Tax Calculators only serves as a guideline. The actual tax payable by you or deduction available to you (if any) will depend on your personal circumstances. It is advised that for filing of returns and for making formal financial decisions, the exact calculation be made as per the provisions contained in the relevant Acts, and Laws.' +
          '</span>' +
          '</div>';

        var contentColumn = document.querySelector('.gdlr-core-pbf-sidebar-content-inner') ||
          document.querySelector('.gdlr-core-pbf-sidebar-content') ||
          mount.parentNode;

        if (contentColumn) {
          contentColumn.appendChild(disclaimer);
        }
      }
    } catch (e) {
      // ignore
    }
  }

  function boot() {
    var form = document.getElementById('vat-form');
    var resetBtn = document.getElementById('resetBtn');
    var vatAmountEl = document.getElementById('vatAmount');
    var vatErrorEl = document.getElementById('vatError');
    var vatErrorTextEl = document.getElementById('vatErrorText');
    var vatAmountLabelEl = document.getElementById('vatAmountLabel');
    var vatHintEl = document.getElementById('vatHint');
    var modeExclusiveEl = document.getElementById('vatModeExclusive');
    var modeInclusiveEl = document.getElementById('vatModeInclusive');
    var resultsEl = document.getElementById('vat-results');
    var resultTaxableEl = document.getElementById('resultTaxable');
    var resultNhilEl = document.getElementById('resultNhil');
    var resultGetfundEl = document.getElementById('resultGetfund');
    var resultVatEl = document.getElementById('resultVat');
    var resultTotalEl = document.getElementById('resultTotal');
    var breakdownToggleBtn = document.getElementById('breakdownToggleBtn');
    var breakdownEl = document.getElementById('vatBreakdown');
    var breakdownBodyEl = document.getElementById('vatBreakdownBody');

    if (!form || !vatAmountEl) return;

    function setError(msg) {
      if (vatErrorTextEl) vatErrorTextEl.textContent = msg;
      if (vatErrorEl) vatErrorEl.classList.add('is-visible');
    }

    function clearError() {
      if (vatErrorEl) vatErrorEl.classList.remove('is-visible');
    }

    function resolveMode() {
      if (modeInclusiveEl && modeInclusiveEl.checked) return 'inclusive';
      return 'exclusive';
    }

    function updateAmountLabel() {
      var mode = resolveMode();
      if (vatAmountLabelEl) {
        vatAmountLabelEl.innerHTML = mode === 'inclusive'
          ? 'Final cost (inclusive) <span aria-hidden="true" style="color: #b91c1c;">*</span>'
          : 'Taxable amount <span aria-hidden="true" style="color: #b91c1c;">*</span>';
      }
      if (vatAmountEl) {
        vatAmountEl.setAttribute('placeholder', mode === 'inclusive' ? 'e.g. 1200.00' : 'e.g. 1000.00');
      }
      if (vatHintEl) {
        vatHintEl.textContent = mode === 'inclusive'
          ? 'Enter the final amount. The calculator splits out NHIL 2.5%, GETFund 2.5%, and VAT 15%.'
          : 'Enter the taxable amount. NHIL 2.5%, GETFund 2.5%, and VAT 15% are added on that value.';
      }
    }

    function resetUi() {
      vatAmountEl.value = '';
      clearError();
      if (resultsEl) resultsEl.classList.add('is-hidden');
      if (breakdownEl) breakdownEl.classList.add('is-hidden');
      if (breakdownToggleBtn) breakdownToggleBtn.textContent = 'View breakdown';
      if (breakdownBodyEl) breakdownBodyEl.innerHTML = '';
      if (modeExclusiveEl) modeExclusiveEl.checked = true;
      if (modeInclusiveEl) modeInclusiveEl.checked = false;
      updateAmountLabel();
    }

    function renderResults(result) {
      if (resultTaxableEl) resultTaxableEl.textContent = formatCents(result.taxable);
      if (resultNhilEl) resultNhilEl.textContent = formatCents(result.nhil);
      if (resultGetfundEl) resultGetfundEl.textContent = formatCents(result.getfund);
      if (resultVatEl) resultVatEl.textContent = formatCents(result.vat);
      if (resultTotalEl) resultTotalEl.textContent = formatCents(result.total);
      if (resultsEl) resultsEl.classList.remove('is-hidden');
    }

    function renderBreakdown(result, mode) {
      if (!breakdownBodyEl) return;
      var rows = [
        {
          item: mode === 'inclusive' ? 'Taxable value (derived)' : 'Taxable value (input)',
          rate: '',
          base: mode === 'inclusive' ? 'Derived from final amount' : 'Input taxable amount',
          amount: result.taxable,
          notes: 'Base for NHIL, GETFund, and VAT'
        },
        { item: 'NHIL', rate: '2.5%', base: 'Taxable value', amount: result.nhil, notes: '2.5% of the taxable value' },
        { item: 'GETFund Levy', rate: '2.5%', base: 'Taxable value', amount: result.getfund, notes: '2.5% of the taxable value' },
        { item: 'VAT', rate: '15%', base: 'Taxable value', amount: result.vat, notes: '15% of the taxable value' },
        { item: 'Final amount (tax-inclusive)', rate: '', base: 'Taxable value + levies', amount: result.total, notes: 'Taxable + NHIL + GETFund + VAT' }
      ];
      breakdownBodyEl.innerHTML = '';
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td><strong>' + r.item + '</strong></td>' +
          '<td><strong>' + (r.rate || '—') + '</strong></td>' +
          '<td><strong>' + r.base + '</strong></td>' +
          '<td><strong>' + formatCents(r.amount) + '</strong></td>' +
          '<td><strong>' + r.notes + '</strong></td>';
        breakdownBodyEl.appendChild(tr);
      }
    }

    if (modeExclusiveEl) modeExclusiveEl.addEventListener('change', updateAmountLabel);
    if (modeInclusiveEl) modeInclusiveEl.addEventListener('change', updateAmountLabel);
    if (breakdownToggleBtn) {
      breakdownToggleBtn.addEventListener('click', function () {
        if (!breakdownEl) return;
        var isHidden = breakdownEl.classList.contains('is-hidden');
        breakdownEl.classList.toggle('is-hidden', !isHidden);
        breakdownToggleBtn.textContent = isHidden ? 'Hide breakdown' : 'View breakdown';
      });
    }
    if (resetBtn) resetBtn.addEventListener('click', resetUi);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var mode = resolveMode();
      var parsed = parseCents(vatAmountEl.value);
      if (!parsed.ok) {
        setError('Please enter a valid amount (e.g. 1000 or 1000.50).');
        return;
      }
      if (parsed.cents <= 0) {
        setError('Please enter an amount greater than zero.');
        return;
      }
      clearError();
      var result = mode === 'inclusive' ? calculateInclusive(parsed.cents) : calculateExclusive(parsed.cents);
      renderResults(result);
      renderBreakdown(result, mode);
    });

    updateAmountLabel();
  }

  function sameResult(actual, expected) {
    return actual.taxable === expected.taxable &&
      actual.nhil === expected.nhil &&
      actual.getfund === expected.getfund &&
      actual.vat === expected.vat &&
      actual.total === expected.total;
  }

  function runSelfTest() {
    if (!window || !window.location) return;
    var params = new URLSearchParams(window.location.search || '');
    if (params.get('selftest') !== '1') return;

    var cases = [
      {
        name: 'Exclusive 1000',
        run: function () { return calculateExclusive(100000); },
        expected: { taxable: 100000, nhil: 2500, getfund: 2500, vat: 15000, total: 120000 }
      },
      {
        name: 'Exclusive 1001',
        run: function () { return calculateExclusive(100100); },
        expected: { taxable: 100100, nhil: 2503, getfund: 2503, vat: 15015, total: 120121 }
      },
      {
        name: 'Exclusive 0.60',
        run: function () { return calculateExclusive(60); },
        expected: { taxable: 60, nhil: 2, getfund: 2, vat: 9, total: 73 }
      },
      {
        name: 'Inclusive 1200',
        run: function () { return calculateInclusive(120000); },
        expected: { taxable: 100000, nhil: 2500, getfund: 2500, vat: 15000, total: 120000 }
      },
      {
        name: 'Inclusive 100',
        run: function () { return calculateInclusive(10000); },
        expected: { taxable: 8334, nhil: 208, getfund: 208, vat: 1250, total: 10000 }
      }
    ];

    var passed = 0;
    var failed = 0;
    for (var i = 0; i < cases.length; i++) {
      var actual = cases[i].run();
      if (sameResult(actual, cases[i].expected)) {
        passed += 1;
      } else {
        failed += 1;
        console.error('[VAT selftest] FAIL:', cases[i].name, actual, cases[i].expected);
      }
    }

    var note = document.createElement('p');
    note.id = 'vat-selftest';
    note.textContent = failed === 0 ? 'VAT selftest PASS ' + passed : 'VAT selftest FAIL ' + failed;
    if (document.body) document.body.appendChild(note);
  }

  function start() {
    ensureMarkup();
    boot();
    runSelfTest();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
