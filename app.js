// ==========================================
// 1. STATE & CONSTANTS
// ==========================================
const STORAGE_KEY = 'minimal_expense_tracker_v1';

// Default starter categories (you can customize these anytime)
const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Vending machine', spent: 0, color: 'default' },
  { id: 'cat-2', name: 'Bus fares', spent: 0, color: 'default' },
  { id: 'cat-3', name: 'Weekly grocery', spent: 0, color: 'default' },
  { id: 'cat-4', name: 'Shopping spree', spent: 0, color: 'default' }
];

let state = {
  isInitialized: false,
  remainingBalance: 0,
  categories: []
};

// Tracks which category tile the user tapped before opening the expense modal
let activeCategoryId = null;

let editingTileId = null;
let selectedTileColor = 'default';

// ==========================================
// 2. DOM ELEMENT REFERENCES:
// ==========================================
// Screens
const setupScreen = document.getElementById('setup-screen');
const dashboardScreen = document.getElementById('dashboard-screen');

// Setup Screen Elements
const setupForm = document.getElementById('setup-form');
const initialBalanceInput = document.getElementById('initial-balance-input');
const setupError = document.getElementById('setup-error');

// Dashboard Elements
const remainingBalanceDisplay = document.getElementById('remaining-balance-display');
const categoryGrid = document.getElementById('category-grid');
const addCategoryBtn = document.getElementById('add-category-btn');

// Expense Modal Elements
const expenseModal = document.getElementById('expense-modal');
const expenseForm = document.getElementById('expense-form');
const expenseModalTitle = document.getElementById('expense-modal-title');
const expenseAmountInput = document.getElementById('expense-amount-input');
const expenseError = document.getElementById('expense-error');
const cancelExpenseBtn = document.getElementById('cancel-expense-btn');

// Add Category Modal Elements
const categoryModal = document.getElementById('category-modal');
const categoryForm = document.getElementById('category-form');
const categoryNameInput = document.getElementById('category-name-input');
const categoryError = document.getElementById('category-error');
const cancelCategoryBtn = document.getElementById('cancel-category-btn');

// Reset Budget Option
const resetAppBtn = document.getElementById('reset-app-btn');

//Edit Remaining Budget
const editBalanceBtn = document.getElementById('edit-balance-btn');
const editBalanceModal = document.getElementById('edit-balance-modal');
const editBalanceForm = document.getElementById('edit-balance-form');
const editBalanceInput = document.getElementById('edit-balance-input');
const editBalanceError = document.getElementById('edit-balance-error');
const cancelEditBalanceBtn = document.getElementById('cancel-edit-balance-btn');

//Export button
const exportBtn=document.getElementById("export-btn");

// Tile Settings Modal Elements
const tileSettingsModal = document.getElementById('tile-settings-modal');
const tileSettingsForm = document.getElementById('tile-settings-form');
const renameCategoryInput = document.getElementById('rename-category-input');
const renameCategoryError = document.getElementById('rename-category-error');
const colorSwatches = document.querySelectorAll('.color-swatch');
const cancelTileSettingsBtn = document.getElementById('cancel-tile-settings-btn');

// ==========================================
// 3. PERSISTENCE & FORMATTING HELPERS
// ==========================================
function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      state = JSON.parse(raw);
    } catch (err) {
      console.error('Failed to parse saved state:', err);
    }
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function roundMoney(amount) {
  return Math.round(amount * 100) / 100;
}

function formatCurrency(amount) {
  // Uses standard currency formatting (e.g., -$12.50 or $1,200.00)
  const isNegative = amount < 0;
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return isNegative ? `-$${formatted}` : `$${formatted}`;
}

