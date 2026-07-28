(function () {
  const APP_PASSWORD = 'Pedagang Brok233';
  const AUTH_STORAGE_KEY = 'albionCalculatorAuthenticated';
  const STORAGE_KEYS = {
    presets: 'albionCalculatorPresets',
    history: 'albionCalculatorHistory',
    state: 'albionCalculatorState',
    marketHistory: 'albionCalculatorMarketHistory'
  };

  const CITY_NAMES = ['Bridgewatch', 'Martlock', 'Lymhurst', 'Fort Sterling', 'Thetford', 'Caerleon', 'Brecilien'];

  const regionDefaults = CITY_NAMES.map((name, index) => ({
    name,
    rrr: index === 5 ? 0 : 15.2,
    fee: 0,
    sell: 0,
    tax: index === 5 ? 10.5 : 6.5,
    transport: 0,
    focusReturn: 0,
    nutritionCost: 0
  }));

  const fallbackItems = [
    { id: 'bronze_bar', name: 'Bronze Bar T3' },
    { id: 'steel_bar', name: 'Steel Bar T4' },
    { id: 'great_fire_staff', name: 'Great Fire Staff T4' }
  ];

  const fallbackRecipes = {
    bronze_bar: { materials: [{ name: 'Tin Ore T3', amount: 2 }, { name: 'Tin Bar T2', amount: 1 }] },
    steel_bar: { materials: [{ name: 'Copper Ore T4', amount: 2 }, { name: 'Bronze Bar T3', amount: 1 }] },
    great_fire_staff: { materials: [{ name: 'Steel Bar T4', amount: 16 }, { name: 'Chestnut Plank T4', amount: 8 }] }
  };

  function createCityPriceMap() {
    return CITY_NAMES.reduce((acc, city) => {
      acc[city] = 0;
      return acc;
    }, {});
  }

  function createEmptyMaterial() {
    return { name: '', qty: 1, price: 0, prices: createCityPriceMap() };
  }

  const state = {
    itemCatalog: [],
    recipes: {},
    materials: [createEmptyMaterial()],
    multiItems: [{ name: 'Battleaxe', tier: 'T4', enchant: '.0', qty: 1 }],
    history: [],
    marketHistory: {},
    presets: [],
    shoppingChecklist: [],
    darkMode: true,
    transportMatrix: CITY_NAMES.reduce((acc, from) => {
      acc[from] = CITY_NAMES.reduce((cityAcc, to) => {
        cityAcc[to] = 0;
        return cityAcc;
      }, {});
      return acc;
    }, {})
  };

  const els = {
    authScreen: document.getElementById('authScreen'),
    appShell: document.getElementById('appShell'),
    loginForm: document.getElementById('loginForm'),
    passwordInput: document.getElementById('passwordInput'),
    loginMessage: document.getElementById('loginMessage'),
    logoutButton: document.getElementById('logoutButton'),
    splashScreen: document.getElementById('splashScreen'),
    loadingScreen: document.getElementById('loadingScreen'),
    loadingStatus: document.getElementById('loadingStatus'),
    loadingProgressBar: document.getElementById('loadingProgressBar'),
    loadingPercent: document.getElementById('loadingPercent'),
    loadingHint: document.getElementById('loadingHint'),
    body: document.body,
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
    nutritionCost: document.getElementById('nutritionCost'),
    transportMatrix: document.getElementById('transportMatrix'),
    optimizerCheapestCity: document.getElementById('optimizerCheapestCity'),
    optimizerCheapestPrice: document.getElementById('optimizerCheapestPrice'),
    optimizerTotalCost: document.getElementById('optimizerTotalCost'),
    optimizerSingleCity: document.getElementById('optimizerSingleCity'),
    optimizerMixedCost: document.getElementById('optimizerMixedCost'),
    optimizerTable: document.getElementById('optimizerTableBody'),
    strategySummary: document.getElementById('strategySummary'),
    strategyA: document.getElementById('strategyA'),
    strategyB: document.getElementById('strategyB'),
    strategyC: document.getElementById('strategyC'),
    routeTableBody: document.getElementById('routeTableBody'),
    routeExplanation: document.getElementById('routeExplanation'),
    warningBox: document.getElementById('warningBox'),
    bestItemBody: document.getElementById('bestItemBody'),
    marketHistoryBody: document.getElementById('marketHistoryBody'),
    inventoryOwnedQty: document.getElementById('inventoryOwnedQty'),
    inventoryAlreadyOwned: document.getElementById('inventoryAlreadyOwned'),
    inventoryRemainingQty: document.getElementById('inventoryRemainingQty'),
    inventoryPurchaseQty: document.getElementById('inventoryPurchaseQty'),
    inventoryProfit: document.getElementById('inventoryProfit'),
    inventoryROI: document.getElementById('inventoryROI'),
    inventoryShoppingList: document.getElementById('inventoryShoppingList'),
    shoppingChecklist: document.getElementById('shoppingChecklist'),
    darkModeToggle: document.getElementById('darkModeToggle')
  };

  async function init() {
    bindEvents();
    renderTransportMatrix();
    await startApplicationStartup();
  }

  function setLoadingState(percent, message, hint) {
    if (els.loadingProgressBar) {
      els.loadingProgressBar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
    }
    if (els.loadingPercent) {
      els.loadingPercent.textContent = `${Math.round(percent)}%`;
    }
    if (els.loadingStatus) {
      els.loadingStatus.textContent = message;
    }
    if (els.loadingHint) {
      els.loadingHint.textContent = hint || 'Please wait';
    }
  }

  function waitForNextFrame() {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }

  async function startApplicationStartup() {
    els.body.classList.add('startup-loading');
    showSplashScreen();
    setLoadingState(0, 'Initializing application...', 'Preparing startup');
    await wait(1600);
    hideSplashScreen();
    await wait(120);
    showLoadingScreen();

    const steps = [
      { progress: 10, message: 'Initializing application...', hint: 'Booting interface' },
      { progress: 20, message: 'Loading calculator engine...', hint: 'Preparing formulas' },
      { progress: 35, message: 'Loading saved market prices...', hint: 'Restoring local prices' },
      { progress: 50, message: 'Loading inventory...', hint: 'Restoring item balance' },
      { progress: 65, message: 'Loading price presets...', hint: 'Restoring saved templates' },
      { progress: 75, message: 'Loading user settings...', hint: 'Restoring theme and preferences' },
      { progress: 85, message: 'Loading calculation history...', hint: 'Restoring recent runs' },
      { progress: 93, message: 'Preparing dashboard...', hint: 'Rendering calculator views' },
      { progress: 97, message: 'Finalizing...', hint: 'Almost ready' },
      { progress: 100, message: 'Ready!', hint: 'Opening dashboard' }
    ];

    for (const [index, step] of steps.entries()) {
      setLoadingState(step.progress, step.message, step.hint);
      await waitForNextFrame();

      if (index === 1) {
        await loadStaticData();
      } else if (index === 2) {
        restoreAppState();
      } else if (index === 3) {
        loadShoppingChecklist();
      } else if (index === 4) {
        loadPresets();
      } else if (index === 5) {
        restoreUserSettings();
      } else if (index === 6) {
        loadHistory();
      } else if (index === 7) {
        renderMaterialRows();
        renderMultiItems();
        updateFeeValue();
        calculateAndRender(false);
      } else if (index === 8) {
        await wait(100);
      } else if (index === 9) {
        await wait(120);
      }

      await wait(70);
    }

    hideLoadingScreen();
    els.body.classList.remove('startup-loading');
    finalizeStartup();
  }

  function restoreUserSettings() {
    applyTheme();
    const isAuthenticated = localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
    if (isAuthenticated) {
      document.body.classList.add('authenticated');
      els.authScreen.classList.add('is-hidden');
      els.appShell.classList.add('is-visible');
    } else {
      document.body.classList.remove('authenticated');
      els.authScreen.classList.remove('is-hidden');
      els.appShell.classList.remove('is-visible');
    }
  }

  function finalizeStartup() {
    const isAuthenticated = localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
    if (isAuthenticated) {
      document.body.classList.add('authenticated');
      els.authScreen.classList.add('is-hidden');
      els.appShell.classList.add('is-visible');
    } else {
      document.body.classList.remove('authenticated');
      els.authScreen.classList.remove('is-hidden');
      els.appShell.classList.remove('is-visible');
    }
  }

  function wait(duration) {
    return new Promise((resolve) => setTimeout(resolve, duration));
  }

  function bindEvents() {
    document.getElementById('addMaterial').addEventListener('click', () => {
      state.materials.push(createEmptyMaterial());
      renderMaterialRows();
      saveAppState();
      calculateAndRender();
    });

    document.getElementById('addItem').addEventListener('click', () => {
      state.multiItems.push({ name: '', tier: 'T4', enchant: '.0', qty: 1 });
      renderMultiItems();
      saveAppState();
      calculateAndRender();
    });

    document.getElementById('calculate').addEventListener('click', () => calculateAndRender(true));
    document.getElementById('reset').addEventListener('click', resetCalculator);
    document.getElementById('savePreset').addEventListener('click', savePreset);
    document.getElementById('loadPreset').addEventListener('click', loadPreset);
    document.getElementById('renamePreset').addEventListener('click', renamePreset);
    document.getElementById('deletePreset').addEventListener('click', deletePreset);
    document.getElementById('exportJson').addEventListener('click', exportPresets);
    document.getElementById('importJson').addEventListener('click', () => document.getElementById('importPresetInput').click());
    document.getElementById('importPresetInput').addEventListener('change', importPresets);
    document.getElementById('exportCSV').addEventListener('click', exportCSV);
    els.darkModeToggle.addEventListener('click', toggleTheme);

    els.craftFeeGlobal.addEventListener('input', () => {
      updateFeeValue();
      saveAppState();
      calculateAndRender();
    });

    [els.itemName, els.itemTier, els.itemEnchant, els.craftQty, els.focusCost, els.focusReturn, els.itemFocusCost, els.itemFocusReturn, els.focusUsed, els.nutritionCost]
      .forEach((element) => {
        element.addEventListener('input', () => {
          if (element === els.itemName) {
            autoFillFromRecipe();
          }
          saveAppState();
          calculateAndRender();
        });
      });

    els.materialBody.addEventListener('input', handleMaterialInput);
    els.materialBody.addEventListener('click', handleMaterialClick);
    els.multiItemBody.addEventListener('input', handleMultiInput);
    els.multiItemBody.addEventListener('click', handleMultiClick);

    document.querySelectorAll('#regionTable input').forEach((input) => {
      input.addEventListener('input', () => {
        saveAppState();
        calculateAndRender();
      });
    });

    els.transportMatrix.addEventListener('input', (event) => {
      if (event.target.classList.contains('transport-cell')) {
        const { from, to } = event.target.dataset;
        state.transportMatrix[from][to] = Number(event.target.value || 0);
        saveAppState();
        calculateAndRender();
      }
    });

    [els.inventoryOwnedQty, els.inventoryAlreadyOwned].forEach((element) => {
      element.addEventListener('input', () => {
        saveAppState();
        calculateAndRender();
      });
    });

    els.shoppingChecklist.addEventListener('change', (event) => {
      if (event.target.classList.contains('checklist-item')) {
        const id = event.target.dataset.id;
        const item = state.shoppingChecklist.find((entry) => entry.id === id);
        if (item) {
          item.checked = event.target.checked;
          saveShoppingChecklist();
        }
      }
    });

    els.loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (els.passwordInput.value === APP_PASSWORD) {
        localStorage.setItem(AUTH_STORAGE_KEY, 'true');
        document.body.classList.add('authenticated');
        els.authScreen.classList.add('is-hidden');
        els.appShell.classList.add('is-visible');
        els.loginMessage.textContent = '';
        saveAppState();
      } else {
        els.loginMessage.textContent = 'Password is incorrect.';
      }
    });

    els.logoutButton.addEventListener('click', () => {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      document.body.classList.remove('authenticated');
      els.authScreen.classList.remove('is-hidden');
      els.appShell.classList.remove('is-visible');
      els.passwordInput.value = '';
      els.loginMessage.textContent = '';
    });

    if (localStorage.getItem(AUTH_STORAGE_KEY) === 'true') {
      document.body.classList.add('authenticated');
      els.authScreen.classList.add('is-hidden');
      els.appShell.classList.add('is-visible');
    }
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

    const isBlankMaterials = state.materials.length === 0 || state.materials.every((row) => !row.name && row.qty === 1 && row.price === 0 && Object.values(row.prices || {}).every((value) => Number(value || 0) === 0));
    if (!isBlankMaterials) {
      return;
    }

    const recipeMaterials = state.recipes[recipeKey]?.materials || [];
    state.materials = recipeMaterials.map((material) => ({
      name: material.name,
      qty: material.amount || 1,
      price: 0,
      prices: createCityPriceMap()
    }));
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
      state.materials = [createEmptyMaterial()];
    }

    els.materialBody.innerHTML = state.materials.map((row, index) => `
      <tr data-index="${index}">
        <td><input class="materialName" type="text" placeholder="Tin Ore T3" value="${escapeHtml(row.name)}"></td>
        <td><input class="materialQty" type="number" min="1" value="${row.qty}"></td>
        <td><input class="materialPrice" type="number" min="0" step="0.01" value="${row.price}"></td>
        ${CITY_NAMES.map((city) => `<td><input class="cityPrice" data-city="${city}" type="number" min="0" step="0.01" value="${getMaterialUnitCost(row, city)}"></td>`).join('')}
        <td class="material-total">${formatCurrency(getMaterialTotal(row))}</td>
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
      CITY_NAMES.forEach((city) => {
        current.prices[city] = current.price;
      });
    } else if (event.target.classList.contains('cityPrice')) {
      const city = event.target.dataset.city;
      current.prices[city] = Number(event.target.value || 0);
      current.price = current.prices[city];
    }

    const totalCell = row.querySelector('.material-total');
    if (totalCell) {
      totalCell.textContent = formatCurrency(getMaterialTotal(current));
    }

    recordMaterialHistory(current);
    saveAppState();
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
    saveAppState();
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
    saveAppState();
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
    saveAppState();
    calculateAndRender();
  }

  function calculateAndRender(saveHistory = false) {
    const regions = collectRegions();
    const mainCraftQty = Number(els.craftQty.value || 1);
    const materials = state.materials.filter((row) => row.name.trim() || row.qty > 0 || row.price > 0 || Object.values(row.prices || {}).some((value) => Number(value || 0) > 0));
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

    const rows = regions.map((region, index) => {
      const craftCost = adjustedMaterialCost + totalMaterialCost + Number(region.fee || 0) + globalCraftFee + nutritionCost + focusOutlay;
      const sellPrice = Number(region.sell || 0);
      const adjustedSellPrice = Math.max(0, sellPrice * (1 - Number(region.rrr || 0) / 100) * (1 - Number(region.tax || 0) / 100) - Number(region.transport || 0));
      const revenue = adjustedSellPrice * totalCraftQuantity;
      const transportCost = Number(region.transport || 0);
      const profit = revenue - craftCost - transportCost;
      const profitPerItem = totalCraftQuantity > 0 ? profit / totalCraftQuantity : 0;
      const roi = craftCost + transportCost > 0 ? (profit / (craftCost + transportCost)) * 100 : 0;
      const materialLabel = [els.itemName.value.trim() || 'Item', ...multiItems.map((item) => item.name.trim() || 'Item')].filter(Boolean).join(', ') || 'Craft';
      return {
        region: region.name,
        material: materialLabel,
        craftCost: craftCost,
        revenue: revenue,
        profit: profit,
        profitPerItem: profitPerItem,
        roi: roi,
        quantity: totalCraftQuantity,
        transportCost: transportCost,
        regionData: region
      };
    });

    rows.sort((a, b) => b.profit - a.profit);

    const routeData = buildRouteOptimizations(materials, multiItems, mainCraftQty, totalMaterialCost, globalCraftFee, focusOutlay, nutritionCost, regions);
    renderResults(rows);
    renderDashboard(routeData.bestRoute || rows[0] || null, rows, totalMaterialCost, focusOutlay, routeData.routes);
    renderSummary(rows, totalMaterialCost, focusOutlay, routeData.bestRoute || rows[0] || null);
    renderAnalysis(rows);
    renderOptimizerSummary(materials, mainCraftQty, totalMaterialCost);
    renderBuyingStrategies(materials, mainCraftQty, routeData.bestRoute);
    renderRouteTable(routeData.routes);
    renderRouteExplanation(routeData.bestRoute);
    renderWarnings(rows, routeData.bestRoute, totalMaterialCost, totalCraftQuantity);
    renderBestItems(materials, multiItems, mainCraftQty, routeData.bestRoute);
    renderMarketHistory();
    renderInventorySummary(rows, totalCraftQuantity, totalMaterialCost, routeData.bestRoute);
    renderShoppingChecklist(materials);

    if (saveHistory) {
      addHistoryEntry(rows, routeData.bestRoute);
    }
  }

  function computeMaterialCost(materialRows, quantity) {
    const baseRows = Array.isArray(materialRows) && materialRows.length
      ? materialRows
      : state.materials.filter((row) => row.name.trim() || row.qty > 0 || row.price > 0 || Object.values(row.prices || {}).some((value) => Number(value || 0) > 0));

    const total = baseRows.reduce((sum, row) => sum + (Number(row.qty || 0) * Number(getMaterialUnitCost(row, 'Bridgewatch') || 0)), 0);
    return total * Number(quantity || 1);
  }

  function getMaterialRowsForSelection(itemName, fallbackMaterials) {
    const hasUserEntries = state.materials.some((row) => row.name.trim() || Number(row.qty || 0) > 0 || Number(row.price || 0) > 0 || Object.values(row.prices || {}).some((value) => Number(value || 0) > 0));
    if (hasUserEntries) {
      return state.materials.filter((row) => row.name.trim() || Number(row.qty || 0) > 0 || Number(row.price || 0) > 0 || Object.values(row.prices || {}).some((value) => Number(value || 0) > 0)).map((row) => ({ name: row.name, qty: Number(row.qty || 1), price: Number(row.price || 0), prices: row.prices }));
    }

    const normalized = (itemName || '').trim().toLowerCase();
    const recipeKey = findRecipeKey(normalized);
    if (recipeKey && state.recipes[recipeKey]?.materials?.length) {
      return state.recipes[recipeKey].materials.map((material) => ({
        name: material.name,
        qty: Number(material.amount || 1),
        price: 0,
        prices: createCityPriceMap()
      }));
    }

    return fallbackMaterials.map((row) => ({ name: row.name, qty: Number(row.qty || 1), price: Number(row.price || 0), prices: row.prices || createCityPriceMap() }));
  }

  function getMaterialUnitCost(row, city) {
    if (row && row.prices && typeof row.prices[city] !== 'undefined') {
      return Number(row.prices[city] || 0);
    }
    return Number(row.price || 0);
  }

  function getMaterialTotal(row) {
    return Number(row.qty || 0) * getMaterialUnitCost(row, 'Bridgewatch');
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
        transport: Number(row.querySelector('.transport').value || 0),
        focusReturn: Number(row.querySelector('.focusReturn').value || 0),
        nutritionCost: Number(row.querySelector('.nutritionCost').value || 0)
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

  function renderDashboard(bestRoute, rows, totalMaterialCost, focusOutlay, routes) {
    if (!bestRoute) {
      els.bestRegion.textContent = '-';
      els.bestProfit.textContent = '0';
      els.bestROI.textContent = '0%';
      els.breakEven.textContent = '0';
      return;
    }

    els.bestRegion.textContent = `${bestRoute.buyCity || '-'} → ${bestRoute.craftCity || '-'} → ${bestRoute.sellCity || '-'}`;
    els.bestProfit.textContent = formatCurrency(bestRoute.profit);
    els.bestROI.textContent = formatNumber(bestRoute.roi) + '%';
    els.breakEven.textContent = formatNumber(Math.max(1, Math.ceil(Math.abs(totalMaterialCost + focusOutlay + (bestRoute.transportCost || 0)) / Math.max(1, bestRoute.profitPerItem || 1))));
  }

  function renderSummary(rows, totalMaterialCost, focusOutlay, bestRoute) {
    const profit = bestRoute ? bestRoute.profit : rows.length ? rows[0].profit : 0;
    const profitPerItem = bestRoute ? bestRoute.profitPerItem : rows.length ? rows[0].profitPerItem : 0;
    const breakEven = Math.max(1, Math.ceil(Math.abs(totalMaterialCost + focusOutlay + (bestRoute ? bestRoute.transportCost : 0)) / Math.max(1, profitPerItem || 1)));

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

  function addHistoryEntry(rows, bestRoute) {
    const itemName = els.itemName.value.trim() || 'Unnamed Item';
    const best = bestRoute || (rows[0] ? rows[0] : null);
    const entry = {
      date: new Date().toLocaleString(),
      item: itemName,
      region: best ? `${best.buyCity || ''} → ${best.craftCity || ''} → ${best.sellCity || ''}` : '-',
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
      state.history = stored ? JSON.parse(stored) : [];
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
      nutritionCost: els.nutritionCost.value,
      transportMatrix: state.transportMatrix,
      darkMode: state.darkMode
    };

    const stored = state.presets.slice();
    const existingIndex = stored.findIndex((entry) => entry.name === name);
    if (existingIndex >= 0) {
      stored[existingIndex] = preset;
    } else {
      stored.push(preset);
    }
    state.presets = stored;
    localStorage.setItem(STORAGE_KEYS.presets, JSON.stringify(state.presets));
    alert(`Preset saved as ${name}`);
  }

  function loadPresets() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.presets) || '[]');
      state.presets = Array.isArray(stored) ? stored : [];
    } catch (error) {
      state.presets = [];
    }
  }

  function loadPreset() {
    if (!state.presets.length) {
      alert('No presets found.');
      return;
    }
    const names = state.presets.map((preset) => preset.name);
    const name = prompt(`Preset name to load (${names.join(', ')})`, state.presets[0].name || 'My Preset');
    if (!name) {
      return;
    }
    const preset = state.presets.find((entry) => entry.name === name);
    if (!preset) {
      alert('Preset not found.');
      return;
    }
    applyPreset(preset);
    alert(`Loaded preset ${name}`);
  }

  function renamePreset() {
    if (!state.presets.length) {
      alert('No presets found.');
      return;
    }
    const selectedName = prompt(`Preset name to rename (${state.presets.map((entry) => entry.name).join(', ')})`);
    if (!selectedName) {
      return;
    }
    const preset = state.presets.find((entry) => entry.name === selectedName);
    if (!preset) {
      alert('Preset not found.');
      return;
    }
    const newName = prompt('New preset name', preset.name);
    if (!newName) {
      return;
    }
    preset.name = newName;
    localStorage.setItem(STORAGE_KEYS.presets, JSON.stringify(state.presets));
    alert(`Renamed preset to ${newName}`);
  }

  function deletePreset() {
    if (!state.presets.length) {
      alert('No presets found.');
      return;
    }
    const selectedName = prompt(`Preset name to delete (${state.presets.map((entry) => entry.name).join(', ')})`);
    if (!selectedName) {
      return;
    }
    state.presets = state.presets.filter((entry) => entry.name !== selectedName);
    localStorage.setItem(STORAGE_KEYS.presets, JSON.stringify(state.presets));
    alert(`Deleted preset ${selectedName}`);
  }

  function exportPresets() {
    const payload = JSON.stringify(state.presets, null, 2);
    const blob = new Blob([payload], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'albion-presets.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function importPresets(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed)) {
          throw new Error('Invalid preset file.');
        }
        state.presets = parsed;
        localStorage.setItem(STORAGE_KEYS.presets, JSON.stringify(state.presets));
        alert('Presets imported successfully.');
      } catch (error) {
        alert('Import failed.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
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
    state.materials = Array.isArray(preset.materials) && preset.materials.length ? preset.materials.map((row) => ({ ...row, prices: row.prices || createCityPriceMap() })) : [createEmptyMaterial()];
    state.multiItems = Array.isArray(preset.multiItems) && preset.multiItems.length ? preset.multiItems : [{ name: 'Battleaxe', tier: 'T4', enchant: '.0', qty: 1 }];
    state.transportMatrix = preset.transportMatrix || state.transportMatrix;
    renderMaterialRows();
    renderMultiItems();
    renderTransportMatrix();
    updateFeeValue();
    populateRegionData(preset.regions || regionDefaults);
    saveAppState();
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
      row.querySelector('.focusReturn').value = region.focusReturn ?? 0;
      row.querySelector('.nutritionCost').value = region.nutritionCost ?? 0;
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
    state.materials = [createEmptyMaterial()];
    state.multiItems = [{ name: 'Battleaxe', tier: 'T4', enchant: '.0', qty: 1 }];
    state.transportMatrix = CITY_NAMES.reduce((acc, from) => {
      acc[from] = CITY_NAMES.reduce((cityAcc, to) => {
        cityAcc[to] = 0;
        return cityAcc;
      }, {});
      return acc;
    }, {});
    populateRegionData(regionDefaults);
    renderMaterialRows();
    renderMultiItems();
    renderTransportMatrix();
    updateFeeValue();
    saveAppState();
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

  function renderTransportMatrix() {
    const rowsMarkup = CITY_NAMES.map((from) => {
      const cells = CITY_NAMES.map((to) => `
        <td>
          <input class="transport-cell" type="number" min="0" step="0.01" data-from="${from}" data-to="${to}" value="${state.transportMatrix[from][to] ?? 0}">
        </td>
      `).join('');
      return `<tr><th>${from}</th>${cells}</tr>`;
    }).join('');

    els.transportMatrix.innerHTML = `
      <table class="transport-table">
        <thead><tr><th></th>${CITY_NAMES.map((city) => `<th>${city}</th>`).join('')}</tr></thead>
        <tbody>${rowsMarkup}</tbody>
      </table>
    `;
  }

  function renderOptimizerSummary(materials, mainCraftQty, totalMaterialCost) {
    const activeMaterials = materials.filter((row) => row.name.trim() || row.qty > 0 || row.price > 0 || Object.values(row.prices || {}).some((value) => Number(value || 0) > 0));
    if (!activeMaterials.length) {
      els.optimizerCheapestCity.textContent = '-';
      els.optimizerCheapestPrice.textContent = formatCurrency(0);
      els.optimizerTotalCost.textContent = formatCurrency(0);
      els.optimizerSingleCity.textContent = '-';
      els.optimizerMixedCost.textContent = formatCurrency(0);
      els.optimizerTable.innerHTML = '<tr><td colspan="6">Add materials to see source optimization.</td></tr>';
      return;
    }

    const perMaterialRows = activeMaterials.map((material) => ({
      name: material.name || 'Material',
      qty: Number(material.qty || 1),
      cheapestCity: getCheapestCity(material),
      cheapestPrice: getCheapestPrice(material),
      totalCost: Number(material.qty || 1) * getCheapestPrice(material)
    }));

    const cheapestCity = perMaterialRows.reduce((best, row) => row.totalCost < best.totalCost ? row : best, perMaterialRows[0]);
    const singleCity = getBestSingleCity(activeMaterials);
    const mixedCost = perMaterialRows.reduce((sum, row) => sum + row.totalCost, 0);

    els.optimizerCheapestCity.textContent = cheapestCity.cheapestCity;
    els.optimizerCheapestPrice.textContent = formatCurrency(cheapestCity.cheapestPrice);
    if (els.optimizerTotalCost) {
      els.optimizerTotalCost.textContent = formatCurrency(mixedCost);
    }
    els.optimizerSingleCity.textContent = singleCity.city;
    els.optimizerMixedCost.textContent = formatCurrency(mixedCost);

    els.optimizerTable.innerHTML = perMaterialRows.map((row) => `
      <tr>
        <td>${escapeHtml(row.name)}</td>
        <td>${row.qty}</td>
        <td>${escapeHtml(row.cheapestCity)}</td>
        <td>${formatCurrency(row.cheapestPrice)}</td>
        <td>${formatCurrency(row.totalCost)}</td>
        <td>${escapeHtml(getBestSingleCity(activeMaterials).city)}</td>
      </tr>
    `).join('');
  }

  function getCheapestCity(material) {
    return CITY_NAMES.reduce((best, city) => {
      const currentCost = getMaterialUnitCost(material, city);
      return currentCost < best.cost ? { city, cost: currentCost } : best;
    }, { city: CITY_NAMES[0], cost: Infinity }).city;
  }

  function getCheapestPrice(material) {
    return CITY_NAMES.reduce((best, city) => {
      const currentCost = getMaterialUnitCost(material, city);
      return currentCost < best ? currentCost : best;
    }, Infinity);
  }

  function getBestSingleCity(materials) {
    const totals = CITY_NAMES.map((city) => ({
      city,
      cost: materials.reduce((sum, material) => sum + (Number(material.qty || 1) * getMaterialUnitCost(material, city)), 0)
    }));
    totals.sort((a, b) => a.cost - b.cost);
    return totals[0];
  }

  function renderBuyingStrategies(materials, mainCraftQty, bestRoute) {
    const activeMaterials = materials.filter((row) => row.name.trim() || row.qty > 0 || row.price > 0 || Object.values(row.prices || {}).some((value) => Number(value || 0) > 0));
    const strategyA = buildStrategyList(activeMaterials, 'mixed');
    const strategyB = buildStrategyList(activeMaterials, 'single', getBestSingleCity(activeMaterials).city);
    const strategyC = buildStrategyList(activeMaterials, 'single', bestRoute ? bestRoute.buyCity : getBestSingleCity(activeMaterials).city);

    els.strategySummary.innerHTML = `
      <div class="strategy-pill">Option A: Cheapest Overall</div>
      <div class="strategy-pill">Option B: Best Single City</div>
      <div class="strategy-pill">Option C: Balanced Strategy</div>
    `;
    els.strategyA.innerHTML = renderStrategyCards(strategyA, 'Option A');
    els.strategyB.innerHTML = renderStrategyCards(strategyB, 'Option B');
    els.strategyC.innerHTML = renderStrategyCards(strategyC, 'Option C');
  }

  function buildStrategyList(materials, mode, city) {
    const grouped = {};
    materials.forEach((material) => {
      const selectedCity = mode === 'mixed' ? getCheapestCity(material) : city;
      if (!grouped[selectedCity]) {
        grouped[selectedCity] = [];
      }
      grouped[selectedCity].push({
        name: material.name || 'Material',
        qty: Number(material.qty || 1),
        unitCost: getMaterialUnitCost(material, selectedCity),
        totalCost: Number(material.qty || 1) * getMaterialUnitCost(material, selectedCity)
      });
    });
    return grouped;
  }

  function renderStrategyCards(grouped, label) {
    return Object.entries(grouped).map(([city, items]) => `
      <div class="strategy-group">
        <h4>${escapeHtml(city)}</h4>
        <ul>
          ${items.map((item) => `<li>${escapeHtml(item.name)} × ${item.qty} — ${formatCurrency(item.totalCost)}</li>`).join('')}
        </ul>
      </div>
    `).join('');
  }

  function buildRouteOptimizations(materials, multiItems, mainCraftQty, totalMaterialCost, globalCraftFee, focusOutlay, nutritionCost, regions) {
    const routes = [];
    const cities = CITY_NAMES;
    cities.forEach((buyCity) => {
      cities.forEach((craftCity) => {
        cities.forEach((sellCity) => {
          const buyRegion = regions.find((region) => region.name === buyCity) || regions[0];
          const craftRegion = regions.find((region) => region.name === craftCity) || regions[0];
          const sellRegion = regions.find((region) => region.name === sellCity) || regions[0];
          const materialCost = materials.reduce((sum, material) => sum + (Number(material.qty || 1) * getMaterialUnitCost(material, buyCity)), 0);
          const craftCost = (materialCost + totalMaterialCost) + Number(craftRegion.fee || 0) + globalCraftFee + nutritionCost + focusOutlay;
          const adjustedSellPrice = Math.max(0, Number(sellRegion.sell || 0) * (1 - Number(sellRegion.rrr || 0) / 100) * (1 - Number(sellRegion.tax || 0) / 100));
          const transportCost = Number(state.transportMatrix[buyCity][craftCity] || 0) + Number(state.transportMatrix[craftCity][sellCity] || 0);
          const revenue = adjustedSellPrice * (mainCraftQty + multiItems.reduce((sum, item) => sum + Number(item.qty || 1), 0));
          const profit = revenue - craftCost - transportCost;
          const profitPerItem = (mainCraftQty + multiItems.reduce((sum, item) => sum + Number(item.qty || 1), 0)) > 0 ? profit / (mainCraftQty + multiItems.reduce((sum, item) => sum + Number(item.qty || 1), 0)) : 0;
          const roi = craftCost + transportCost > 0 ? (profit / (craftCost + transportCost)) * 100 : 0;
          const score = getRouteScore(profit, roi);
          const explanation = buildRouteExplanation({ buyCity, craftCity, sellCity, profit, roi, materialCost, transportCost, craftRegion, sellRegion });
          routes.push({ buyCity, craftCity, sellCity, profit, roi, profitPerItem, transportCost, materialCost, craftCost, score, explanation, region: `${buyCity} → ${craftCity} → ${sellCity}` });
        });
      });
    });
    routes.sort((a, b) => b.profit - a.profit);
    return { routes, bestRoute: routes[0] };
  }

  function getRouteScore(profit, roi) {
    if (profit > 0 && roi >= 20) {
      return '★★★★★';
    }
    if (profit > 0 && roi >= 10) {
      return '★★★★☆';
    }
    if (profit > 0) {
      return '★★★☆☆';
    }
    if (profit >= -1000) {
      return '★★☆☆☆';
    }
    return '★☆☆☆☆';
  }

  function buildRouteExplanation(route) {
    const reasons = [];
    if (route.materialCost < 100000) {
      reasons.push('Low material cost');
    } else {
      reasons.push('High material cost');
    }
    if (route.roi > 10) {
      reasons.push('Strong ROI');
    }
    if (route.transportCost < 1000) {
      reasons.push('Low transport cost');
    }
    if (route.profit > 0) {
      reasons.push('Positive profit');
    }
    return `Recommended because ${reasons.join(', ')}`;
  }

  function renderRouteTable(routes) {
    els.routeTableBody.innerHTML = routes.slice(0, 8).map((route, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(route.buyCity)}</td>
        <td>${escapeHtml(route.craftCity)}</td>
        <td>${escapeHtml(route.sellCity)}</td>
        <td>${formatCurrency(route.materialCost)}</td>
        <td>${formatCurrency(route.craftCost)}</td>
        <td>${formatCurrency(route.transportCost)}</td>
        <td>${formatCurrency(route.profit)}</td>
        <td>${formatNumber(route.roi)}%</td>
        <td>${route.score}</td>
      </tr>
    `).join('');
  }

  function renderRouteExplanation(bestRoute) {
    if (!bestRoute) {
      els.routeExplanation.textContent = 'Add values to see the recommended route.';
      return;
    }
    els.routeExplanation.textContent = `${bestRoute.explanation} — ${bestRoute.buyCity} → ${bestRoute.craftCity} → ${bestRoute.sellCity}`;
  }

  function renderWarnings(rows, bestRoute, totalMaterialCost, totalCraftQuantity) {
    const profit = bestRoute ? bestRoute.profit : rows[0] ? rows[0].profit : 0;
    const roi = bestRoute ? bestRoute.roi : rows[0] ? rows[0].roi : 0;
    const breakEven = Math.max(1, Math.ceil(Math.abs(totalMaterialCost + (bestRoute ? bestRoute.transportCost : 0)) / Math.max(1, totalCraftQuantity || 1)));

    let warnings = [];
    if (profit < 0) {
      warnings.push('<span class="warning danger">Profit is negative. Review your route or pricing.</span>');
    }
    if (roi < 10) {
      warnings.push('<span class="warning orange">ROI is below 10%. Consider a cheaper buy or craft city.</span>');
    }
    if (breakEven > 100) {
      warnings.push('<span class="warning yellow">Break-even is high. A slower path may hurt cash flow.</span>');
    }
    els.warningBox.innerHTML = warnings.length ? warnings.join('<br>') : '<span class="success">Route looks healthy. No warnings at the moment.</span>';
  }

  function renderBestItems(materials, multiItems, mainCraftQty, bestRoute) {
    const items = [{ name: els.itemName.value.trim() || 'Main Item', qty: Number(els.craftQty.value || 1), cost: computeMaterialCost(getMaterialRowsForSelection(els.itemName.value, materials), Number(els.craftQty.value || 1)) }];
    items.push(...multiItems.map((row) => ({ name: row.name || 'Multi Item', qty: Number(row.qty || 1), cost: computeMaterialCost(getMaterialRowsForSelection(row.name, materials), Number(row.qty || 1)) })));
    items.forEach((item) => {
      item.profit = (bestRoute ? bestRoute.profit : 0) / Math.max(1, items.length);
      item.roi = (bestRoute ? bestRoute.roi : 0) / Math.max(1, items.length);
      item.breakEven = Math.max(1, Math.ceil(Math.abs(item.cost) / Math.max(1, item.profit || 1)));
    });
    els.bestItemBody.innerHTML = items.map((item) => `
      <tr>
        <td>${escapeHtml(item.name)}</td>
        <td>${formatCurrency(item.cost)}</td>
        <td>${formatCurrency(item.profit)}</td>
        <td>${formatNumber(item.roi)}%</td>
        <td>${item.breakEven}</td>
      </tr>
    `).join('');
  }

  function recordMaterialHistory(material) {
    const name = (material.name || '').trim();
    if (!name) {
      return;
    }
    const value = Number(getMaterialUnitCost(material, CITY_NAMES[0]) || 0);
    if (!state.marketHistory[name]) {
      state.marketHistory[name] = [];
    }
    const lastEntry = state.marketHistory[name][state.marketHistory[name].length - 1];
    if (lastEntry && lastEntry.value === value) {
      return;
    }
    state.marketHistory[name].push({ value, updatedAt: new Date().toLocaleString() });
    state.marketHistory[name] = state.marketHistory[name].slice(-20);
    saveMarketHistory();
  }

  function renderInventorySummary(rows, totalCraftQuantity, totalMaterialCost, bestRoute) {
    const ownedQty = Number(els.inventoryOwnedQty.value || 0);
    const alreadyOwned = els.inventoryAlreadyOwned.checked;
    const remainingQty = alreadyOwned ? 0 : Math.max(0, totalCraftQuantity - ownedQty);
    const purchaseQty = alreadyOwned ? 0 : remainingQty;
    const baseProfit = bestRoute ? bestRoute.profit : rows[0] ? rows[0].profit : 0;
    const baseROI = bestRoute ? bestRoute.roi : rows[0] ? rows[0].roi : 0;
    const adjustedProfit = totalCraftQuantity > 0 ? (baseProfit * (remainingQty / totalCraftQuantity)) : 0;
    const adjustedROI = totalCraftQuantity > 0 ? (baseROI * (remainingQty / totalCraftQuantity)) : 0;

    els.inventoryRemainingQty.textContent = remainingQty;
    els.inventoryPurchaseQty.textContent = purchaseQty;
    els.inventoryProfit.textContent = formatCurrency(adjustedProfit);
    els.inventoryROI.textContent = formatNumber(adjustedROI) + '%';

    const materialsForList = state.materials.filter((row) => row.name.trim() || row.qty > 0 || row.price > 0 || Object.values(row.prices || {}).some((value) => Number(value || 0) > 0));
    const shoppingItems = materialsForList.map((row) => `${row.name || 'Material'} × ${row.qty}`);
    els.inventoryShoppingList.textContent = shoppingItems.length ? shoppingItems.join(', ') : 'No materials queued.';
  }

  function renderShoppingChecklist(materials) {
    const rows = materials.filter((row) => row.name.trim() || row.qty > 0 || row.price > 0 || Object.values(row.prices || {}).some((value) => Number(value || 0) > 0));
    const nextItems = rows.map((row) => ({
      id: `${row.name || 'material'}-${row.qty}`,
      label: `${row.name || 'Material'} × ${row.qty}`,
      checked: state.shoppingChecklist.find((entry) => entry.id === `${row.name || 'material'}-${row.qty}`)?.checked || false
    }));

    state.shoppingChecklist = nextItems;
    saveShoppingChecklist();

    els.shoppingChecklist.innerHTML = nextItems.length ? nextItems.map((item) => `
      <label class="checklist-item-row">
        <input class="checklist-item" type="checkbox" data-id="${item.id}" ${item.checked ? 'checked' : ''}>
        <span>${escapeHtml(item.label)}</span>
      </label>
    `).join('') : '<p>No shopping items yet.</p>';
  }

  function saveShoppingChecklist() {
    try {
      localStorage.setItem('albionCalculatorShoppingChecklist', JSON.stringify(state.shoppingChecklist));
    } catch (error) {
      console.warn('Unable to save shopping checklist', error);
    }
  }

  function loadShoppingChecklist() {
    try {
      const stored = JSON.parse(localStorage.getItem('albionCalculatorShoppingChecklist') || '[]');
      state.shoppingChecklist = Array.isArray(stored) ? stored : [];
    } catch (error) {
      state.shoppingChecklist = [];
    }
  }

  function renderMarketHistory() {
    const entries = Object.entries(state.marketHistory);
    if (!entries.length) {
      els.marketHistoryBody.innerHTML = '<tr><td colspan="5">No price history yet.</td></tr>';
      return;
    }

    els.marketHistoryBody.innerHTML = entries.map(([name, history]) => {
      const values = history.map((entry) => entry.value);
      const lowest = Math.min(...values);
      const highest = Math.max(...values);
      const average = values.reduce((sum, value) => sum + value, 0) / values.length;
      const last = history[history.length - 1];
      return `
        <tr>
          <td>${escapeHtml(name)}</td>
          <td>${formatCurrency(lowest)}</td>
          <td>${formatCurrency(highest)}</td>
          <td>${formatCurrency(average)}</td>
          <td>${escapeHtml(last ? last.updatedAt : '—')}</td>
        </tr>
      `;
    }).join('');
  }

  function saveMarketHistory() {
    try {
      localStorage.setItem(STORAGE_KEYS.marketHistory, JSON.stringify(state.marketHistory));
    } catch (error) {
      console.warn('Unable to save market history', error);
    }
  }

  function saveAppState() {
    try {
      const payload = {
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
        nutritionCost: els.nutritionCost.value,
        transportMatrix: state.transportMatrix,
        darkMode: state.darkMode,
        presets: state.presets,
        marketHistory: state.marketHistory,
        shoppingChecklist: state.shoppingChecklist,
        inventoryOwnedQty: els.inventoryOwnedQty.value,
        inventoryAlreadyOwned: els.inventoryAlreadyOwned.checked
      };
      localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(payload));
    } catch (error) {
      console.warn('Unable to save app state', error);
    }
  }

  function restoreAppState() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.state) || 'null');
      if (!stored) {
        return;
      }
      els.itemName.value = stored.itemName || '';
      els.itemTier.value = stored.itemTier || 'T4';
      els.itemEnchant.value = stored.itemEnchant || '.0';
      els.craftQty.value = stored.craftQty || 1;
      els.focusCost.value = stored.focusCost || 0;
      els.focusReturn.value = stored.focusReturn || 0;
      els.itemFocusCost.value = stored.itemFocusCost || 0;
      els.itemFocusReturn.value = stored.itemFocusReturn || 0;
      els.focusUsed.value = stored.focusUsed || 0;
      els.craftFeeGlobal.value = stored.globalFee || 0;
      els.nutritionCost.value = stored.nutritionCost || 0;
      state.materials = Array.isArray(stored.materials) && stored.materials.length ? stored.materials.map((row) => ({ ...row, prices: row.prices || createCityPriceMap() })) : [createEmptyMaterial()];
      state.multiItems = Array.isArray(stored.multiItems) && stored.multiItems.length ? stored.multiItems : [{ name: 'Battleaxe', tier: 'T4', enchant: '.0', qty: 1 }];
      state.transportMatrix = stored.transportMatrix || state.transportMatrix;
      state.darkMode = stored.darkMode !== undefined ? stored.darkMode : true;
      state.presets = Array.isArray(stored.presets) ? stored.presets : [];
      state.marketHistory = stored.marketHistory || {};
      state.shoppingChecklist = Array.isArray(stored.shoppingChecklist) ? stored.shoppingChecklist : [];
      els.inventoryOwnedQty.value = stored.inventoryOwnedQty || 0;
      els.inventoryAlreadyOwned.checked = Boolean(stored.inventoryAlreadyOwned);
      populateRegionData(stored.regions || regionDefaults);
      renderTransportMatrix();
      updateFeeValue();
      applyTheme();
      renderMarketHistory();
    } catch (error) {
      console.warn('Unable to restore app state', error);
    }
  }

  function toggleTheme() {
    state.darkMode = !state.darkMode;
    applyTheme();
    saveAppState();
  }

  function applyTheme() {
    els.body.classList.toggle('light-mode', !state.darkMode);
    els.darkModeToggle.textContent = state.darkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
  }

  function showSplashScreen() {
    els.splashScreen.classList.remove('is-hidden');
  }

  function hideSplashScreen() {
    els.splashScreen.classList.add('is-hidden');
  }

  function showLoadingScreen() {
    els.loadingScreen.classList.remove('is-hidden');
  }

  function hideLoadingScreen() {
    els.loadingScreen.classList.add('is-hidden');
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch((error) => {
        console.warn('Service worker registration failed', error);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init();
    });
  } else {
    init();
  }
})();
