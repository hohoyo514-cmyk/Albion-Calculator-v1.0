(function () {
  const STORAGE_KEYS = {
    presets: 'albionCalculatorPresets',
    history: 'albionCalculatorHistory'
  };

  const regionDefaults = [
    { name: 'Bridgewatch', rrr: 15.2, fee: 0, sell: 0, tax: 6.5, transport: 0 },
    { name: 'Martlock', rrr: 15.2, fee: 0, sell: 0, tax: 6.5, transport: 0 },
    { name: 'Lymhurst', rrr: 15.2, fee: 0, sell: 0, tax: 6.5, transport: 0 },
    { name: 'Fort Sterling', rrr: 15.2, fee: 0, sell: 0, tax: 6.5, transport: 0 },
    { name: 'Thetford', rrr: 15.2, fee: 0, sell: 0, tax: 6.5, transport: 0 },
    { name: 'Caerleon', rrr: 0, fee: 0, sell: 0, tax: 10.5, transport: 0 },
    { name: 'Brecilien', rrr: 0, fee: 0, sell: 0, tax: 6.5, transport: 0 }
  ];

  const fallbackItems = [
    { id: 'bronze_bar', name: 'Bronze Bar T3' },
    { id: 'steel_bar', name: 'Steel Bar T4' },
    { id: 'great_fire_staff', name: 'Great Fire Staff T4' }
  ];

  const fallbackRecipes = {
    bronze_bar: {
      materials: [
        { name: 'Tin Ore T3', amount: 2 },
        { name: 'Tin Bar T2', amount: 1 }
      ]
    },
    steel_bar: {
      materials: [
        { name: 'Copper Ore T4', amount: 2 },
        { name: 'Bronze Bar T3', amount: 1 }
      ]
    },
    great_fire_staff: {
      materials: [
        { name: 'Steel Bar T4', amount: 16 },
        { name: 'Chestnut Plank T4', amount: 8 }
      ]
    }
  };

  const state = {
    itemCatalog: [],
    recipes: {},
    materials: [{ name: '', qty: 1, price: 0 }],
    multiItems: [{ name: 'Battleaxe', tier: 'T4', enchant: '.0', qty: 1 }],
    history: []
  };

  const els = {
    itemName: document.getElementById('itemName'),
    itemTier: document.getElementById('itemTier'),
    itemEnchant: document.getElementById('itemEnchant'),
    craftQty: document.getElementById('craftQty'),
    focusCost: document.getElementById('focusCost'),
    focusReturn: document.getElementById('focusReturn'),
    itemFocusCost: document.getElementById('itemFocusCost'),
    itemFocusReturn: document.getElementById('itemFocusReturn'),
    focusUsed: document.getElementById('focusUsed'),
    materialBody: document.getElementById('materialBody'),
    multiItemBody: document.getElementById('multiItemBody'),
    resultBody: document.getElementById('resultTable').querySelector('tbody'),
    historyBody: document.getElementById('historyTable').querySelector('tbody'),
    bestRegion: document.getElementById('bestRegion'),
    bestProfit: document.getElementById('bestProfit'),
    bestROI: document.getElementById('bestROI'),
    breakEven: document.getElementById('breakEven'),
    summaryMaterial: document.getElementById('summaryMaterial'),
    summaryProfit: document.getElementById('summaryProfit'),
    summaryProfitItem: document.getElementById('summaryProfitItem'),
    summaryBreakEven: document.getElementById('summaryBreakEven'),
    analysisBest: document.getElementById('analysisBest'),
    analysisWorst: document.getElementById('analysisWorst'),
    analysisROI: document.getElementById('analysisROI'),
    analysisProfit: document.getElementById('analysisProfit'),
    craftFeeGlobal: document.getElementById('craftFeeGlobal'),
    feeValue: document.getElementById('feeValue'),
    nutritionCost: document.getElementById('nutritionCost')
  };

  function init() {
    bindEvents();
    loadStaticData();
    loadHistory();
    renderMaterialRows();
    renderMultiItems();
    updateFeeValue();
    calculateAndRender(false);
  }

  function bindEvents() {
    document.getElementById('addMaterial').addEventListener('click', () => {
      state.materials.push({ name: '', qty: 1, price: 0 });
      renderMaterialRows();
      calculateAndRender();
    });

    document.getElementById('addItem').addEventListener('click', () => {
      state.multiItems.push({ name: '', tier: 'T4', enchant: '.0', qty: 1 });
      renderMultiItems();
      calculateAndRender();
    });

    document.getElementById('calculate').addEventListener('click', () => calculateAndRender(true));
    document.getElementById('reset').addEventListener('click', resetCalculator);
    document.getElementById('savePreset').addEventListener('click', savePreset);
    document.getElementById('loadPreset').addEventListener('click', loadPreset);
    document.getElementById('exportCSV').addEventListener('click', exportCSV);

    els.craftFeeGlobal.addEventListener('input', () => {
      updateFeeValue();
      calculateAndRender();
    });

    [els.itemName, els.itemTier, els.itemEnchant, els.craftQty, els.focusCost, els.focusReturn, els.itemFocusCost, els.itemFocusReturn, els.focusUsed, els.nutritionCost]
      .forEach((element) => {
        element.addEventListener('input', () => {
          if (element === els.itemName) {
            autoFillFromRecipe();
          }
          calculateAndRender();
        });
      });

    els.materialBody.addEventListener('input', handleMaterialInput);
    els.materialBody.addEventListener('click', handleMaterialClick);
    els.multiItemBody.addEventListener('input', handleMultiInput);
    els.multiItemBody.addEventListener('click', handleMultiClick);

    document.querySelectorAll('#regionTable input').forEach((input) => {
      input.addEventListener('input', () => calculateAndRender());
    });
  }

  async function loadStaticData() {
    try {
      const response = await fetch('./data/items.json');
      if (!response.ok) {
        throw new Error('Unable to load items data');
      }
      const items = await response.json();
      state.itemCatalog = Array.isArray(items) ? items : fallbackItems;
    } catch (error) {
      state.itemCatalog = fallbackItems;
    }

    try {
      const response = await fetch('./data/recipes.json');
      if (!response.ok) {
        throw new Error('Unable to load recipe data');
      }
      const recipes = await response.json();
      state.recipes = recipes && typeof recipes === 'object' ? recipes : fallbackRecipes;
    } catch (error) {
      state.recipes = fallbackRecipes;
    }
  }

  function autoFillFromRecipe() {
    const normalizedName = (els.itemName.value || '').trim().toLowerCase();
    const recipeKey = findRecipeKey(normalizedName);
    if (!recipeKey) {
      return;
    }

    const isBlankMaterials = state.materials.length === 0 || state.materials.every((row) => !row.name && row.qty === 1 && row.price === 0);
    if (!isBlankMaterials) {
      return;
    }

    const recipeMaterials = state.recipes[recipeKey]?.materials || [];
    state.materials = recipeMaterials.map((material) => ({ name: material.name, qty: material.amount || 1, price: 0 }));
    renderMaterialRows();
  }

  function findRecipeKey(value) {
    const trimmed = value.trim().toLowerCase();
    const exactMatch = Object.keys(state.recipes).find((key) => key.toLowerCase() === trimmed);
    if (exactMatch) {
      return exactMatch;
    }
    const catalogNameMatch = state.itemCatalog.find((item) => (item.name || '').toLowerCase() === trimmed || (item.id || '').toLowerCase() === trimmed);
    if (catalogNameMatch) {
      return catalogNameMatch.id;
    }
    return null;
  }

  function renderMaterialRows() {
    if (!state.materials.length) {
      state.materials = [{ name: '', qty: 1, price: 0 }];
    }

    els.materialBody.innerHTML = state.materials.map((row, index) => `
      <tr data-index="${index}">
        <td><input class="materialName" type="text" placeholder="Tin Ore T3" value="${escapeHtml(row.name)}"></td>
        <td><input class="materialQty" type="number" min="1" value="${row.qty}"></td>
        <td><input class="materialPrice" type="number" min="0" step="0.01" value="${row.price}"></td>
        <td class="material-total">${formatCurrency(row.qty * row.price)}</td>
        <td><button class="deleteMaterial" type="button">Delete</button></td>
      </tr>
    `).join('');
  }

  function renderMultiItems() {
    if (!state.multiItems.length) {
      state.multiItems = [{ name: '', tier: 'T4', enchant: '.0', qty: 1 }];
    }

    els.multiItemBody.innerHTML = state.multiItems.map((row, index) => `
      <tr data-index="${index}">
        <td><input type="text" placeholder="Battleaxe" value="${escapeHtml(row.name)}"></td>
        <td>
          <select>
            ${['T4', 'T5', 'T6', 'T7', 'T8'].map((tier) => `<option value="${tier}" ${row.tier === tier ? 'selected' : ''}>${tier}</option>`).join('')}
          </select>
        </td>
        <td>
          <select>
            ${['.0', '.1', '.2', '.3', '.4'].map((enchant) => `<option value="${enchant}" ${row.enchant === enchant ? 'selected' : ''}>${enchant}</option>`).join('')}
          </select>
        </td>
        <td><input type="number" value="${row.qty}" min="1"></td>
        <td><button class="deleteItem" type="button">Delete</button></td>
      </tr>
    `).join('');
  }

  function handleMaterialInput(event) {
    const row = event.target.closest('tr');
    if (!row) {
      return;
    }
    const index = Number(row.dataset.index);
    const current = state.materials[index];
    if (!current) {
      return;
    }

    if (event.target.classList.contains('materialName')) {
      current.name = event.target.value;
    } else if (event.target.classList.contains('materialQty')) {
      current.qty = Number(event.target.value || 0);
    } else if (event.target.classList.contains('materialPrice')) {
      current.price = Number(event.target.value || 0);
    }

    const totalCell = row.querySelector('.material-total');
    if (totalCell) {
      totalCell.textContent = formatCurrency((current.qty || 0) * (current.price || 0));
    }

    calculateAndRender();
  }

  function handleMaterialClick(event) {
    if (!event.target.classList.contains('deleteMaterial')) {
      return;
    }
    const row = event.target.closest('tr');
    if (!row) {
      return;
    }
    const index = Number(row.dataset.index);
    state.materials.splice(index, 1);
    renderMaterialRows();
    calculateAndRender();
  }

  function handleMultiInput(event) {
    const row = event.target.closest('tr');
    if (!row) {
      return;
    }
    const index = Number(row.dataset.index);
    const current = state.multiItems[index];
    if (!current) {
      return;
    }

    const inputs = row.querySelectorAll('input, select');
    current.name = inputs[0].value;
    current.tier = inputs[1].value;
    current.enchant = inputs[2].value;
    current.qty = Number(inputs[3].value || 1);
    calculateAndRender();
  }

  function handleMultiClick(event) {
    if (!event.target.classList.contains('deleteItem')) {
      return;
    }
    const row = event.target.closest('tr');
    if (!row) {
      return;
    }
    const index = Number(row.dataset.index);
    state.multiItems.splice(index, 1);
    renderMultiItems();
    calculateAndRender();
  }

  function calculateAndRender(saveHistory = false) {
    const regions = collectRegions();
    const mainCraftQty = Number(els.craftQty.value || 1);
    const materials = state.materials.filter((row) => row.name.trim() || row.qty > 0 || row.price > 0);
    const multiItems = state.multiItems.filter((row) => row.name.trim() || row.qty > 0);

    const mainMaterialRows = getMaterialRowsForSelection(els.itemName.value, materials);
    const mainMaterialCost = computeMaterialCost(mainMaterialRows, mainCraftQty);

    const multiItemCosts = multiItems.map((row) => {
      const multiMaterialRows = getMaterialRowsForSelection(row.name, materials);
      const cost = computeMaterialCost(multiMaterialRows, Number(row.qty || 1));
      return { ...row, cost };
    });

    const totalMaterialCost = mainMaterialCost + multiItemCosts.reduce((sum, item) => sum + item.cost, 0);
    const globalCraftFee = Number(els.craftFeeGlobal.value || 0);
    const nutritionCost = Number(els.nutritionCost.value || 0);
    const focusCost = Number(els.focusCost.value || 0);
    const focusReturn = Number(els.focusReturn.value || 0);
    const itemFocusCost = Number(els.itemFocusCost.value || 0);
    const itemFocusReturn = Number(els.itemFocusReturn.value || 0);
    const focusUsed = Number(els.focusUsed.value || 0);

    const focusAdjustment = Math.max(0, mainMaterialCost * (focusReturn / 100));
    const itemFocusAdjustment = Math.max(0, mainMaterialCost * (itemFocusReturn / 100));
    const focusOutlay = focusCost * mainCraftQty + itemFocusCost * focusUsed;
    const adjustedMaterialCost = Math.max(0, mainMaterialCost - focusAdjustment - itemFocusAdjustment);
    const totalCraftQuantity = mainCraftQty + multiItemCosts.reduce((sum, item) => sum + Number(item.qty || 1), 0);

    const rows = regions.map((region) => {
      const craftCost = adjustedMaterialCost + totalMaterialCost + Number(region.fee || 0) + globalCraftFee + nutritionCost + focusOutlay;
      const sellPrice = Number(region.sell || 0);
      const adjustedSellPrice = Math.max(0, sellPrice * (1 - Number(region.rrr || 0) / 100) * (1 - Number(region.tax || 0) / 100) - Number(region.transport || 0));
      const revenue = adjustedSellPrice * totalCraftQuantity;
      const profit = revenue - craftCost;
      const profitPerItem = totalCraftQuantity > 0 ? profit / totalCraftQuantity : 0;
      const roi = craftCost > 0 ? (profit / craftCost) * 100 : 0;
      const materialLabel = [els.itemName.value.trim() || 'Item', ...multiItems.map((item) => item.name.trim() || 'Item')].filter(Boolean).join(', ') || 'Craft';
      return {
        region: region.name,
        material: materialLabel,
        craftCost: craftCost,
        revenue: revenue,
        profit: profit,
        profitPerItem: profitPerItem,
        roi: roi,
        quantity: totalCraftQuantity
      };
    });

    rows.sort((a, b) => b.profit - a.profit);
    renderResults(rows);
    renderDashboard(rows);
    renderSummary(rows, totalMaterialCost, focusOutlay);
    renderAnalysis(rows);

    if (saveHistory) {
      addHistoryEntry(rows);
    }
  }

  function computeMaterialCost(materialRows, quantity) {
    const baseRows = Array.isArray(materialRows) && materialRows.length
      ? materialRows
      : state.materials.filter((row) => row.name.trim() || row.qty > 0 || row.price > 0);

    const total = baseRows.reduce((sum, row) => sum + (Number(row.qty || 0) * Number(row.price || 0)), 0);
    return total * Number(quantity || 1);
  }

  function getMaterialRowsForSelection(itemName, fallbackMaterials) {
    const hasUserEntries = state.materials.some((row) => row.name.trim() || Number(row.qty || 0) > 0 || Number(row.price || 0) > 0);
    if (hasUserEntries) {
      return state.materials
        .filter((row) => row.name.trim() || Number(row.qty || 0) > 0 || Number(row.price || 0) > 0)
        .map((row) => ({ name: row.name, qty: Number(row.qty || 1), price: Number(row.price || 0) }));
    }

    const normalized = (itemName || '').trim().toLowerCase();
    const recipeKey = findRecipeKey(normalized);
    if (recipeKey && state.recipes[recipeKey]?.materials?.length) {
      return state.recipes[recipeKey].materials.map((material) => ({
        name: material.name,
        qty: Number(material.amount || 1),
        price: 0
      }));
    }

    return fallbackMaterials.map((row) => ({ name: row.name, qty: Number(row.qty || 1), price: Number(row.price || 0) }));
  }

  function collectRegions() {
    const rows = Array.from(document.querySelectorAll('#regionTable tbody tr'));
    return rows.map((row) => {
      const name = row.cells[0].textContent.trim();
      return {
        name,
        rrr: Number(row.querySelector('.rrr').value || 0),
        fee: Number(row.querySelector('.fee').value || 0),
        sell: Number(row.querySelector('.sell').value || 0),
        tax: Number(row.querySelector('.tax').value || 0),
        transport: Number(row.querySelector('.transport').value || 0)
      };
    });
  }

  function renderResults(rows) {
    els.resultBody.innerHTML = rows.map((row, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(row.region)}</td>
        <td>${escapeHtml(row.material)}</td>
        <td>${formatCurrency(row.craftCost)}</td>
        <td>${formatCurrency(row.revenue)}</td>
        <td class="${row.profit >= 0 ? 'profitPositive' : 'profitNegative'}">${formatCurrency(row.profit)}</td>
        <td>${formatCurrency(row.profitPerItem)}</td>
        <td class="${getRoiClass(row.roi)}">${formatNumber(row.roi)}%</td>
      </tr>
    `).join('');
  }

  function renderDashboard(rows) {
    if (!rows.length) {
      els.bestRegion.textContent = '-';
      els.bestProfit.textContent = '0';
      els.bestROI.textContent = '0%';
      els.breakEven.textContent = '0';
      return;
    }

    const best = rows[0];
    els.bestRegion.textContent = best.region;
    els.bestProfit.textContent = formatCurrency(best.profit);
    els.bestROI.textContent = formatNumber(best.roi) + '%';
    els.breakEven.textContent = formatNumber(Math.max(1, Math.ceil(Math.abs(best.craftCost) / Math.max(1, best.profitPerItem || 1))));
  }

  function renderSummary(rows, totalMaterialCost, focusOutlay) {
    const profit = rows.length ? rows[0].profit : 0;
    const profitPerItem = rows.length ? rows[0].profitPerItem : 0;
    const breakEven = Math.max(1, Math.ceil(Math.abs(totalMaterialCost + focusOutlay) / Math.max(1, profitPerItem || 1)));

    els.summaryMaterial.textContent = formatCurrency(totalMaterialCost);
    els.summaryProfit.textContent = formatCurrency(profit);
    els.summaryProfitItem.textContent = formatCurrency(profitPerItem);
    els.summaryBreakEven.textContent = formatNumber(breakEven);
  }

  function renderAnalysis(rows) {
    if (!rows.length) {
      els.analysisBest.textContent = '-';
      els.analysisWorst.textContent = '-';
      els.analysisROI.textContent = '0%';
      els.analysisProfit.textContent = '0';
      return;
    }

    const best = rows.reduce((current, item) => (item.profit > current.profit ? item : current), rows[0]);
    const worst = rows.reduce((current, item) => (item.profit < current.profit ? item : current), rows[0]);
    const bestRoi = rows.reduce((current, item) => (item.roi > current.roi ? item : current), rows[0]);

    els.analysisBest.textContent = best.region;
    els.analysisWorst.textContent = worst.region;
    els.analysisROI.textContent = formatNumber(bestRoi.roi) + '%';
    els.analysisProfit.textContent = formatCurrency(best.profit);
  }

  function addHistoryEntry(rows) {
    const itemName = els.itemName.value.trim() || 'Unnamed Item';
    const best = rows[0] ? rows[0] : null;
    const entry = {
      date: new Date().toLocaleString(),
      item: itemName,
      region: best ? best.region : '-',
      profit: best ? best.profit : 0,
      roi: best ? best.roi : 0
    };

    state.history.unshift(entry);
    state.history = state.history.slice(0, 20);
    saveHistory();
    renderHistory();
  }

  function renderHistory() {
    if (!state.history.length) {
      els.historyBody.innerHTML = '<tr><td colspan="5">No calculations yet.</td></tr>';
      return;
    }

    els.historyBody.innerHTML = state.history.map((entry) => `
      <tr>
        <td>${escapeHtml(entry.date)}</td>
        <td>${escapeHtml(entry.item)}</td>
        <td>${escapeHtml(entry.region)}</td>
        <td>${formatCurrency(entry.profit)}</td>
        <td class="${getRoiClass(entry.roi)}">${formatNumber(entry.roi)}%</td>
      </tr>
    `).join('');
  }

  function loadHistory() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.history);
      if (!stored) {
        state.history = [];
      } else {
        state.history = JSON.parse(stored) || [];
      }
    } catch (error) {
      state.history = [];
    }
    renderHistory();
  }

  function saveHistory() {
    try {
      localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(state.history));
    } catch (error) {
      console.warn('Unable to save history', error);
    }
  }

  function savePreset() {
    const name = prompt('Preset name', 'My Preset');
    if (!name) {
      return;
    }

    const preset = {
      name,
      itemName: els.itemName.value,
      itemTier: els.itemTier.value,
      itemEnchant: els.itemEnchant.value,
      craftQty: els.craftQty.value,
      focusCost: els.focusCost.value,
      focusReturn: els.focusReturn.value,
      itemFocusCost: els.itemFocusCost.value,
      itemFocusReturn: els.itemFocusReturn.value,
      focusUsed: els.focusUsed.value,
      materials: state.materials,
      multiItems: state.multiItems,
      regions: collectRegions(),
      globalFee: els.craftFeeGlobal.value,
      nutritionCost: els.nutritionCost.value
    };

    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.presets) || '[]');
      const existingIndex = stored.findIndex((entry) => entry.name === name);
      if (existingIndex >= 0) {
        stored[existingIndex] = preset;
      } else {
        stored.push(preset);
      }
      localStorage.setItem(STORAGE_KEYS.presets, JSON.stringify(stored));
      alert(`Preset saved as ${name}`);
    } catch (error) {
      console.warn('Unable to save preset', error);
    }
  }

  function loadPreset() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.presets) || '[]');
      if (!stored.length) {
        alert('No presets found.');
        return;
      }
      const name = prompt('Preset name to load', stored[0].name || 'My Preset');
      if (!name) {
        return;
      }
      const preset = stored.find((entry) => entry.name === name);
      if (!preset) {
        alert('Preset not found.');
        return;
      }
      applyPreset(preset);
      alert(`Loaded preset ${name}`);
    } catch (error) {
      console.warn('Unable to load preset', error);
    }
  }

  function applyPreset(preset) {
    els.itemName.value = preset.itemName || '';
    els.itemTier.value = preset.itemTier || 'T4';
    els.itemEnchant.value = preset.itemEnchant || '.0';
    els.craftQty.value = preset.craftQty || 1;
    els.focusCost.value = preset.focusCost || 0;
    els.focusReturn.value = preset.focusReturn || 0;
    els.itemFocusCost.value = preset.itemFocusCost || 0;
    els.itemFocusReturn.value = preset.itemFocusReturn || 0;
    els.focusUsed.value = preset.focusUsed || 0;
    els.craftFeeGlobal.value = preset.globalFee || 0;
    els.nutritionCost.value = preset.nutritionCost || 0;
    state.materials = Array.isArray(preset.materials) && preset.materials.length ? preset.materials : [{ name: '', qty: 1, price: 0 }];
    state.multiItems = Array.isArray(preset.multiItems) && preset.multiItems.length ? preset.multiItems : [{ name: '', tier: 'T4', enchant: '.0', qty: 1 }];
    renderMaterialRows();
    renderMultiItems();
    updateFeeValue();
    populateRegionData(preset.regions || regionDefaults);
    calculateAndRender();
  }

  function populateRegionData(regions) {
    const rows = Array.from(document.querySelectorAll('#regionTable tbody tr'));
    const data = Array.isArray(regions) && regions.length ? regions : regionDefaults;
    rows.forEach((row, index) => {
      const region = data[index] || data[0] || regionDefaults[index] || regionDefaults[0];
      row.cells[0].textContent = region.name || row.cells[0].textContent;
      row.querySelector('.rrr').value = region.rrr ?? 0;
      row.querySelector('.fee').value = region.fee ?? 0;
      row.querySelector('.sell').value = region.sell ?? 0;
      row.querySelector('.tax').value = region.tax ?? 0;
      row.querySelector('.transport').value = region.transport ?? 0;
    });
  }

  function resetCalculator() {
    els.itemName.value = '';
    els.itemTier.value = 'T4';
    els.itemEnchant.value = '.0';
    els.craftQty.value = 1;
    els.focusCost.value = 0;
    els.focusReturn.value = 0;
    els.itemFocusCost.value = 0;
    els.itemFocusReturn.value = 0;
    els.focusUsed.value = 0;
    els.craftFeeGlobal.value = 0;
    els.nutritionCost.value = 0;
    state.materials = [{ name: '', qty: 1, price: 0 }];
    state.multiItems = [{ name: 'Battleaxe', tier: 'T4', enchant: '.0', qty: 1 }];
    populateRegionData(regionDefaults);
    renderMaterialRows();
    renderMultiItems();
    updateFeeValue();
    calculateAndRender();
  }

  function exportCSV() {
    const rows = Array.from(els.resultBody.children);
    if (!rows.length) {
      alert('No calculation data to export.');
      return;
    }

    const csvRows = [
      ['Rank', 'Region', 'Material', 'Craft Cost', 'Revenue', 'Profit', 'Profit / Item', 'ROI'],
      ...Array.from(rows).map((row) => Array.from(row.cells).map((cell) => cell.textContent.trim()))
    ];

    const csvContent = csvRows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'albion-calculator-results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function updateFeeValue() {
    els.feeValue.textContent = formatCurrency(Number(els.craftFeeGlobal.value || 0));
  }

  function getRoiClass(roi) {
    if (roi >= 20) {
      return 'roiGood';
    }
    if (roi >= 5) {
      return 'roiMedium';
    }
    return 'roiBad';
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2
    }).format(Number(value || 0));
  }

  function formatNumber(value) {
    return Number(value || 0).toFixed(2);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