// ==========================================
// 4. UI RENDERING
// ==========================================
function render() {
  if (!state.isInitialized) {
    setupScreen.classList.remove('hidden');
    dashboardScreen.classList.add('hidden');
    return;
  }

  // Show Dashboard
  setupScreen.classList.add('hidden');
  dashboardScreen.classList.remove('hidden');

  // Render Remaining Balance (and apply red styling if negative)
  remainingBalanceDisplay.textContent = formatCurrency(state.remainingBalance);
  if (state.remainingBalance < 0) {
    remainingBalanceDisplay.classList.add('negative');
  } else {
    remainingBalanceDisplay.classList.remove('negative');
  }

  // Render Category Tiles
  categoryGrid.innerHTML = '';
  state.categories.forEach((category) => {
    const tile = document.createElement('div');
    tile.setAttribute('role', 'button');
    tile.setAttribute('tabindex', '0');
    tile.className = 'category-tile';
    tile.dataset.id = category.id;
    tile.dataset.color = category.color || 'default';

    // Three-dot menu button
    const menuBtn = document.createElement('button');
    menuBtn.type = 'button';
    menuBtn.className = 'tile-menu-btn';
    menuBtn.title = 'Customize category';
    menuBtn.setAttribute('aria-label', `Customize ${category.name}`);
    menuBtn.textContent = '⋮';
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevents opening the Add Expense modal
      openTileSettingsModal(category);
    });

    const nameSpan = document.createElement('span');
    nameSpan.className = 'category-name';
    nameSpan.textContent = category.name;

    const amountSpan = document.createElement('span');
    amountSpan.className = 'category-amount';
    amountSpan.textContent = formatCurrency(category.spent);

    tile.appendChild(menuBtn);
    tile.appendChild(nameSpan);
    tile.appendChild(amountSpan);

    // Tapping tile opens the Add Expense Modal for that category
    tile.addEventListener('click', () => openExpenseModal(category));
    tile.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openExpenseModal(category);
      }
    });

    categoryGrid.appendChild(tile);
  });
}

// ==========================================
// 5. MODAL CONTROLLERS
// ==========================================
function openExpenseModal(category) {
  activeCategoryId = category.id;
  expenseModalTitle.textContent = `Add ${category.name} Expense`;
  expenseAmountInput.value = '';
  expenseAmountInput.classList.remove('input-error');
  expenseError.classList.add('hidden');

  expenseModal.showModal();
  expenseAmountInput.focus();
}

function closeExpenseModal() {
  activeCategoryId = null;
  expenseModal.close();
}

function openCategoryModal() {
  categoryNameInput.value = '';
  categoryNameInput.classList.remove('input-error');
  categoryError.classList.add('hidden');

  categoryModal.showModal();
  categoryNameInput.focus();
}

function closeCategoryModal() {
  categoryModal.close();
}


function openEditBalanceModal() {
  editBalanceInput.value = state.remainingBalance;
  editBalanceInput.classList.remove('input-error');
  editBalanceError.classList.add('hidden');

  editBalanceModal.showModal();
  editBalanceInput.focus();
  editBalanceInput.select(); // Highlights the number for quick typing
}

function closeEditBalanceModal() {
  editBalanceModal.close();
}

function updateSwatchSelection(color) {
  selectedTileColor = color;
  colorSwatches.forEach((swatch) => {
    swatch.classList.toggle('selected', swatch.dataset.color === color);
  });
}

function openTileSettingsModal(category) {
  editingTileId = category.id;
  renameCategoryInput.value = category.name;
  renameCategoryInput.classList.remove('input-error');
  renameCategoryError.classList.add('hidden');

  updateSwatchSelection(category.color || 'default');

  tileSettingsModal.showModal();
  renameCategoryInput.focus();
  renameCategoryInput.select();
}

function closeTileSettingsModal() {
  editingTileId = null;
  tileSettingsModal.close();
}

// ==========================================
// 6. EVENT LISTENERS (BUSINESS LOGIC)
// ==========================================

// 6.1 Initial Balance Setup Submission
setupForm.addEventListener('submit', (e) => {
  e.preventDefault(); // Prevent page reload
  const val = parseFloat(initialBalanceInput.value);

  // Boundary Case: Empty, NaN, zero, or negative initial balance
  if (isNaN(val) || val <= 0) {
    initialBalanceInput.classList.add('input-error');
    setupError.classList.remove('hidden');
    return;
  }

  initialBalanceInput.classList.remove('input-error');
  setupError.classList.add('hidden');

  state.isInitialized = true;
  state.remainingBalance = roundMoney(val);

  // Only load default categories on a true first launch; otherwise keep carried-over tiles
  if (!state.categories || state.categories.length === 0) {
    state.categories = structuredClone(DEFAULT_CATEGORIES);
  }

  saveState();
  render();
});

