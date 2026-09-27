/**
 * OmniHub - Single Page Application Script
 * PABWE Praktikum 3
 * 
 * Modul Terdiri Dari:
 * 1. Utilities & LocalStorage Handling
 * 2. Tab Navigation System
 * 3. Expense Tracker Logic (Catatan Pengeluaran)
 * 4. Bookmark Manager Logic (Kelola Link)
 * 5. Interactive Quiz Logic (Kuis Pemrograman Web)
 */

document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       1. UTILITIES & TOAST SYSTEM
       ========================================================================== */

    // Keys for LocalStorage
    const STORAGE_KEYS = {
        ACTIVE_TAB: 'omnihub_active_tab',
        EXPENSES: 'omnihub_expenses_data',
        BOOKMARKS: 'omnihub_bookmarks_data',
        QUIZ_HIGHSCORE: 'omnihub_quiz_highscore'
    };

    /**
     * ShowToast: Display temporary alert notification
     * @param {string} message 
     * @param {'success'|'error'|'info'} type 
     */
    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast-notification');
        const toastMsg = document.getElementById('toast-message');
        const toastIcon = document.getElementById('toast-icon');

        toastMsg.textContent = message;

        // Icon & style mapping
        if (type === 'success') {
            toastIcon.className = 'fa-solid fa-circle-check text-emerald-400 text-base';
        } else if (type === 'error') {
            toastIcon.className = 'fa-solid fa-circle-xmark text-rose-400 text-base';
        } else {
            toastIcon.className = 'fa-solid fa-circle-info text-sky-400 text-base';
        }

        // Show toast animation
        toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
        
        setTimeout(() => {
            toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
        }, 3000);
    }

    // Format currency to IDR
    function formatIDR(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(amount);
    }

    // Format Date string to ID format (e.g. 27 Sep 2026)
    function formatDateID(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    // Set Live Date Display in Navbar Header
    const dateDisplay = document.getElementById('current-date-display');
    if (dateDisplay) {
        const today = new Date();
        dateDisplay.textContent = today.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }


    /* ==========================================================================
       2. TAB NAVIGATION SYSTEM
       ========================================================================== */

    const tabs = {
        expense: { btn: document.getElementById('tab-expense'), panel: document.getElementById('panel-expense') },
        bookmark: { btn: document.getElementById('tab-bookmark'), panel: document.getElementById('panel-bookmark') },
        quiz: { btn: document.getElementById('tab-quiz'), panel: document.getElementById('panel-quiz') }
    };

    /**
     * Switch tab view and remember state in localStorage
     * @param {'expense'|'bookmark'|'quiz'} targetTab 
     */
    function switchTab(targetTab) {
        if (!tabs[targetTab]) targetTab = 'expense';

        // Update UI states for all tabs
        Object.keys(tabs).forEach(key => {
            const isTarget = key === targetTab;
            tabs[key].btn.classList.toggle('active', isTarget);
            tabs[key].panel.classList.toggle('hidden', !isTarget);
        });

        // Persist active tab in localStorage
        localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, targetTab);
    }

    // Bind click handlers for tab buttons
    Object.keys(tabs).forEach(key => {
        tabs[key].btn.addEventListener('click', () => switchTab(key));
    });

    // Restore active tab on application startup
    const savedTab = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB) || 'expense';
    switchTab(savedTab);


    /* ==========================================================================
       3. EXPENSE TRACKER LOGIC (FITUR 1)
       ========================================================================== */

    // Seed Data for Expense Tracker if localStorage is empty
    const initialExpenses = [
        { id: 'exp-1', title: 'Gaji Bulanan & Project Bonus', type: 'pemasukan', category: 'Gaji & Bonus', amount: 6500000, date: '2026-09-01' },
        { id: 'exp-2', title: 'Makan Siang Katering & Kopi', type: 'pengeluaran', category: 'Makanan & Minuman', amount: 65000, date: '2026-09-25' },
        { id: 'exp-3', title: 'Bensin & Serfis Motor', type: 'pengeluaran', category: 'Transportasi', amount: 150000, date: '2026-09-26' },
        { id: 'exp-4', title: 'Langganan Internet & Listrik', type: 'pengeluaran', category: 'Tagihan & Utilitas', amount: 450000, date: '2026-09-27' }
    ];

    // Load initial or stored expense data
    let expenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES));
    if (!expenses || !Array.isArray(expenses)) {
        expenses = initialExpenses;
        saveExpenses();
    }

    function saveExpenses() {
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    }

    // DOM Elements for Expense Tracker
    const expenseTableBody = document.getElementById('expense-list-tbody');
    const expenseEmptyState = document.getElementById('expense-empty-state');
    const expenseSumIncome = document.getElementById('expense-sum-income');
    const expenseSumExpense = document.getElementById('expense-sum-expense');
    const expenseSumBalance = document.getElementById('expense-sum-balance');

    const expenseSearchInput = document.getElementById('expense-search-input');
    const expenseFilterType = document.getElementById('expense-filter-type');
    const expenseFilterCategory = document.getElementById('expense-filter-category');
    const expenseSortSelect = document.getElementById('expense-sort-select');

    // Modal Elements for Expense
    const modalExpense = document.getElementById('modal-expense');
    const modalExpenseCard = document.getElementById('modal-expense-card');
    const modalExpenseTitle = document.getElementById('modal-expense-title');
    const formExpense = document.getElementById('form-expense');
    const btnOpenAddExpense = document.getElementById('btn-open-add-expense');
    const btnCloseExpenseModal = document.getElementById('btn-close-expense-modal');
    const btnCancelExpense = document.getElementById('btn-cancel-expense');

    // Inputs inside modal
    const inputExpenseId = document.getElementById('expense-id');
    const inputExpenseTitle = document.getElementById('expense-title');
    const inputExpenseType = document.getElementById('expense-type');
    const inputExpenseAmount = document.getElementById('expense-amount');
    const inputExpenseCategory = document.getElementById('expense-category');
    const inputExpenseDate = document.getElementById('expense-date');

    /**
     * Render Expense List & Summary Balance
     */
    function renderExpenses() {
        const query = expenseSearchInput.value.toLowerCase().trim();
        const typeFilter = expenseFilterType.value;
        const categoryFilter = expenseFilterCategory.value;
        const sortBy = expenseSortSelect.value;

        // 1. Calculate Overall Summary (Unfiltered totals)
        let totalIncome = 0;
        let totalExpense = 0;

        expenses.forEach(item => {
            const val = parseFloat(item.amount) || 0;
            if (item.type === 'pemasukan') {
                totalIncome += val;
            } else {
                totalExpense += val;
            }
        });

        const netBalance = totalIncome - totalExpense;

        expenseSumIncome.textContent = formatIDR(totalIncome);
        expenseSumExpense.textContent = formatIDR(totalExpense);
        expenseSumBalance.textContent = formatIDR(netBalance);

        // Styling net balance color
        if (netBalance < 0) {
            expenseSumBalance.className = 'text-xl font-bold text-rose-600 mt-0.5';
        } else {
            expenseSumBalance.className = 'text-xl font-bold text-slate-800 mt-0.5';
        }

        // 2. Filter Items
        let filtered = expenses.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(query) || item.category.toLowerCase().includes(query);
            const matchesType = (typeFilter === 'all') || (item.type === typeFilter);
            const matchesCategory = (categoryFilter === 'all') || (item.category === categoryFilter);

            return matchesSearch && matchesType && matchesCategory;
        });

        // 3. Sort Items
        filtered.sort((a, b) => {
            if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
            if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
            if (sortBy === 'amount-desc') return b.amount - a.amount;
            if (sortBy === 'amount-asc') return a.amount - b.amount;
            return 0;
        });

        // 4. Render Rows into DOM Table
        expenseTableBody.innerHTML = '';

        if (filtered.length === 0) {
            expenseEmptyState.classList.remove('hidden');
        } else {
            expenseEmptyState.classList.add('hidden');

            filtered.forEach(item => {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-slate-50/80 transition-all';

                const isIncome = item.type === 'pemasukan';
                const typeBadgeClass = isIncome 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-rose-50 text-rose-700 border-rose-200';
                const typeIcon = isIncome ? 'fa-arrow-down-left' : 'fa-arrow-up-right';
                const typeText = isIncome ? 'Pemasukan' : 'Pengeluaran';
                const amountSign = isIncome ? '+' : '-';
                const amountClass = isIncome ? 'text-emerald-600 font-bold' : 'text-slate-800 font-bold';

                tr.innerHTML = `
                    <td class="py-3.5 px-4 font-semibold text-slate-800">
                        <div>${escapeHTML(item.title)}</div>
                        <div class="mt-1 sm:hidden">
                            <span class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${typeBadgeClass}">
                                <i class="fa-solid ${typeIcon}"></i> ${typeText}
                            </span>
                        </div>
                    </td>
                    <td class="py-3.5 px-4">
                        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            ${escapeHTML(item.category)}
                        </span>
                    </td>
                    <td class="py-3.5 px-4 text-slate-500 whitespace-nowrap">${formatDateID(item.date)}</td>
                    <td class="py-3.5 px-4 text-right ${amountClass} whitespace-nowrap">
                        ${amountSign} ${formatIDR(item.amount)}
                    </td>
                    <td class="py-3.5 px-4 text-center whitespace-nowrap">
                        <div class="flex items-center justify-center space-x-1">
                            <button type="button" data-action="edit-expense" data-id="${item.id}" class="w-8 h-8 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 flex items-center justify-center transition-all" title="Ubah">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button type="button" data-action="delete-expense" data-id="${item.id}" class="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all" title="Hapus">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                `;

                expenseTableBody.appendChild(tr);
            });
        }
    }

    // Modal Control Functions for Expense
    function openExpenseModal(expenseToEdit = null) {
        formExpense.reset();
        
        if (expenseToEdit) {
            modalExpenseTitle.textContent = 'Ubah Transaksi';
            inputExpenseId.value = expenseToEdit.id;
            inputExpenseTitle.value = expenseToEdit.title;
            inputExpenseType.value = expenseToEdit.type;
            inputExpenseAmount.value = expenseToEdit.amount;
            inputExpenseCategory.value = expenseToEdit.category;
            inputExpenseDate.value = expenseToEdit.date;
        } else {
            modalExpenseTitle.textContent = 'Tambah Transaksi Baru';
            inputExpenseId.value = '';
            // Default date to today YYYY-MM-DD
            inputExpenseDate.value = new Date().toISOString().split('T')[0];
        }

        modalExpense.classList.remove('hidden');
        setTimeout(() => {
            modalExpenseCard.classList.remove('scale-95', 'opacity-0');
            modalExpenseCard.classList.add('scale-100', 'opacity-100');
        }, 10);
    }

    function closeExpenseModal() {
        modalExpenseCard.classList.remove('scale-100', 'opacity-100');
        modalExpenseCard.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            modalExpense.classList.add('hidden');
        }, 200);
    }

    // Expense Event Listeners
    btnOpenAddExpense.addEventListener('click', () => openExpenseModal());
    btnCloseExpenseModal.addEventListener('click', closeExpenseModal);
    btnCancelExpense.addEventListener('click', closeExpenseModal);

    // Filter & Search Inputs Live Updates
    [expenseSearchInput, expenseFilterType, expenseFilterCategory, expenseSortSelect].forEach(element => {
        element.addEventListener('input', renderExpenses);
        element.addEventListener('change', renderExpenses);
    });

    // Handle Form Submit (Add / Edit)
    formExpense.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = inputExpenseTitle.value.trim();
        const type = inputExpenseType.value;
        const amount = parseFloat(inputExpenseAmount.value);
        const category = inputExpenseCategory.value;
        const date = inputExpenseDate.value;
        const id = inputExpenseId.value;

        // Validation
        if (!title) {
            showToast('Judul transaksi tidak boleh kosong!', 'error');
            return;
        }

        if (isNaN(amount) || amount <= 0) {
            showToast('Jumlah transaksi harus berupa angka lebih dari 0!', 'error');
            return;
        }

        if (!date) {
            showToast('Tanggal transaksi wajib diisi!', 'error');
            return;
        }

        if (id) {
            // Edit existing item
            const index = expenses.findIndex(x => x.id === id);
            if (index !== -1) {
                expenses[index] = { id, title, type, category, amount, date };
                showToast('Transaksi berhasil diperbarui!', 'success');
            }
        } else {
            // Add new item
            const newItem = {
                id: 'exp-' + Date.now(),
                title,
                type,
                category,
                amount,
                date
            };
            expenses.unshift(newItem);
            showToast('Transaksi berhasil ditambahkan!', 'success');
        }

        saveExpenses();
        renderExpenses();
        closeExpenseModal();
    });

    // Delegate Table Action Buttons (Edit & Delete)
    expenseTableBody.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;

        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');

        if (action === 'edit-expense') {
            const item = expenses.find(x => x.id === id);
            if (item) openExpenseModal(item);
        } else if (action === 'delete-expense') {
            const item = expenses.find(x => x.id === id);
            if (item) {
                openDeleteConfirmModal(`Apakah Anda yakin ingin menghapus transaksi "${item.title}"?`, () => {
                    expenses = expenses.filter(x => x.id !== id);
                    saveExpenses();
                    renderExpenses();
                    showToast('Transaksi telah dihapus.', 'info');
                });
            }
        }
    });


    /* ==========================================================================
       4. BOOKMARK MANAGER LOGIC (FITUR 2)
       ========================================================================== */

    // Initial Seed Bookmarks if empty
    const initialBookmarks = [
        { id: 'bm-1', title: 'MDN Web Docs JavaScript', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', category: 'Edukasi', note: 'Dokumentasi standar resmi JavaScript dan API DOM peramban.', createdAt: '2026-09-20' },
        { id: 'bm-2', title: 'Tailwind CSS Documentation', url: 'https://tailwindcss.com/docs', category: 'Pekerjaan', note: 'Panduan kelas utilitas Tailwind untuk styling cepat.', createdAt: '2026-09-22' },
        { id: 'bm-3', title: 'FontAwesome Icon Reference', url: 'https://fontawesome.com/icons', category: 'Produktivitas', note: 'Pustaka ikon vektor gratis dan mudah dipakai.', createdAt: '2026-09-24' }
    ];

    let bookmarks = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKMARKS));
    if (!bookmarks || !Array.isArray(bookmarks)) {
        bookmarks = initialBookmarks;
        saveBookmarks();
    }

    function saveBookmarks() {
        localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    }

    // DOM Elements for Bookmark Manager
    const bookmarkGrid = document.getElementById('bookmark-grid');
    const bookmarkEmptyState = document.getElementById('bookmark-empty-state');
    const bookmarkSearchInput = document.getElementById('bookmark-search-input');
    const bookmarkFilterCategory = document.getElementById('bookmark-filter-category');
    const bookmarkSortSelect = document.getElementById('bookmark-sort-select');

    // Modal Elements for Bookmark
    const modalBookmark = document.getElementById('modal-bookmark');
    const modalBookmarkCard = document.getElementById('modal-bookmark-card');
    const modalBookmarkTitle = document.getElementById('modal-bookmark-title');
    const formBookmark = document.getElementById('form-bookmark');
    const btnOpenAddBookmark = document.getElementById('btn-open-add-bookmark');
    const btnCloseBookmarkModal = document.getElementById('btn-close-bookmark-modal');
    const btnCancelBookmark = document.getElementById('btn-cancel-bookmark');

    const inputBookmarkId = document.getElementById('bookmark-id');
    const inputBookmarkTitle = document.getElementById('bookmark-title');
    const inputBookmarkUrl = document.getElementById('bookmark-url');
    const inputBookmarkCategory = document.getElementById('bookmark-category');
    const inputBookmarkNote = document.getElementById('bookmark-note');

    /**
     * Render Bookmark Grid List
     */
    function renderBookmarks() {
        const query = bookmarkSearchInput.value.toLowerCase().trim();
        const categoryFilter = bookmarkFilterCategory.value;
        const sortBy = bookmarkSortSelect.value;

        // 1. Filter
        let filtered = bookmarks.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(query) || 
                                  item.url.toLowerCase().includes(query) || 
                                  (item.note && item.note.toLowerCase().includes(query));
            const matchesCategory = (categoryFilter === 'all') || (item.category === categoryFilter);

            return matchesSearch && matchesCategory;
        });

        // 2. Sort
        filtered.sort((a, b) => {
            if (sortBy === 'date-desc') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            if (sortBy === 'title-asc') return a.title.localeCompare(b.title);
            if (sortBy === 'title-desc') return b.title.localeCompare(a.title);
            return 0;
        });

        // 3. Render Grid Cards
        bookmarkGrid.innerHTML = '';

        if (filtered.length === 0) {
            bookmarkEmptyState.classList.remove('hidden');
        } else {
            bookmarkEmptyState.classList.add('hidden');

            filtered.forEach(item => {
                const card = document.createElement('div');
                card.className = 'bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group';

                // Extract domain name for subtitle preview
                let domain = '';
                try {
                    const parsedUrl = new URL(item.url);
                    domain = parsedUrl.hostname;
                } catch {
                    domain = item.url;
                }

                card.innerHTML = `
                    <div class="space-y-3">
                        <div class="flex items-start justify-between gap-2">
                            <div class="flex items-center space-x-3">
                                <div class="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center text-lg shrink-0 border border-sky-100 group-hover:bg-sky-600 group-hover:text-white transition-all">
                                    <i class="fa-solid fa-globe"></i>
                                </div>
                                <div class="overflow-hidden">
                                    <h4 class="font-bold text-slate-800 text-base leading-snug line-clamp-1">${escapeHTML(item.title)}</h4>
                                    <p class="text-xs text-slate-400 font-medium truncate">${escapeHTML(domain)}</p>
                                </div>
                            </div>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                ${escapeHTML(item.category)}
                            </span>
                        </div>

                        ${item.note ? `
                            <p class="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2 leading-relaxed">
                                ${escapeHTML(item.note)}
                            </p>
                        ` : ''}
                    </div>

                    <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <!-- Direct Link with target="_blank" and rel="noopener noreferrer" -->
                        <a href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center space-x-1.5 font-bold text-sky-600 hover:text-sky-700 hover:underline">
                            <span>Buka Tautan</span>
                            <i class="fa-solid fa-arrow-up-right-from-square text-[11px]"></i>
                        </a>

                        <div class="flex items-center space-x-1">
                            <button type="button" data-action="edit-bookmark" data-id="${item.id}" class="w-7 h-7 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 flex items-center justify-center transition-all" title="Ubah">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button type="button" data-action="delete-bookmark" data-id="${item.id}" class="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all" title="Hapus">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                `;

                bookmarkGrid.appendChild(card);
            });
        }
    }

    // Modal Control Functions for Bookmark
    function openBookmarkModal(bookmarkToEdit = null) {
        formBookmark.reset();

        if (bookmarkToEdit) {
            modalBookmarkTitle.textContent = 'Ubah Bookmark';
            inputBookmarkId.value = bookmarkToEdit.id;
            inputBookmarkTitle.value = bookmarkToEdit.title;
            inputBookmarkUrl.value = bookmarkToEdit.url;
            inputBookmarkCategory.value = bookmarkToEdit.category;
            inputBookmarkNote.value = bookmarkToEdit.note || '';
        } else {
            modalBookmarkTitle.textContent = 'Tambah Bookmark Baru';
            inputBookmarkId.value = '';
        }

        modalBookmark.classList.remove('hidden');
        setTimeout(() => {
            modalBookmarkCard.classList.remove('scale-95', 'opacity-0');
            modalBookmarkCard.classList.add('scale-100', 'opacity-100');
        }, 10);
    }

    function closeBookmarkModal() {
        modalBookmarkCard.classList.remove('scale-100', 'opacity-100');
        modalBookmarkCard.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            modalBookmark.classList.add('hidden');
        }, 200);
    }

    // URL Validation Helper (must start with http:// or https://)
    function isValidURL(string) {
        const pattern = new RegExp('^(https?:\\/\\/)', 'i');
        return !!pattern.test(string);
    }

    // Bookmark Event Listeners
    btnOpenAddBookmark.addEventListener('click', () => openBookmarkModal());
    btnCloseBookmarkModal.addEventListener('click', closeBookmarkModal);
    btnCancelBookmark.addEventListener('click', closeBookmarkModal);

    [bookmarkSearchInput, bookmarkFilterCategory, bookmarkSortSelect].forEach(element => {
        element.addEventListener('input', renderBookmarks);
        element.addEventListener('change', renderBookmarks);
    });

    // Form Submit (Add/Edit Bookmark)
    formBookmark.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = inputBookmarkTitle.value.trim();
        const url = inputBookmarkUrl.value.trim();
        const category = inputBookmarkCategory.value;
        const note = inputBookmarkNote.value.trim();
        const id = inputBookmarkId.value;

        if (!title) {
            showToast('Nama tautan wajib diisi!', 'error');
            return;
        }

        if (!isValidURL(url)) {
            showToast('URL harus valid dan diawali http:// atau https://', 'error');
            return;
        }

        if (id) {
            // Edit existing
            const index = bookmarks.findIndex(x => x.id === id);
            if (index !== -1) {
                bookmarks[index] = { ...bookmarks[index], title, url, category, note };
                showToast('Bookmark berhasil diperbarui!', 'success');
            }
        } else {
            // Add new
            const newItem = {
                id: 'bm-' + Date.now(),
                title,
                url,
                category,
                note,
                createdAt: new Date().toISOString().split('T')[0]
            };
            bookmarks.unshift(newItem);
            showToast('Bookmark berhasil disimpan!', 'success');
        }

        saveBookmarks();
        renderBookmarks();
        closeBookmarkModal();
    });

    // Delegate Bookmark Actions
    bookmarkGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;

        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');

        if (action === 'edit-bookmark') {
            const item = bookmarks.find(x => x.id === id);
            if (item) openBookmarkModal(item);
        } else if (action === 'delete-bookmark') {
            const item = bookmarks.find(x => x.id === id);
            if (item) {
                openDeleteConfirmModal(`Apakah Anda yakin ingin menghapus bookmark "${item.title}"?`, () => {
                    bookmarks = bookmarks.filter(x => x.id !== id);
                    saveBookmarks();
                    renderBookmarks();
                    showToast('Bookmark telah dihapus.', 'info');
                });
            }
        }
    });


    /* ==========================================================================
       5. QUIZ APP LOGIC (FITUR 3)
       ========================================================================== */

    // Array of Quiz Questions Object (JS Data Structure)
    const quizQuestions = [
        {
            id: 1,
            question: 'Apa fungsi utama dari method `document.querySelector()` pada JavaScript DOM?',
            options: [
                'Membuat elemen HTML baru secara langsung di halaman',
                'Mengembalikan elemen pertama dalam dokumen yang cocok dengan CSS selector',
                'Menghapus elemen teratas dari dokumen HTML',
                'Mengubah seluruh gaya CSS peramban'
            ],
            correct: 1,
            explanation: '`document.querySelector()` mengembalikan elemen pertama yang cocok dengan pemilih (selector) CSS yang diberikan.'
        },
        {
            id: 2,
            question: 'Manakah cara yang BENAR untuk menyimpan data objek ke dalam `localStorage`?',
            options: [
                'localStorage.setItem("key", object)',
                'localStorage.setItem("key", JSON.stringify(object))',
                'localStorage.save("key", object.toString())',
                'localStorage.push("key", object)'
            ],
            correct: 1,
            explanation: '`localStorage` hanya dapat menyimpan string. Oleh karena itu, objek JavaScript harus diubah ke string JSON menggunakan `JSON.stringify()`.'
        },
        {
            id: 3,
            question: 'Atribut apakah yang wajib digunakan pada tag link `target="_blank"` untuk mencegah risiko keamanan tab nabbing?',
            options: [
                'rel="noopener noreferrer"',
                'type="text/css"',
                'download="true"',
                'aria-hidden="true"'
            ],
            correct: 0,
            explanation: '`rel="noopener noreferrer"` mencegah halaman baru mengakses objek `window.opener` dari halaman asal.'
        },
        {
            id: 4,
            question: 'Method Array manakah yang digunakan untuk menyaring item berdasarkan kondisi tertentu tanpa mengubah array asli?',
            options: [
                'Array.prototype.splice()',
                'Array.prototype.push()',
                'Array.prototype.filter()',
                'Array.prototype.forEach()'
            ],
            correct: 2,
            explanation: '`filter()` membuat array baru yang berisi semua elemen yang lolos pengujian kondisi yang diberikan.'
        },
        {
            id: 5,
            question: 'Bagaimana cara menambahkan Event Listener pada tombol HTML menggunakan JavaScript tanpa inline handler?',
            options: [
                'button.onclick = "runFunction()"',
                'button.addEventListener("click", runFunction)',
                'button.attachEvent("onclick", runFunction)',
                'button.bind("click", runFunction)'
            ],
            correct: 1,
            explanation: '`addEventListener("click", handler)` adalah standar modern untuk meregistrasikan fungsi penanganan event di DOM.'
        }
    ];

    // Quiz Application State
    let quizState = {
        currentIndex: 0,
        score: 0,
        selectedOption: null,
        isAnswered: false,
        highScore: parseInt(localStorage.getItem(STORAGE_KEYS.QUIZ_HIGHSCORE) || '0', 10)
    };

    // DOM Elements for Quiz
    const quizHighScoreDisplay = document.getElementById('quiz-highscore-display');
    const quizScreenStart = document.getElementById('quiz-screen-start');
    const quizScreenQuestion = document.getElementById('quiz-screen-question');
    const quizScreenResult = document.getElementById('quiz-screen-result');

    const btnQuizStart = document.getElementById('btn-quiz-start');
    const btnQuizNext = document.getElementById('btn-quiz-next');
    const btnQuizRetry = document.getElementById('btn-quiz-retry');

    const quizProgressText = document.getElementById('quiz-progress-text');
    const quizScoreLive = document.getElementById('quiz-score-live');
    const quizProgressBar = document.getElementById('quiz-progress-bar');
    const quizQuestionText = document.getElementById('quiz-question-text');
    const quizOptionsContainer = document.getElementById('quiz-options-container');

    const quizFeedbackBox = document.getElementById('quiz-feedback-box');
    const quizFeedbackIcon = document.getElementById('quiz-feedback-icon');
    const quizFeedbackTitle = document.getElementById('quiz-feedback-title');
    const quizFeedbackDesc = document.getElementById('quiz-feedback-desc');

    const quizFinalScore = document.getElementById('quiz-final-score');
    const quizTotalQuestions = document.getElementById('quiz-total-questions');
    const quizPercentageText = document.getElementById('quiz-percentage-text');
    const quizNewHighScoreTag = document.getElementById('quiz-new-highscore-tag');
    const quizResultBadgeIcon = document.getElementById('quiz-result-badge-icon');

    /**
     * Update High Score UI
     */
    function updateHighScoreUI() {
        quizHighScoreDisplay.textContent = `${quizState.highScore} / ${quizQuestions.length}`;
    }

    /**
     * Start / Reset Quiz
     */
    function startQuiz() {
        quizState.currentIndex = 0;
        quizState.score = 0;
        quizState.selectedOption = null;
        quizState.isAnswered = false;

        quizScreenStart.classList.add('hidden');
        quizScreenResult.classList.add('hidden');
        quizScreenQuestion.classList.remove('hidden');

        renderQuizQuestion();
    }

    /**
     * Render Current Question
     */
    function renderQuizQuestion() {
        const currentQ = quizQuestions[quizState.currentIndex];
        quizState.selectedOption = null;
        quizState.isAnswered = false;

        // Reset Next button
        btnQuizNext.disabled = true;
        btnQuizNext.className = 'px-6 py-3 bg-slate-300 text-slate-500 font-bold text-sm rounded-xl cursor-not-allowed transition-all flex items-center space-x-2';
        btnQuizNext.querySelector('span').textContent = (quizState.currentIndex === quizQuestions.length - 1) ? 'Lihat Hasil Kuis' : 'Soal Berikutnya';

        // Hide Feedback box
        quizFeedbackBox.classList.add('hidden');

        // Update progress & live score
        quizProgressText.textContent = `Soal ${quizState.currentIndex + 1} dari ${quizQuestions.length}`;
        quizScoreLive.textContent = `Skor: ${quizState.score}`;
        const progressPercentage = ((quizState.currentIndex + 1) / quizQuestions.length) * 100;
        quizProgressBar.style.width = `${progressPercentage}%`;

        // Render question text
        quizQuestionText.textContent = currentQ.question;

        // Render Options Buttons
        quizOptionsContainer.innerHTML = '';
        const optionLabels = ['A', 'B', 'C', 'D'];

        currentQ.options.forEach((optText, idx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'quiz-opt-btn w-full p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-purple-50/50 hover:border-purple-300 text-left transition-all flex items-center space-x-3 group';
            btn.setAttribute('data-index', idx);

            btn.innerHTML = `
                <span class="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-all">
                    ${optionLabels[idx]}
                </span>
                <span class="text-sm font-semibold text-slate-700 leading-snug">${escapeHTML(optText)}</span>
            `;

            btn.addEventListener('click', () => selectQuizOption(idx));
            quizOptionsContainer.appendChild(btn);
        });
    }

    /**
     * Handle option selection
     * @param {number} selectedIdx 
     */
    function selectQuizOption(selectedIdx) {
        if (quizState.isAnswered) return; // Allow selection only once

        quizState.isAnswered = true;
        quizState.selectedOption = selectedIdx;

        const currentQ = quizQuestions[quizState.currentIndex];
        const isCorrect = (selectedIdx === currentQ.correct);

        if (isCorrect) {
            quizState.score += 1;
            quizScoreLive.textContent = `Skor: ${quizState.score}`;
        }

        // Highlight options in DOM
        const optButtons = quizOptionsContainer.querySelectorAll('.quiz-opt-btn');
        optButtons.forEach((btn, idx) => {
            btn.disabled = true;

            if (idx === currentQ.correct) {
                // Correct answer style
                btn.className = 'w-full p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-left flex items-center space-x-3';
                btn.querySelector('span:first-child').className = 'w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0';
            } else if (idx === selectedIdx && !isCorrect) {
                // Wrong selected option style
                btn.className = 'w-full p-4 rounded-xl border-2 border-rose-500 bg-rose-50 text-left flex items-center space-x-3';
                btn.querySelector('span:first-child').className = 'w-8 h-8 rounded-lg bg-rose-600 text-white font-bold text-xs flex items-center justify-center shrink-0';
            } else {
                btn.className = 'w-full p-4 rounded-xl border border-slate-200 bg-slate-50 opacity-60 text-left flex items-center space-x-3 cursor-not-allowed';
            }
        });

        // Show Feedback Box
        quizFeedbackBox.classList.remove('hidden');
        if (isCorrect) {
            quizFeedbackBox.className = 'p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-sm';
            quizFeedbackIcon.className = 'fa-solid fa-circle-check text-emerald-600 text-lg mt-0.5';
            quizFeedbackTitle.textContent = 'Jawaban Benar!';
            quizFeedbackDesc.textContent = currentQ.explanation;
        } else {
            quizFeedbackBox.className = 'p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 text-sm';
            quizFeedbackIcon.className = 'fa-solid fa-circle-xmark text-rose-600 text-lg mt-0.5';
            quizFeedbackTitle.textContent = 'Jawaban Kurang Tepat';
            quizFeedbackDesc.textContent = currentQ.explanation;
        }

        // Enable Next Button
        btnQuizNext.disabled = false;
        btnQuizNext.className = 'px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center space-x-2';
    }

    /**
     * Next question or Show Results
     */
    function nextQuizStep() {
        if (!quizState.isAnswered) return;

        if (quizState.currentIndex < quizQuestions.length - 1) {
            quizState.currentIndex += 1;
            renderQuizQuestion();
        } else {
            showQuizResults();
        }
    }

    /**
     * Finish Quiz & Show Score Result Screen
     */
    function showQuizResults() {
        quizScreenQuestion.classList.add('hidden');
        quizScreenResult.classList.remove('hidden');

        const totalQ = quizQuestions.length;
        const score = quizState.score;
        const percentage = Math.round((score / totalQ) * 100);

        quizFinalScore.textContent = score;
        quizTotalQuestions.textContent = totalQ;
        quizPercentageText.textContent = `Tingkat Akurasi: ${percentage}%`;

        // Check & Update High Score
        let isNewRecord = false;
        if (score > quizState.highScore) {
            quizState.highScore = score;
            localStorage.setItem(STORAGE_KEYS.QUIZ_HIGHSCORE, score.toString());
            updateHighScoreUI();
            isNewRecord = true;
        }

        // UI Adjustments based on performance
        if (isNewRecord) {
            quizNewHighScoreTag.classList.remove('hidden');
            quizResultBadgeIcon.className = 'w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto shadow-lg bg-amber-100 text-amber-600 border border-amber-200';
            showToast('Selamat! Anda meraih Rekor Baru di Kuis!', 'success');
        } else {
            quizNewHighScoreTag.classList.add('hidden');
            if (percentage >= 80) {
                quizResultBadgeIcon.className = 'w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto shadow-lg bg-emerald-100 text-emerald-600 border border-emerald-200';
            } else {
                quizResultBadgeIcon.className = 'w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto shadow-lg bg-indigo-100 text-indigo-600 border border-indigo-200';
            }
        }
    }

    // Quiz Event Listeners
    btnQuizStart.addEventListener('click', startQuiz);
    btnQuizNext.addEventListener('click', nextQuizStep);
    btnQuizRetry.addEventListener('click', startQuiz);


    /* ==========================================================================
       6. GLOBAL DELETE CONFIRMATION MODAL
       ========================================================================== */

    const modalDeleteConfirm = document.getElementById('modal-delete-confirm');
    const modalDeleteCard = document.getElementById('modal-delete-card');
    const deleteModalMessage = document.getElementById('delete-modal-message');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');

    let onConfirmDeleteCallback = null;

    function openDeleteConfirmModal(message, callback) {
        deleteModalMessage.textContent = message;
        onConfirmDeleteCallback = callback;

        modalDeleteConfirm.classList.remove('hidden');
        setTimeout(() => {
            modalDeleteCard.classList.remove('scale-95', 'opacity-0');
            modalDeleteCard.classList.add('scale-100', 'opacity-100');
        }, 10);
    }

    function closeDeleteConfirmModal() {
        modalDeleteCard.classList.remove('scale-100', 'opacity-100');
        modalDeleteCard.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            modalDeleteConfirm.classList.add('hidden');
            onConfirmDeleteCallback = null;
        }, 200);
    }

    btnCancelDelete.addEventListener('click', closeDeleteConfirmModal);

    btnConfirmDelete.addEventListener('click', () => {
        if (typeof onConfirmDeleteCallback === 'function') {
            onConfirmDeleteCallback();
        }
        closeDeleteConfirmModal();
    });


    /* ==========================================================================
       7. HELPER & INITIALIZATION
       ========================================================================== */

    // HTML Sanitizer to prevent XSS in dynamic rendering
    function escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Initial renders on page load
    renderExpenses();
    renderBookmarks();
    updateHighScoreUI();

});
