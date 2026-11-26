// ==========================================
// 1. STATE & CONSTANTS
// ==========================================
const STORAGE_KEY = 'minimal_expense_tracker_v1';

// Default starter categories (you can customize these anytime)
const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Vending machine', spent: 0 },
  { id: 'cat-2', name: 'Bus fares', spent: 0 },
  { id: 'cat-3', name: 'Weekly grocery', spent: 0 },
  { id: 'cat-4', name: 'Shopping spree', spent: 0 }
];

let state = {
  isInitialized: false,
  remainingBalance: 0,
  categories: []
};

// Tracks which category tile the user tapped before opening the expense modal
let activeCategoryId = null;

// ==========================================
// 2. DOM ELEMENT REFERENCES
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
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'category-tile';
    tile.dataset.id = category.id;

    // Using textContent prevents any XSS issues with custom category names
    const nameSpan = document.createElement('span');
    nameSpan.className = 'category-name';
    nameSpan.textContent = category.name;

    const amountSpan = document.createElement('span');
    amountSpan.className = 'category-amount';
    amountSpan.textContent = formatCurrency(category.spent);

    tile.appendChild(nameSpan);
    tile.appendChild(amountSpan);

    // Tapping tile opens the Add Expense Modal for that category
    tile.addEventListener('click', () => openExpenseModal(category));

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
  // Clone default categories so we don't mutate the constant
  state.categories = structuredClone(DEFAULT_CATEGORIES);

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
resetAppBtn.addEventListener('click', () => {
  const confirmed = window.confirm(
    'Reset your balance and clear all category totals to start fresh?'
  );
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);
  state = {
    isInitialized: false,
    remainingBalance: 0,
    categories: []
  };
  initialBalanceInput.value = '';
  render();
});

// Optional UX polish: Close modals when clicking the dimmed backdrop outside the box
[expenseModal, categoryModal].forEach((modal) => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.close();
    }
  });
});

// ==========================================
// 7. INITIALIZE APP ON LOAD
// ==========================================
loadState();
render();