// 6.2 Add Expense Submission
expenseForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const amount = parseFloat(expenseAmountInput.value);

  // Boundary Case: Empty or non-numeric (also guard against <= 0 expenses)
  if (isNaN(amount) || amount <= 0) {
    expenseAmountInput.classList.add('input-error');
    expenseError.classList.remove('hidden');
    return; // Keep modal open
  }

  const category = state.categories.find((c) => c.id === activeCategoryId);
  if (category) {
    const cleanAmount = roundMoney(amount);
    category.spent = roundMoney(category.spent + cleanAmount);
    // Boundary Case: Allows negative remaining balance without blocking
    state.remainingBalance = roundMoney(state.remainingBalance - cleanAmount);

    saveState();
    render();
  }

  closeExpenseModal();
});

cancelExpenseBtn.addEventListener('click', closeExpenseModal);

// 6.3 Add Custom Category Submission
addCategoryBtn.addEventListener('click', openCategoryModal);

categoryForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = categoryNameInput.value.trim();

  if (!name) {
    categoryNameInput.classList.add('input-error');
    categoryError.classList.remove('hidden');
    return;
  }

  const newCategory = {
    id: `cat-${Date.now()}`,
    name: name,
    spent: 0
  };

  state.categories.push(newCategory);
  saveState();
  render();
  closeCategoryModal();
});

cancelCategoryBtn.addEventListener('click', closeCategoryModal);

// 6.4 Reset App for a New Budget Cycle
// 6.4 Reset App for a New Budget Cycle (Preserves Custom & Personalized Tiles)
resetAppBtn.addEventListener('click', () => {
  const confirmed = window.confirm(
    'Confirm?'
  );
  if (!confirmed) return;

  const carriedOverCategories = state.categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    color: cat.color || 'default',
    spent: 0
  }));

  state = {
    isInitialized: false,
    remainingBalance: 0,
    categories: carriedOverCategories
  };

  saveState();
  initialBalanceInput.value = '';
  render();
});

// Optional UX polish: Close modals when clicking the dimmed backdrop outside the box
[expenseModal, categoryModal, editBalanceModal, tileSettingsModal].forEach((modal) => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.close();
    }
  });
});

// 6.5 Edit Remaining Balance Submission
editBalanceBtn.addEventListener('click', openEditBalanceModal);

editBalanceForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const newBalance = parseFloat(editBalanceInput.value);

  if (isNaN(newBalance)) {
    editBalanceInput.classList.add('input-error');
    editBalanceError.classList.remove('hidden');
    return;
  }

  state.remainingBalance = roundMoney(newBalance);
  saveState();
  render();
  closeEditBalanceModal();
});

cancelEditBalanceBtn.addEventListener('click', closeEditBalanceModal);

// 6.6 Export State Snapshot
exportBtn.addEventListener('click', () => {
  const totalSpent = roundMoney(
    state.categories.reduce((sum, cat) => sum + cat.spent, 0)
  );

  const snapshot = {
    exportedAt: new Date().toISOString(),
    remainingBalance: state.remainingBalance,
    totalSpent: totalSpent,
    categories: state.categories
  };

  const jsonString = JSON.stringify(snapshot, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = `expense-snapshot-${dateStamp}.json`;

  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url); // Clean up memory
});

// 6.7 Personalize Category Tile (Rename & Border Color)
colorSwatches.forEach((swatch) => {
  swatch.addEventListener('click', () => {
    updateSwatchSelection(swatch.dataset.color);
  });
});

tileSettingsForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const newName = renameCategoryInput.value.trim();

  if (!newName) {
    renameCategoryInput.classList.add('input-error');
    renameCategoryError.classList.remove('hidden');
    return;
  }

  const category = state.categories.find((c) => c.id === editingTileId);
  if (category) {
    category.name = newName;
    category.color = selectedTileColor;
    saveState();
    render();
  }

  closeTileSettingsModal();
});

cancelTileSettingsBtn.addEventListener('click', closeTileSettingsModal);

// ==========================================
// 7. INITIALIZE APP ON LOAD
// ==========================================
loadState();
render();