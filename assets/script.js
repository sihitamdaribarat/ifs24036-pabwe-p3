/**
 * OmniHub - Single Page Application Script
 * PABWE Praktikum 3
 * 
 * Modul Terdiri Dari:
 * 1. Utilities & Toast System
 * 2. Tab Navigation System (berbasis URL Query Parameter ?tab=...)
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

        if (!toast || !toastMsg || !toastIcon) return;

        toastMsg.textContent = message;

        if (type === 'success') {
            toastIcon.className = 'fa-solid fa-circle-check text-emerald-400 text-base';
        } else if (type === 'error') {
            toastIcon.className = 'fa-solid fa-circle-xmark text-rose-400 text-base';
        } else {
            toastIcon.className = 'fa-solid fa-circle-info text-sky-400 text-base';
        }

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
       2. TAB NAVIGATION SYSTEM (URL Query String ?tab=expense|bookmark|quiz)
       ========================================================================== */

    const tabs = {
        expense: { btn: document.getElementById('tab-expense'), panel: document.getElementById('panel-expense') },
        bookmark: { btn: document.getElementById('tab-bookmark'), panel: document.getElementById('panel-bookmark') },
        quiz: { btn: document.getElementById('tab-quiz'), panel: document.getElementById('panel-quiz') }
    };

    /**
     * Get active tab from URL query string ?tab=...
     */
    function getActiveTabFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        if (tabParam && ['expense', 'bookmark', 'quiz'].includes(tabParam)) {
            return tabParam;
        }
        return 'expense'; // Default tab
    }

    /**
     * Switch tab view and update URL query parameter without full reload
     * @param {'expense'|'bookmark'|'quiz'} targetTab 
     * @param {boolean} updateHistory 
     */
    function switchTab(targetTab, updateHistory = true) {
        if (!tabs[targetTab]) targetTab = 'expense';

        // Update UI states for tabs
        Object.keys(tabs).forEach(key => {
            const isTarget = key === targetTab;
            if (tabs[key].btn) tabs[key].btn.classList.toggle('active', isTarget);
            if (tabs[key].panel) tabs[key].panel.classList.toggle('hidden', !isTarget);
        });

        // Update URL search query string ?tab=...
        if (updateHistory) {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', targetTab);
            window.history.replaceState(null, '', url.toString());
        }
    }

    // Bind click handlers for tab buttons
    Object.keys(tabs).forEach(key => {
        if (tabs[key].btn) {
            tabs[key].btn.addEventListener('click', () => switchTab(key, true));
        }
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
        const currentTab = getActiveTabFromURL();
        switchTab(currentTab, false);
    });

    // Initialize active tab from URL query string on startup
    const initialTab = getActiveTabFromURL();
    switchTab(initialTab, true);


    /* ==========================================================================
       3. EXPENSE TRACKER LOGIC (FITUR 1)
       ========================================================================== */

    const initialExpenses = [
        { id: 'exp-1', title: 'Gaji Bulanan & Project Bonus', type: 'pemasukan', category: 'Gaji & Bonus', amount: 6500000, date: '2026-09-01' },
        { id: 'exp-2', title: 'Makan Siang Katering & Kopi', type: 'pengeluaran', category: 'Makanan & Minuman', amount: 65000, date: '2026-09-25' },
        { id: 'exp-3', title: 'Bensin & Servis Motor', type: 'pengeluaran', category: 'Transportasi', amount: 150000, date: '2026-09-26' },
        { id: 'exp-4', title: 'Langganan Internet & Listrik', type: 'pengeluaran', category: 'Tagihan & Utilitas', amount: 450000, date: '2026-09-27' }
    ];

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

    // Modal Elements
    const modalExpense = document.getElementById('modal-expense');
    const modalExpenseCard = document.getElementById('modal-expense-card');
    const modalExpenseTitle = document.getElementById('modal-expense-title');
    const formExpense = document.getElementById('form-expense');
    const btnOpenAddExpense = document.getElementById('btn-open-add-expense');
    const btnCloseExpenseModal = document.getElementById('btn-close-expense-modal');
    const btnCancelExpense = document.getElementById('btn-cancel-expense');

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
        if (!expenseTableBody) return;

        const query = (expenseSearchInput ? expenseSearchInput.value : '').toLowerCase().trim();
        const typeFilter = expenseFilterType ? expenseFilterType.value : 'all';
        const categoryFilter = expenseFilterCategory ? expenseFilterCategory.value : 'all';
        const sortBy = expenseSortSelect ? expenseSortSelect.value : 'date-desc';

        // 1. Overall Summary
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

        if (expenseSumIncome) expenseSumIncome.textContent = formatIDR(totalIncome);
        if (expenseSumExpense) expenseSumExpense.textContent = formatIDR(totalExpense);
        if (expenseSumBalance) {
            expenseSumBalance.textContent = formatIDR(netBalance);
            if (netBalance < 0) {
                expenseSumBalance.className = 'text-xl font-extrabold text-rose-800 mt-0.5';
            } else {
                expenseSumBalance.className = 'text-xl font-extrabold text-slate-900 mt-0.5';
            }
        }

        // 2. Filter
        let filtered = expenses.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(query) || item.category.toLowerCase().includes(query);
            const matchesType = (typeFilter === 'all') || (item.type === typeFilter);
            const matchesCategory = (categoryFilter === 'all') || (item.category === categoryFilter);

            return matchesSearch && matchesType && matchesCategory;
        });

        // 3. Sort
        filtered.sort((a, b) => {
            if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
            if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
            if (sortBy === 'amount-desc') return b.amount - a.amount;
            if (sortBy === 'amount-asc') return a.amount - b.amount;
            return 0;
        });

        // 4. Render Rows in DOM with High Contrast Colors
        expenseTableBody.innerHTML = '';

        if (filtered.length === 0) {
            if (expenseEmptyState) expenseEmptyState.classList.remove('hidden');
        } else {
            if (expenseEmptyState) expenseEmptyState.classList.add('hidden');

            filtered.forEach(item => {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-slate-50 transition-all border-b border-slate-100';

                const isIncome = item.type === 'pemasukan';
                // High contrast badge colors
                const typeBadgeClass = isIncome 
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold' 
                    : 'bg-rose-100 text-rose-900 border-rose-300 font-bold';
                const typeIcon = isIncome ? 'fa-arrow-down-left' : 'fa-arrow-up-right';
                const typeText = isIncome ? 'Pemasukan' : 'Pengeluaran';
                const amountSign = isIncome ? '+' : '-';
                const amountClass = isIncome ? 'text-emerald-900 font-extrabold' : 'text-rose-900 font-extrabold';

                tr.innerHTML = `
                    <td class="py-3.5 px-4 font-bold text-slate-900">
                        <div>${escapeHTML(item.title)}</div>
                        <div class="mt-1 sm:hidden">
                            <span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${typeBadgeClass}">
                                <i class="fa-solid ${typeIcon}"></i> ${typeText}
                            </span>
                        </div>
                    </td>
                    <td class="py-3.5 px-4">
                        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800 border border-slate-300">
                            ${escapeHTML(item.category)}
                        </span>
                    </td>
                    <td class="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap">${formatDateID(item.date)}</td>
                    <td class="py-3.5 px-4 text-right ${amountClass} whitespace-nowrap">
                        ${amountSign} ${formatIDR(item.amount)}
                    </td>
                    <td class="py-3.5 px-4 text-center whitespace-nowrap">
                        <div class="flex items-center justify-center space-x-1">
                            <button type="button" data-action="edit-expense" data-id="${item.id}" aria-label="Ubah Transaksi ${escapeHTML(item.title)}" class="w-8 h-8 rounded-lg text-slate-600 hover:text-brand-800 hover:bg-slate-200 flex items-center justify-center transition-all" title="Ubah">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button type="button" data-action="delete-expense" data-id="${item.id}" aria-label="Hapus Transaksi ${escapeHTML(item.title)}" class="w-8 h-8 rounded-lg text-slate-600 hover:text-rose-800 hover:bg-rose-100 flex items-center justify-center transition-all" title="Hapus">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                `;

                expenseTableBody.appendChild(tr);
            });
        }
    }

    // Modal Controls
    function openExpenseModal(expenseToEdit = null) {
        if (!modalExpense || !modalExpenseCard) return;

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
            inputExpenseDate.value = new Date().toISOString().split('T')[0];
        }

        modalExpense.classList.remove('hidden');
        setTimeout(() => {
            modalExpenseCard.classList.remove('scale-95', 'opacity-0');
            modalExpenseCard.classList.add('scale-100', 'opacity-100');
        }, 10);
    }

    function closeExpenseModal() {
        if (!modalExpense || !modalExpenseCard) return;

        modalExpenseCard.classList.remove('scale-100', 'opacity-100');
        modalExpenseCard.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            modalExpense.classList.add('hidden');
        }, 200);
    }

    if (btnOpenAddExpense) btnOpenAddExpense.addEventListener('click', () => openExpenseModal());
    if (btnCloseExpenseModal) btnCloseExpenseModal.addEventListener('click', closeExpenseModal);
    if (btnCancelExpense) btnCancelExpense.addEventListener('click', closeExpenseModal);

    [expenseSearchInput, expenseFilterType, expenseFilterCategory, expenseSortSelect].forEach(element => {
        if (element) {
            element.addEventListener('input', renderExpenses);
            element.addEventListener('change', renderExpenses);
        }
    });

    if (formExpense) {
        formExpense.addEventListener('submit', (e) => {
            e.preventDefault();

            const title = inputExpenseTitle.value.trim();
            const type = inputExpenseType.value;
            const amount = parseFloat(inputExpenseAmount.value);
            const category = inputExpenseCategory.value;
            const date = inputExpenseDate.value;
            const id = inputExpenseId.value;

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
                const index = expenses.findIndex(x => x.id === id);
                if (index !== -1) {
                    expenses[index] = { id, title, type, category, amount, date };
                    showToast('Transaksi berhasil diperbarui!', 'success');
                }
            } else {
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
    }

    if (expenseTableBody) {
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
    }


    /* ==========================================================================
       4. BOOKMARK MANAGER LOGIC (FITUR 2)
       ========================================================================== */

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

    const bookmarkGrid = document.getElementById('bookmark-grid');
    const bookmarkEmptyState = document.getElementById('bookmark-empty-state');
    const bookmarkSearchInput = document.getElementById('bookmark-search-input');
    const bookmarkFilterCategory = document.getElementById('bookmark-filter-category');
    const bookmarkSortSelect = document.getElementById('bookmark-sort-select');

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
        if (!bookmarkGrid) return;

        const query = (bookmarkSearchInput ? bookmarkSearchInput.value : '').toLowerCase().trim();
        const categoryFilter = bookmarkFilterCategory ? bookmarkFilterCategory.value : 'all';
        const sortBy = bookmarkSortSelect ? bookmarkSortSelect.value : 'date-desc';

        // Filter
        let filtered = bookmarks.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(query) || 
                                  item.url.toLowerCase().includes(query) || 
                                  (item.note && item.note.toLowerCase().includes(query));
            const matchesCategory = (categoryFilter === 'all') || (item.category === categoryFilter);

            return matchesSearch && matchesCategory;
        });

        // Sort
        filtered.sort((a, b) => {
            if (sortBy === 'date-desc') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            if (sortBy === 'title-asc') return a.title.localeCompare(b.title);
            if (sortBy === 'title-desc') return b.title.localeCompare(a.title);
            return 0;
        });

        // Render Cards with High Contrast Colors
        bookmarkGrid.innerHTML = '';

        if (filtered.length === 0) {
            if (bookmarkEmptyState) bookmarkEmptyState.classList.remove('hidden');
        } else {
            if (bookmarkEmptyState) bookmarkEmptyState.classList.add('hidden');

            filtered.forEach(item => {
                const card = document.createElement('div');
                card.className = 'bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group';

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
                                <div class="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center text-lg shrink-0 border border-sky-200 group-hover:bg-sky-800 group-hover:text-white transition-all">
                                    <i class="fa-solid fa-globe"></i>
                                </div>
                                <div class="overflow-hidden">
                                    <h4 class="font-bold text-slate-900 text-base leading-snug line-clamp-1">${escapeHTML(item.title)}</h4>
                                    <p class="text-xs text-slate-600 font-bold truncate">${escapeHTML(domain)}</p>
                                </div>
                            </div>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-800 border border-slate-300 shrink-0">
                                ${escapeHTML(item.category)}
                            </span>
                        </div>

                        ${item.note ? `
                            <p class="text-xs text-slate-800 bg-slate-100 p-2.5 rounded-xl border border-slate-200 line-clamp-2 leading-relaxed font-medium">
                                ${escapeHTML(item.note)}
                            </p>
                        ` : ''}
                    </div>

                    <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <a href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center space-x-1.5 font-extrabold text-sky-800 hover:text-sky-950 hover:underline">
                            <span>Buka Tautan</span>
                            <i class="fa-solid fa-arrow-up-right-from-square text-[11px]"></i>
                        </a>

                        <div class="flex items-center space-x-1">
                            <button type="button" data-action="edit-bookmark" data-id="${item.id}" aria-label="Ubah Bookmark ${escapeHTML(item.title)}" class="w-7 h-7 rounded-lg text-slate-600 hover:text-sky-800 hover:bg-sky-100 flex items-center justify-center transition-all" title="Ubah">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button type="button" data-action="delete-bookmark" data-id="${item.id}" aria-label="Hapus Bookmark ${escapeHTML(item.title)}" class="w-7 h-7 rounded-lg text-slate-600 hover:text-rose-800 hover:bg-rose-100 flex items-center justify-center transition-all" title="Hapus">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                `;

                bookmarkGrid.appendChild(card);
            });
        }
    }

    function openBookmarkModal(bookmarkToEdit = null) {
        if (!modalBookmark || !modalBookmarkCard) return;

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
        if (!modalBookmark || !modalBookmarkCard) return;

        modalBookmarkCard.classList.remove('scale-100', 'opacity-100');
        modalBookmarkCard.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            modalBookmark.classList.add('hidden');
        }, 200);
    }

    function isValidURL(string) {
        const pattern = new RegExp('^(https?:\\/\\/)', 'i');
        return !!pattern.test(string);
    }

    if (btnOpenAddBookmark) btnOpenAddBookmark.addEventListener('click', () => openBookmarkModal());
    if (btnCloseBookmarkModal) btnCloseBookmarkModal.addEventListener('click', closeBookmarkModal);
    if (btnCancelBookmark) btnCancelBookmark.addEventListener('click', closeBookmarkModal);

    [bookmarkSearchInput, bookmarkFilterCategory, bookmarkSortSelect].forEach(element => {
        if (element) {
            element.addEventListener('input', renderBookmarks);
            element.addEventListener('change', renderBookmarks);
        }
    });

    if (formBookmark) {
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
                const index = bookmarks.findIndex(x => x.id === id);
                if (index !== -1) {
                    bookmarks[index] = { ...bookmarks[index], title, url, category, note };
                    showToast('Bookmark berhasil diperbarui!', 'success');
                }
            } else {
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
    }

    if (bookmarkGrid) {
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
    }


    /* ==========================================================================
       5. QUIZ APP LOGIC (FITUR 3)
       ========================================================================== */

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

    let quizState = {
        currentIndex: 0,
        score: 0,
        selectedOption: null,
        isAnswered: false,
        highScore: parseInt(localStorage.getItem(STORAGE_KEYS.QUIZ_HIGHSCORE) || '0', 10)
    };

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

    function updateHighScoreUI() {
        if (quizHighScoreDisplay) {
            quizHighScoreDisplay.textContent = `${quizState.highScore} / ${quizQuestions.length}`;
        }
    }

    function startQuiz() {
        quizState.currentIndex = 0;
        quizState.score = 0;
        quizState.selectedOption = null;
        quizState.isAnswered = false;

        if (quizScreenStart) quizScreenStart.classList.add('hidden');
        if (quizScreenResult) quizScreenResult.classList.add('hidden');
        if (quizScreenQuestion) quizScreenQuestion.classList.remove('hidden');

        renderQuizQuestion();
    }

    function renderQuizQuestion() {
        const currentQ = quizQuestions[quizState.currentIndex];
        quizState.selectedOption = null;
        quizState.isAnswered = false;

        if (btnQuizNext) {
            btnQuizNext.disabled = true;
            btnQuizNext.className = 'px-6 py-3 bg-slate-300 text-slate-600 font-bold text-sm rounded-xl cursor-not-allowed transition-all flex items-center space-x-2';
            const btnSpan = btnQuizNext.querySelector('span');
            if (btnSpan) btnSpan.textContent = (quizState.currentIndex === quizQuestions.length - 1) ? 'Lihat Hasil Kuis' : 'Soal Berikutnya';
        }

        if (quizFeedbackBox) quizFeedbackBox.classList.add('hidden');

        if (quizProgressText) quizProgressText.textContent = `Soal ${quizState.currentIndex + 1} dari ${quizQuestions.length}`;
        if (quizScoreLive) quizScoreLive.textContent = `Skor: ${quizState.score}`;
        const progressPercentage = ((quizState.currentIndex + 1) / quizQuestions.length) * 100;
        if (quizProgressBar) quizProgressBar.style.width = `${progressPercentage}%`;

        if (quizQuestionText) quizQuestionText.textContent = currentQ.question;

        if (quizOptionsContainer) {
            quizOptionsContainer.innerHTML = '';
            const optionLabels = ['A', 'B', 'C', 'D'];

            currentQ.options.forEach((optText, idx) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'quiz-opt-btn w-full p-4 rounded-xl border border-slate-300 bg-slate-50 hover:bg-purple-100 hover:border-purple-400 text-left transition-all flex items-center space-x-3 group';
                btn.setAttribute('data-index', idx);

                btn.innerHTML = `
                    <span class="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold text-xs flex items-center justify-center shrink-0 group-hover:bg-purple-800 group-hover:text-white transition-all">
                        ${optionLabels[idx]}
                    </span>
                    <span class="text-sm font-bold text-slate-900 leading-snug">${escapeHTML(optText)}</span>
                `;

                btn.addEventListener('click', () => selectQuizOption(idx));
                quizOptionsContainer.appendChild(btn);
            });
        }
    }

    function selectQuizOption(selectedIdx) {
        if (quizState.isAnswered) return;

        quizState.isAnswered = true;
        quizState.selectedOption = selectedIdx;

        const currentQ = quizQuestions[quizState.currentIndex];
        const isCorrect = (selectedIdx === currentQ.correct);

        if (isCorrect) {
            quizState.score += 1;
            if (quizScoreLive) quizScoreLive.textContent = `Skor: ${quizState.score}`;
        }

        if (quizOptionsContainer) {
            const optButtons = quizOptionsContainer.querySelectorAll('.quiz-opt-btn');
            optButtons.forEach((btn, idx) => {
                btn.disabled = true;

                if (idx === currentQ.correct) {
                    btn.className = 'w-full p-4 rounded-xl border-2 border-emerald-700 bg-emerald-100 text-left flex items-center space-x-3';
                    const badge = btn.querySelector('span:first-child');
                    if (badge) badge.className = 'w-8 h-8 rounded-lg bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shrink-0';
                    const txt = btn.querySelector('span:last-child');
                    if (txt) txt.className = 'text-sm font-extrabold text-emerald-950 leading-snug';
                } else if (idx === selectedIdx && !isCorrect) {
                    btn.className = 'w-full p-4 rounded-xl border-2 border-rose-700 bg-rose-100 text-left flex items-center space-x-3';
                    const badge = btn.querySelector('span:first-child');
                    if (badge) badge.className = 'w-8 h-8 rounded-lg bg-rose-800 text-white font-bold text-xs flex items-center justify-center shrink-0';
                    const txt = btn.querySelector('span:last-child');
                    if (txt) txt.className = 'text-sm font-extrabold text-rose-950 leading-snug';
                } else {
                    btn.className = 'w-full p-4 rounded-xl border border-slate-200 bg-slate-50 opacity-50 text-left flex items-center space-x-3 cursor-not-allowed';
                }
            });
        }

        if (quizFeedbackBox) {
            quizFeedbackBox.classList.remove('hidden');
            if (isCorrect) {
                quizFeedbackBox.className = 'p-4 rounded-xl border border-emerald-400 bg-emerald-100 text-emerald-950 text-sm font-medium';
                if (quizFeedbackIcon) quizFeedbackIcon.className = 'fa-solid fa-circle-check text-emerald-800 text-lg mt-0.5';
                if (quizFeedbackTitle) quizFeedbackTitle.textContent = 'Jawaban Benar!';
                if (quizFeedbackDesc) quizFeedbackDesc.textContent = currentQ.explanation;
            } else {
                quizFeedbackBox.className = 'p-4 rounded-xl border border-rose-400 bg-rose-100 text-rose-950 text-sm font-medium';
                if (quizFeedbackIcon) quizFeedbackIcon.className = 'fa-solid fa-circle-xmark text-rose-800 text-lg mt-0.5';
                if (quizFeedbackTitle) quizFeedbackTitle.textContent = 'Jawaban Kurang Tepat';
                if (quizFeedbackDesc) quizFeedbackDesc.textContent = currentQ.explanation;
            }
        }

        if (btnQuizNext) {
            btnQuizNext.disabled = false;
            btnQuizNext.className = 'px-6 py-3 bg-purple-800 hover:bg-purple-900 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center space-x-2 border border-purple-700';
        }
    }

    function nextQuizStep() {
        if (!quizState.isAnswered) return;

        if (quizState.currentIndex < quizQuestions.length - 1) {
            quizState.currentIndex += 1;
            renderQuizQuestion();
        } else {
            showQuizResults();
        }
    }

    function showQuizResults() {
        if (quizScreenQuestion) quizScreenQuestion.classList.add('hidden');
        if (quizScreenResult) quizScreenResult.classList.remove('hidden');

        const totalQ = quizQuestions.length;
        const score = quizState.score;
        const percentage = Math.round((score / totalQ) * 100);

        if (quizFinalScore) quizFinalScore.textContent = score;
        if (quizTotalQuestions) quizTotalQuestions.textContent = totalQ;
        if (quizPercentageText) quizPercentageText.textContent = `Tingkat Akurasi: ${percentage}%`;

        let isNewRecord = false;
        if (score > quizState.highScore) {
            quizState.highScore = score;
            localStorage.setItem(STORAGE_KEYS.QUIZ_HIGHSCORE, score.toString());
            updateHighScoreUI();
            isNewRecord = true;
        }

        if (isNewRecord) {
            if (quizNewHighScoreTag) quizNewHighScoreTag.classList.remove('hidden');
            if (quizResultBadgeIcon) quizResultBadgeIcon.className = 'w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto shadow-lg bg-amber-200 text-amber-900 border border-amber-400';
            showToast('Selamat! Anda meraih Rekor Baru di Kuis!', 'success');
        } else {
            if (quizNewHighScoreTag) quizNewHighScoreTag.classList.add('hidden');
            if (quizResultBadgeIcon) {
                if (percentage >= 80) {
                    quizResultBadgeIcon.className = 'w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto shadow-lg bg-emerald-200 text-emerald-950 border border-emerald-400';
                } else {
                    quizResultBadgeIcon.className = 'w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto shadow-lg bg-purple-200 text-purple-950 border border-purple-400';
                }
            }
        }
    }

    if (btnQuizStart) btnQuizStart.addEventListener('click', startQuiz);
    if (btnQuizNext) btnQuizNext.addEventListener('click', nextQuizStep);
    if (btnQuizRetry) btnQuizRetry.addEventListener('click', startQuiz);


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
        if (!modalDeleteConfirm || !modalDeleteCard) return;

        if (deleteModalMessage) deleteModalMessage.textContent = message;
        onConfirmDeleteCallback = callback;

        modalDeleteConfirm.classList.remove('hidden');
        setTimeout(() => {
            modalDeleteCard.classList.remove('scale-95', 'opacity-0');
            modalDeleteCard.classList.add('scale-100', 'opacity-100');
        }, 10);
    }

    function closeDeleteConfirmModal() {
        if (!modalDeleteConfirm || !modalDeleteCard) return;

        modalDeleteCard.classList.remove('scale-100', 'opacity-100');
        modalDeleteCard.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            modalDeleteConfirm.classList.add('hidden');
            onConfirmDeleteCallback = null;
        }, 200);
    }

    if (btnCancelDelete) btnCancelDelete.addEventListener('click', closeDeleteConfirmModal);

    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', () => {
            if (typeof onConfirmDeleteCallback === 'function') {
                onConfirmDeleteCallback();
            }
            closeDeleteConfirmModal();
        });
    }


    /* ==========================================================================
       7. HELPER & INITIALIZATION
       ========================================================================== */

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
