/**
 * Zumra.shop Merchant Portal - Frontend Application Core
 */

document.addEventListener('DOMContentLoaded', () => {
  let catalogProducts = [];

  // 1. TAB SWITCHING SYSTEM
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const activeContent = document.getElementById(`tab-${targetTab}`);
      if (activeContent) activeContent.classList.add('active');

      if (targetTab === 'martech') fetchMarTechEvents();
      if (targetTab === 'calculator') populateCalculatorSelect();
    });
  });

  // 2. FETCH & RENDER CATALOG PRODUCTS
  async function fetchCatalogProducts() {
    const grid = document.getElementById('products-grid');
    try {
      const searchVal = document.getElementById('catalog-search').value;
      const categoryVal = document.getElementById('catalog-category-filter').value;

      let url = '/api/v1/catalog/products?';
      if (searchVal) url += `query=${encodeURIComponent(searchVal)}&`;
      if (categoryVal) url += `category=${encodeURIComponent(categoryVal)}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.statusCode === 200) {
        catalogProducts = result.data || [];
        renderProductsGrid(catalogProducts);
      }
    } catch (err) {
      grid.innerHTML = `<div class="error-msg">فشل في الاتصال بمحرك الكتالوج: ${err.message}</div>`;
    }
  }

  function renderProductsGrid(products) {
    const grid = document.getElementById('products-grid');
    if (!products.length) {
      grid.innerHTML = `<div class="glass-card" style="grid-column: 1/-1; text-align: center;">لا توجد منتجات مطابقة للبحث.</div>`;
      return;
    }

    grid.innerHTML = products.map(p => `
      <div class="product-card">
        <div class="product-header">
          <div>
            <h3 class="product-title">${p.nameAr}</h3>
            <span class="product-meta-row" style="margin-top: 4px;">SKU: <strong style="font-family: monospace;">${p.sku}</strong></span>
          </div>
          <span class="origin-badge ${p.marketOrigin === 'EL_FAGALA' ? 'origin-fagala' : 'origin-ataba'}">
            ${p.marketOrigin === 'EL_FAGALA' ? 'الفجالة' : 'العتبة'}
          </span>
        </div>

        <div class="product-meta-row">
          <span>العبوة: <strong>${translateUnit(p.packagingUnit)} (${p.unitsPerCarton} قطعة)</strong></span>
          <span>المخزون: <strong>${p.stockQuantity} عبوة</strong></span>
        </div>

        <div class="product-barcode-box">
          <img src="/api/v1/catalog/barcode?code=${encodeURIComponent(p.barcode)}&type=code128" alt="Barcode ${p.barcode}">
          <div style="font-size: 11px; margin-top: 4px; color: var(--text-muted); font-family: monospace;">${p.barcode}</div>
        </div>

        <div class="price-box">
          <div>
            <div style="font-size: 11px; color: var(--text-muted);">السعر المفرد</div>
            <div class="base-price">${p.baseUnitPrice.toFixed(2)} ج.م</div>
          </div>
          <div style="text-align: left;">
            <div style="font-size: 11px; color: var(--accent-gold);">خصم كراتين</div>
            <div style="font-weight: 700; font-size: 14px;">${p.tieredPricing.length ? p.tieredPricing[0].unitPrice.toFixed(2) + ' ج.م' : 'لا يوجد'}</div>
          </div>
        </div>
      </div>
    `).join('');
  }

  function translateUnit(unit) {
    const map = { CARTON: 'كرتونة', DOZEN: 'دستة', BUNDLE: 'ربطة', PARCEL: 'طرد', PIECE: 'قطعة' };
    return map[unit] || unit;
  }

  // Filter Listeners
  document.getElementById('catalog-search').addEventListener('input', debounce(fetchCatalogProducts, 300));
  document.getElementById('catalog-category-filter').addEventListener('change', fetchCatalogProducts);

  // 3. BARCODE STUDIO GENERATOR
  document.getElementById('generate-barcode-btn').addEventListener('click', () => {
    const val = document.getElementById('barcode-input-value').value || '6221000982101';
    const type = document.getElementById('barcode-type-select').value || 'code128';

    const img = document.getElementById('barcode-image-preview');
    img.src = `/api/v1/catalog/barcode?code=${encodeURIComponent(val)}&type=${encodeURIComponent(type)}&t=${Date.now()}`;

    document.getElementById('meta-type').innerText = type.toUpperCase();
  });

  // 4. AI SLANG NORMALIZER SIMULATOR
  document.querySelectorAll('.preset-chips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.getElementById('slang-input-text').value = chip.getAttribute('data-phrase');
    });
  });

  document.getElementById('normalize-slang-btn').addEventListener('click', () => {
    const text = document.getElementById('slang-input-text').value;
    const jsonContainer = document.getElementById('slang-result-json');

    if (!text.trim()) {
      jsonContainer.innerHTML = `<span class="error-msg">الرجاء كتابة عبارة التاجر أولاً!</span>`;
      return;
    }

    jsonContainer.innerHTML = 'جاري التحليل بواسطة LLM & Slang Embeddings Normalizer...';

    setTimeout(() => {
      const mockResult = {
        confidenceScore: 0.96,
        parsedOrder: {
          merchantIntent: 'B2B_PURCHASE_ORDER',
          marketSource: text.includes('العتبة') ? 'EL_ATABA' : 'EL_FAGALA',
          items: [
            {
              rawSlangTerm: 'دستتين قلم فسفوري ألماني',
              normalizedSku: 'ZMR-PEN-112094',
              matchedProduct: 'قلم فسفوري ماركر ألماني أصلي',
              requestedQuantity: 2,
              unit: 'DOZEN',
              totalPieces: 24,
              estimatedUnitPrice: 13.0
            },
            {
              rawSlangTerm: 'خمس كراتين كشاكيل غزل 80 ورقة',
              normalizedSku: 'ZMR-OFF-882190',
              matchedProduct: 'كشكول سلك 80 ورقة فرز أول',
              requestedQuantity: 5,
              unit: 'CARTON',
              totalPieces: 200,
              estimatedUnitPrice: 19.5
            }
          ]
        },
        normalizedAt: new Date().toISOString()
      };

      jsonContainer.innerText = JSON.stringify(mockResult, null, 2);
    }, 400);
  });

  // 5. MARTECH STREAM FETCHING
  async function fetchMarTechEvents() {
    const list = document.getElementById('event-stream-list');
    try {
      const res = await fetch('/api/v1/marketing/events');
      const json = await res.json();

      if (json.statusCode === 200) {
        document.getElementById('event-count-badge').innerText = `${json.count} Events Logged`;
        if (!json.data.length) {
          list.innerHTML = `<div style="text-align: center; color: var(--text-muted);">لا توجد أحداث تسويقية مسجلة حديثاً.</div>`;
          return;
        }

        list.innerHTML = json.data.map(evt => `
          <div class="event-item">
            <div>
              <span class="event-type">${evt.eventType}</span>
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                Payload: ${JSON.stringify(evt.data)}
              </div>
            </div>
            <span class="event-time">${new Date(evt.timestamp).toLocaleTimeString('ar-EG')}</span>
          </div>
        `).join('');
      }
    } catch (err) {
      list.innerHTML = `<div class="error-msg">فشل جلب الأحداث: ${err.message}</div>`;
    }
  }

  document.getElementById('refresh-events-btn').addEventListener('click', fetchMarTechEvents);

  // 6. BULK PRICING CALCULATOR
  function populateCalculatorSelect() {
    const select = document.getElementById('calc-product-select');
    if (!catalogProducts.length) return;

    select.innerHTML = catalogProducts.map(p => `
      <option value="${p.id}">${p.nameAr} - ${p.baseUnitPrice.toFixed(2)} ج.م</option>
    `).join('');

    calculateBulkPrice();
  }

  function calculateBulkPrice() {
    const productId = document.getElementById('calc-product-select').value;
    const qty = parseInt(document.getElementById('calc-quantity-input').value) || 1;

    const product = catalogProducts.find(p => p.id === productId);
    if (!product) return;

    let appliedPrice = product.baseUnitPrice;
    let appliedTierLabel = 'السعر الفردي الأساسي';

    // Find applied tier
    const sortedTiers = [...product.tieredPricing].sort((a, b) => b.minQuantity - a.minQuantity);
    for (const tier of sortedTiers) {
      if (qty >= tier.minQuantity) {
        appliedPrice = tier.unitPrice;
        appliedTierLabel = tier.labelAr;
        break;
      }
    }

    const total = appliedPrice * qty;
    const rebate = Math.round(total * 0.03 * 100) / 100; // 3% Merchant Ledger Rebate

    document.getElementById('res-base-price').innerText = `${product.baseUnitPrice.toFixed(2)} ج.م`;
    document.getElementById('res-effective-price').innerText = `${appliedPrice.toFixed(2)} ج.م`;
    document.getElementById('res-total-price').innerText = `${total.toFixed(2)} ج.م`;
    document.getElementById('res-applied-tier').innerText = appliedTierLabel;
    document.getElementById('res-cashback').innerText = `${rebate.toFixed(2)} ج.م`;
  }

  document.getElementById('calc-product-select').addEventListener('change', calculateBulkPrice);
  document.getElementById('calc-quantity-input').addEventListener('input', calculateBulkPrice);

  // 7. ADD PRODUCT MODAL SYSTEM
  const modal = document.getElementById('add-product-modal');
  document.getElementById('open-add-modal').addEventListener('click', () => modal.classList.add('active'));
  document.getElementById('close-modal-btn').addEventListener('click', () => modal.classList.remove('active'));
  document.getElementById('cancel-modal-btn').addEventListener('click', () => modal.classList.remove('active'));

  document.getElementById('add-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      nameAr: document.getElementById('p-name-ar').value,
      category: document.getElementById('p-category').value,
      marketOrigin: document.getElementById('p-origin').value,
      packagingUnit: document.getElementById('p-unit').value,
      unitsPerCarton: parseInt(document.getElementById('p-units-per-carton').value) || 10,
      baseUnitPrice: parseFloat(document.getElementById('p-base-price').value),
      stockQuantity: parseInt(document.getElementById('p-stock').value) || 50,
      slangKeywords: document.getElementById('p-slang').value.split(',').map(s => s.trim()).filter(Boolean)
    };

    try {
      const response = await fetch('/api/v1/catalog/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.statusCode === 201) {
        modal.classList.remove('active');
        document.getElementById('add-product-form').reset();
        await fetchCatalogProducts();
      } else {
        alert(`خطأ: ${result.message}`);
      }
    } catch (err) {
      alert(`فشل الاتصال: ${err.message}`);
    }
  });

  // Utilities
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Initial Load
  fetchCatalogProducts();
});
