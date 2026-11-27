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
  categories: [],
  history:[]
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

//Delete button reference
const deleteCategoryBtn = document.getElementById('delete-category-btn');

// ==========================================
// 3. PERSISTENCE & FORMATTING HELPERS
// ==========================================


function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      state = {
        isInitialized: Boolean(parsed.isInitialized),
        remainingBalance: parsed.remainingBalance || 0,
        categories: parsed.categories || [],
        history: Array.isArray(parsed.history) ? parsed.history : []
      };
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

function formatLogTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function logAction(actionText) {
  if (!Array.isArray(state.history)) {
    state.history = [];
  }
  const entry = `${formatLogTimestamp()} : ${actionText}`;
  state.history.push(entry);
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

  logAction(`Initial balance set to ${formatCurrency(state.remainingBalance)}`);

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
    logAction(`-${formatCurrency(cleanAmount)} ${category.name}`);

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
  logAction(`Added category "${name}"`);
  saveState();
  render();
  closeCategoryModal();
});

cancelCategoryBtn.addEventListener('click', closeCategoryModal);

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
    categories: carriedOverCategories,
    history:[]
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

  const oldBalance=state.remainingBalance;
  state.remainingBalance = roundMoney(newBalance);
  logAction(
  `Remaining balance altered from ${formatCurrency(oldBalance)} to ${formatCurrency(state.remainingBalance)}`
  );
  saveState();
  render();
  closeEditBalanceModal();
});

cancelEditBalanceBtn.addEventListener('click', closeEditBalanceModal);

// 6.6 Export State Snapshot & PDF Report
function generatePdfReport(dateStamp, totalSpent) {
  // Verify jsPDF loaded properly (e.g., if offline without cache)
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('PDF library could not be loaded. Please ensure your are connected to the internet.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const maxLineWidth = pageWidth - margin * 2;
  let y = 20;

  // Helper to automatically add a new page when approaching bottom margin
  function checkPageBreak(neededHeight = 8) {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = 20;
    }
  }

  // --- 1. TITLE & TIMESTAMP ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(17, 24, 39);
  doc.text('Expenses: Report', margin, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated: ${formatLogTimestamp()}`, margin, y);
  y += 8;

  // Horizontal divider
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // --- 2. ACCOUNT SUMMARY ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(17, 24, 39);
  doc.text('Account Summary', margin, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Remaining Balance: ${formatCurrency(state.remainingBalance)}`, margin, y);
  y += 6;
  doc.text(`Total Cumulative Spent: ${formatCurrency(totalSpent)}`, margin, y);
  y += 11;

  // --- 3. CATEGORY BREAKDOWN ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Category Breakdown', margin, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  state.categories.forEach((cat) => {
    checkPageBreak(7);
    doc.text(`• ${cat.name}: ${formatCurrency(cat.spent)}`, margin + 2, y);
    y += 6;
  });
  y += 6;

  // --- 4. CHRONOLOGICAL TRANSACTION & ACTIVITY HISTORY ---
  checkPageBreak(15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Chronological Activity History', margin, y);
  y += 7;

  doc.setFont('courier', 'normal'); // Monospace aligns timestamps cleanly
  doc.setFontSize(9.5);
  doc.setTextColor(31, 41, 55);

  const historyList = Array.isArray(state.history) ? state.history : [];
  if (historyList.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.text('No activity recorded in this cycle.', margin + 2, y);
  } else {
    historyList.forEach((entry) => {
      // Wrap long lines cleanly so nothing overflows the right margin
      const wrappedLines = doc.splitTextToSize(entry, maxLineWidth - 2);
      checkPageBreak(wrappedLines.length * 5 + 2);
      doc.text(wrappedLines, margin + 2, y);
      y += wrappedLines.length * 5 + 1.5;
    });
  }

  doc.save(`expense-report-${dateStamp}.pdf`);
}

exportBtn.addEventListener('click', () => {
  const totalSpent = roundMoney(
    state.categories.reduce((sum, cat) => sum + cat.spent, 0)
  );
  const dateStamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  generatePdfReport(dateStamp, totalSpent);
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
    const oldName = category.name;
    category.name = newName;
    category.color = selectedTileColor;
    if (oldName !== newName) {
      logAction(`Renamed category "${oldName}" to "${newName}"`);
    }
    saveState();
    render();
  }

  closeTileSettingsModal();
});

cancelTileSettingsBtn.addEventListener('click', closeTileSettingsModal);

deleteCategoryBtn.addEventListener('click', () => {
  const category = state.categories.find((c) => c.id === editingTileId);
  if (!category) return;

  const confirmed = window.confirm(
    `Delete category "${category.name}"? Its accumulated total will remain deducted from your balance.`
  );
  if (!confirmed) return;

  state.categories = state.categories.filter((c) => c.id !== editingTileId);
  logAction(`Removed category "${category.name}"`);
  saveState();
  render();
  closeTileSettingsModal();
});

// ==========================================
// 7. INITIALIZE APP ON LOAD
// ==========================================
loadState();
render();