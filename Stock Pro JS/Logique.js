// Stock Management System - All-in-One Application
class StockManager {
    constructor() {
        this.products = [];
        this.charts = {};
        this.sortConfig = { field: 'name', direction: 'asc' };
        this.currentEditId = null;
        this.filters = { search: '', category: '', stock: '' };
        this.userSession = null;
        this.currentPage = 'welcome';
        this.history = [];
        this.currency = localStorage.getItem('currency') || '€';
        this.currencyRates = {
            '€': 1,
            '$': 1.1,
            '£': 0.85,
            'CFA': 655.96
        };
        this.baseCurrency = '€'; // Prix stockés en euros
        this.init();
    }

    getUserKey(suffix) {
        if (!this.userSession || !this.userSession.email) return null;
        return `${suffix}_${this.userSession.email}`;
    }

    init() {
        console.log('Initializing StockManager...');
        this.checkAuth();
        this.setupEventListeners();
        feather.replace();
        console.log('StockManager initialized successfully');
    }

    loadHistory() {
        const key = this.getUserKey('stockHistory');
        if (!key) { this.history = []; return; }
        const stored = localStorage.getItem(key);
        if (stored) {
            this.history = JSON.parse(stored);
        } else {
            this.history = [];
        }
    }

    saveHistory() {
        const key = this.getUserKey('stockHistory');
        if (!key) return;
        localStorage.setItem(key, JSON.stringify(this.history));
    }

    addHistory(action, product) {
        const now = new Date();
        const dateStr = now.toLocaleDateString();
        const timeStr = now.toLocaleTimeString();
        let label = '';
        if (action === 'add') label = `Added product "${product.name}"`;
        else if (action === 'update') label = `Updated product "${product.name}"`;
        else if (action === 'delete') label = `Deleted product "${product.name}"`;
        else if (action === 'quantity') label = `Quantity change for "${product.name}"`;
        this.history.unshift({ label, date: dateStr, time: timeStr });
        if (this.history.length > 30) this.history = this.history.slice(0, 30); // max 30 entries
        this.saveHistory();
        this.updateHistoryList();
    }

    updateHistoryList() {
        const list = document.getElementById('historyList');
        if (!list) return;
        if (this.history.length === 0) {
            list.innerHTML = '<li>No actions recorded.</li>';
            return;
        }
        list.innerHTML = this.history.map(h => `<li><strong>${h.label}</strong><br><span style="font-size:12px;color:#888;">${h.date} at ${h.time}</span></li>`).join('');
    }

    checkAuth() {
        // Always show welcome page - no automatic login
        this.showWelcome();
    }

    showWelcome() {
        this.currentPage = 'welcome';
        document.getElementById('welcomePage').style.display = 'block';
        document.getElementById('dashboardPage').style.display = 'none';
        document.getElementById('settingsPage').style.display = 'none';
    }

    showDashboard() {
        this.currentPage = 'dashboard';
        document.getElementById('welcomePage').style.display = 'none';
        document.getElementById('dashboardPage').style.display = 'block';
        document.getElementById('settingsPage').style.display = 'none';
        this.loadProducts();
        this.initializeCharts();
        this.updateDashboard();
        this.updateHeaderInfo();
    }

    showSettings() {
        this.currentPage = 'settings';
        document.getElementById('welcomePage').style.display = 'none';
        document.getElementById('dashboardPage').style.display = 'none';
        document.getElementById('settingsPage').style.display = 'block';
        this.loadUserSettings();
    }

    // User management (stored in localStorage)
    getAllUsers() {
        const users = localStorage.getItem('users');
        return users ? JSON.parse(users) : [];
    }
    saveAllUsers(users) {
        localStorage.setItem('users', JSON.stringify(users));
    }

    login(email, password) {
        // Always clear previous session before attempting login
        localStorage.removeItem('userSession');
        this.userSession = null;
        const users = this.getAllUsers();
        const user = users.find(u => u.email === email);
        if (!user) {
            this.showToast("No account is associated with this email", 'error');
            return false;
        }
        if (user.password !== password) {
            this.showToast('Incorrect password', 'error');
            return false;
        }
        const userData = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            company: user.company,
            companyType: user.companyType
        };
        localStorage.setItem('userSession', JSON.stringify(userData));
        this.userSession = userData;
        this.loadProducts();
        this.loadHistory();
        this.showToast('Login successful!');
        this.showDashboard();
        return true;
    }

    signup(formData) {
        // Always check email existence, even if a session is active
        const users = this.getAllUsers();
        if (users.find(u => u.email === formData.email)) {
            this.showToast('This email is already in use', 'error');
            return false;
        }
        // Effacer toute session précédente
        localStorage.removeItem('userSession');
        this.userSession = null;
        const userData = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            company: formData.companyName,
            companyType: formData.companyType
        };
        users.push(userData);
        this.saveAllUsers(users);
        // We don't store the password in the session
        const sessionData = {
            id: userData.id,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            company: userData.company,
            companyType: userData.companyType
        };
        localStorage.setItem('userSession', JSON.stringify(sessionData));
        this.userSession = sessionData;
        this.loadProducts();
        this.loadHistory();
        this.showToast('Account created successfully!');
        this.showDashboard();
        return true;
    }

    logout() {
        localStorage.removeItem('userSession');
        this.userSession = null;
        this.products = [];
        this.history = [];
        this.showWelcome();
        this.showToast('Successfully logged out');
    }

    updateHeaderInfo() {
        if (this.userSession) {
            document.getElementById('companyWelcome').textContent = this.userSession.company || 'Dashboard';
        }
    }

    // Data Management
    loadProducts() {
        const key = this.getUserKey('stockProducts');
        if (!key) { this.products = []; return; }
        const stored = localStorage.getItem(key);
        if (stored) {
            this.products = JSON.parse(stored);
        } else {
            this.products = [];
        }
    }

    saveProducts() {
        const key = this.getUserKey('stockProducts');
        if (!key) return;
        localStorage.setItem(key, JSON.stringify(this.products));
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2);
    }

    // Currency conversion function
    convertPrice(price, fromCurrency = this.baseCurrency, toCurrency = this.currency) {
        if (fromCurrency === toCurrency) return price;
        
        // Convert to base currency (EUR) first
        const priceInBase = price / this.currencyRates[fromCurrency];
        
        // Then convert to target currency
        const convertedPrice = priceInBase * this.currencyRates[toCurrency];
        
        return Math.round(convertedPrice * 100) / 100; // Round to 2 decimal places
    }

    // Format price with currency symbol
    formatPrice(price) {
        const convertedPrice = this.convertPrice(price);
        return `${this.currency}${convertedPrice.toFixed(2)}`;
    }

    // Product CRUD Operations
    addProduct(productData) {
        const product = {
            id: this.generateId(),
            name: productData.name.trim(),
            category: productData.category.trim(),
            quantity: parseInt(productData.quantity),
            price: parseFloat(productData.price),
            minStockLevel: parseInt(productData.minStockLevel) || 5,
            lastUpdated: new Date().toISOString()
        };

        this.products.push(product);
        this.saveProducts();
        this.addHistory('add', product);
        this.updateDashboard();
        this.showToast('Product added successfully');
        return product;
    }

    updateProduct(id, productData) {
        const index = this.products.findIndex(p => p.id === id);
        if (index !== -1) {
            this.products[index] = {
                ...this.products[index],
                name: productData.name.trim(),
                category: productData.category.trim(),
                quantity: parseInt(productData.quantity),
                price: parseFloat(productData.price),
                minStockLevel: parseInt(productData.minStockLevel) || 5,
                lastUpdated: new Date().toISOString()
            };
            this.saveProducts();
            this.addHistory('update', this.products[index]);
            this.updateDashboard();
            this.showToast('Product updated successfully');
        }
    }

    deleteProduct(id) {
        const product = this.products.find(p => p.id === id);
        this.products = this.products.filter(p => p.id !== id);
        this.saveProducts();
        if (product) this.addHistory('delete', product);
        this.updateDashboard();
        this.showToast('Product deleted');
    }

    updateQuantity(id, newQuantity) {
        const product = this.products.find(p => p.id === id);
        if (product) {
            product.quantity = parseInt(newQuantity);
            product.lastUpdated = new Date().toISOString();
            this.saveProducts();
            this.addHistory('quantity', product);
            this.updateDashboard();
        }
    }

    // Event Listeners
    setupEventListeners() {
        console.log('Setting up event listeners...');

        // Welcome page events
        const loginBtn = document.getElementById('loginBtn');
        const signupBtn = document.getElementById('signupBtn');
        const getStartedBtn = document.getElementById('getStartedBtn');

        console.log('Found buttons:', { loginBtn, signupBtn, getStartedBtn });

        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                console.log('Login button clicked');
                this.openModal('loginModal');
            });
        }
        if (signupBtn) {
            signupBtn.addEventListener('click', () => {
                console.log('Signup button clicked');
                this.openModal('signupModal');
            });
        }
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', () => {
                console.log('Get started button clicked');
                this.openModal('signupModal');
            });
        }

        // Modal events
        this.setupModalEvents();

        // Dashboard events
        const addProductBtn = document.getElementById('addProductBtn');
        const exportCsvBtn = document.getElementById('exportCsvBtn');
        const settingsBtn = document.getElementById('settingsBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const logoutBtn2 = document.getElementById('logoutBtn2');
        const backToDashboard = document.getElementById('backToDashboard');
        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        const importCsvBtn = document.getElementById('importCsvBtn');
        const csvFileInput = document.getElementById('csvFileInput');
        const currencySelect = document.getElementById('currencySelect');
        const deleteAccountBtn = document.getElementById('deleteAccountBtn');

        if (addProductBtn) addProductBtn.addEventListener('click', () => this.openProductModal());
        if (exportCsvBtn) exportCsvBtn.addEventListener('click', () => this.exportToCsv());
        if (settingsBtn) settingsBtn.addEventListener('click', () => this.showSettings());
        if (logoutBtn) logoutBtn.addEventListener('click', () => this.logout());
        if (logoutBtn2) logoutBtn2.addEventListener('click', () => this.logout());
        if (backToDashboard) backToDashboard.addEventListener('click', () => this.showDashboard());
        if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        if (importCsvBtn && csvFileInput) {
            importCsvBtn.addEventListener('click', () => csvFileInput.click());
            csvFileInput.addEventListener('change', (e) => this.handleCsvImport(e));
        }
        if (currencySelect) {
            currencySelect.value = this.currency;
            currencySelect.addEventListener('change', (e) => {
                this.currency = e.target.value;
                localStorage.setItem('currency', this.currency);
                this.updateTable();
                this.updateSummaryCards();
                this.showToast(`Currency changed to ${this.currency}`);
            });
        }
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete your account? This action is irreversible.')) {
                    this.deleteCurrentAccount();
                }
            });
        }

        // Search and filter events
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const stockFilter = document.getElementById('stockFilter');

        if (searchInput) searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        if (categoryFilter) categoryFilter.addEventListener('change', (e) => this.handleCategoryFilter(e.target.value));
        if (stockFilter) stockFilter.addEventListener('change', (e) => this.handleStockFilter(e.target.value));

        // Sort events
        document.querySelectorAll('.sortable').forEach(th => {
            th.addEventListener('click', () => this.handleSort(th.dataset.sort));
        });

        // Settings form
        const profileForm = document.getElementById('profileForm');
        const exportAllData = document.getElementById('exportAllData');
        const resetAllData = document.getElementById('resetAllData');

        if (profileForm) profileForm.addEventListener('submit', (e) => this.saveUserSettings(e));
        if (exportAllData) exportAllData.addEventListener('click', () => this.exportToCsv());
        if (resetAllData) resetAllData.addEventListener('click', () => this.resetAllData());
    }

    setupModalEvents() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                // Only close modal if login succeeds
                if (this.login(email, password)) {
                    this.closeModal('loginModal');
                }
            });
        }

        // Signup form
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = {
                    companyName: document.getElementById('signupCompanyName').value,
                    companyType: document.getElementById('signupCompanyType').value,
                    firstName: document.getElementById('signupFirstName').value,
                    lastName: document.getElementById('signupLastName').value,
                    email: document.getElementById('signupEmail').value,
                    password: document.getElementById('signupPassword').value
                };
                // Ne fermer la modale que si l'inscription réussit
                if (this.signup(formData)) {
                    this.closeModal('signupModal');
                }
            });
        }

        // Product form
        const productForm = document.getElementById('productForm');
        if (productForm) {
            productForm.addEventListener('submit', (e) => this.handleProductSubmit(e));
        }

        // Modal close events
        document.querySelectorAll('.close-btn, .btn-secondary').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });

        // Modal overlay close
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) this.closeAllModals();
            });
        });

        // Switch between login/signup
        const switchToSignup = document.getElementById('switchToSignup');
        const switchToLogin = document.getElementById('switchToLogin');

        if (switchToSignup) {
            switchToSignup.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeModal('loginModal');
                this.openModal('signupModal');
            });
        }

        if (switchToLogin) {
            switchToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeModal('signupModal');
                this.openModal('loginModal');
            });
        }
    }

    // Modal Management
    openModal(modalId) {
        console.log('Opening modal:', modalId);
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            console.log('Modal opened successfully');
        } else {
            console.error('Modal not found:', modalId);
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');

        // Clear form fields when closing
        const forms = modal.querySelectorAll('form');
        forms.forEach(form => {
            form.reset();
            // Effacer aussi les messages d'erreur
            const errorMessages = form.querySelectorAll('.error-message');
            errorMessages.forEach(error => {
                error.textContent = '';
                error.style.display = 'none';
            });
        });
    }

    closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.remove('active');

            // Clear form fields when closing
            const forms = modal.querySelectorAll('form');
            forms.forEach(form => {
                form.reset();
                // Effacer aussi les messages d'erreur
                const errorMessages = form.querySelectorAll('.error-message');
                errorMessages.forEach(error => {
                    error.textContent = '';
                    error.style.display = 'none';
                });
            });
        });
    }

    // Dashboard Updates
    updateDashboard() {
        this.updateSummaryCards();
        this.updateCharts();
        this.updateTable();
        this.updateFilters();
        this.updateHistoryList();
    }

    updateSummaryCards() {
        const totalProducts = this.products.length;
        const criticalStock = this.products.filter(p => p.quantity <= 5).length;
        const lowStockItems = this.products.filter(p => p.quantity <= 20 && p.quantity > 5).length;
        const categories = [...new Set(this.products.map(p => p.category))].length;

        document.getElementById('totalProducts').textContent = totalProducts;
        document.getElementById('criticalStock').textContent = criticalStock;
        document.getElementById('lowStockItems').textContent = lowStockItems;
        document.getElementById('totalCategories').textContent = categories;
    }

    // Charts
    initializeCharts() {
        this.initCategoryChart();
        this.initStockChart();
        this.initStockStatusChart();
        this.initTrendChart();
    }

    initCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        if (this.charts.categoryChart) {
            this.charts.categoryChart.destroy();
        }

        this.charts.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: [], datasets: [{ data: [], backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'] }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });
    }

    initStockChart() {
        const ctx = document.getElementById('stockChart');
        if (!ctx) return;

        if (this.charts.stockChart) {
            this.charts.stockChart.destroy();
        }

        this.charts.stockChart = new Chart(ctx, {
            type: 'bar',
            data: { labels: [], datasets: [{ label: 'Quantity', data: [], backgroundColor: '#667eea' }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    initStockStatusChart() {
        const ctx = document.getElementById('stockStatusChart');
        if (!ctx) return;

        if (this.charts.stockStatusChart) {
            this.charts.stockStatusChart.destroy();
        }

        this.charts.stockStatusChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Normal', 'Faible', 'Critique'],
                datasets: [{ data: [0, 0, 0], backgroundColor: ['#28a745', '#ffc107', '#dc3545'] }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    initTrendChart() {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;

        if (this.charts.trendChart) {
            this.charts.trendChart.destroy();
        }

        this.charts.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
                datasets: [{ label: 'Stock Total', data: [100, 120, 110, 140, 130, 160], borderColor: '#667eea', fill: false }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    updateCharts() {
        this.updateCategoryChart();
        this.updateStockChart();
        this.updateStockStatusChart();
        this.updateTrendChart(); // Ajout de la mise à jour dynamique du trendChart
    }

    updateTrendChart() {
        if (!this.charts.trendChart) return;

        // Préparer les labels des mois (Jan à Déc)
        const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        const stockByMonth = Array(12).fill(0);
        const now = new Date();
        const currentYear = now.getFullYear();

        // For each product, add its quantity to the month of its last update if it's this year
        this.products.forEach(product => {
            if (product.lastUpdated) {
                const d = new Date(product.lastUpdated);
                if (d.getFullYear() === currentYear) {
                    stockByMonth[d.getMonth()] += product.quantity;
                }
            }
        });

        // If no product for a month, keep 0
        this.charts.trendChart.data.labels = monthLabels;
        this.charts.trendChart.data.datasets[0].data = stockByMonth;
        this.charts.trendChart.update();
    }

    updateCategoryChart() {
        if (!this.charts.categoryChart) return;

        const categoryData = {};
        this.products.forEach(product => {
            categoryData[product.category] = (categoryData[product.category] || 0) + 1;
        });

        this.charts.categoryChart.data.labels = Object.keys(categoryData);
        this.charts.categoryChart.data.datasets[0].data = Object.values(categoryData);
        this.charts.categoryChart.update();
    }

    updateStockChart() {
        if (!this.charts.stockChart) return;

        const topProducts = this.products.slice(0, 10);
        this.charts.stockChart.data.labels = topProducts.map(p => p.name);
        this.charts.stockChart.data.datasets[0].data = topProducts.map(p => p.quantity);
        this.charts.stockChart.update();
    }

    updateStockStatusChart() {
        if (!this.charts.stockStatusChart) return;

        const normal = this.products.filter(p => p.quantity > 20).length;
        const low = this.products.filter(p => p.quantity <= 20 && p.quantity > 5).length;
        const critical = this.products.filter(p => p.quantity <= 5).length;

        this.charts.stockStatusChart.data.datasets[0].data = [normal, low, critical];
        this.charts.stockStatusChart.update();
    }

    // Table Management
    updateTable() {
        const tbody = document.getElementById('productsTableBody');
        if (!tbody) return;

        const filteredProducts = this.getFilteredProducts();
        const sortedProducts = this.getSortedProducts(filteredProducts);

        tbody.innerHTML = sortedProducts.map(product => `
            <tr>
                <td>${this.escapeHtml(product.name)}</td>
                <td><span class="category-tag">${this.escapeHtml(product.category)}</span></td>
                <td>
                    <div class="quantity-cell">
                        <button class="adjust-btn" onclick="stockManager.adjustQuantity('${product.id}', -1)">
                            <i data-feather="minus"></i>
                        </button>
                        <span class="quantity-value">${product.quantity}</span>
                        <button class="adjust-btn" onclick="stockManager.adjustQuantity('${product.id}', 1)">
                            <i data-feather="plus"></i>
                        </button>
                    </div>
                </td>
                <td><span class="product-price">${this.formatPrice(product.price || 0)}</span></td>
                <td>
                    <span class="stock-level ${this.getStockLevel(product)}">
                        ${this.getStockLevel(product) === 'critical' ? 'Critique' :
                this.getStockLevel(product) === 'low' ? 'Faible' : 'Normal'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action edit" onclick="stockManager.openProductModal('${product.id}')">
                            <i data-feather="edit-2"></i>
                        </button>
                        <button class="btn-action delete" onclick="stockManager.deleteProduct('${product.id}')">
                            <i data-feather="trash-2"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        feather.replace();
    }

    getStockLevel(product) {
        if (product.quantity <= 5) return 'critical';
        if (product.quantity <= 20) return 'low';
        return 'normal';
    }

    getFilteredProducts() {
        return this.products.filter(product => {
            const matchesSearch = !this.filters.search ||
                product.name.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                product.category.toLowerCase().includes(this.filters.search.toLowerCase());

            const matchesCategory = !this.filters.category || product.category === this.filters.category;
            const matchesStock = this.matchesStockFilter(product, this.filters.stock);

            return matchesSearch && matchesCategory && matchesStock;
        });
    }

    matchesStockFilter(product, filter) {
        if (!filter) return true;
        switch (filter) {
            case 'critical': return product.quantity <= 5;
            case 'low': return product.quantity <= 20 && product.quantity > 5;
            case 'normal': return product.quantity > 20;
            default: return true;
        }
    }

    getSortedProducts(products) {
        return [...products].sort((a, b) => {
            const aVal = a[this.sortConfig.field];
            const bVal = b[this.sortConfig.field];

            if (this.sortConfig.direction === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    }

    updateFilters() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter) return;

        const categories = [...new Set(this.products.map(p => p.category))];
        const currentValue = categoryFilter.value;

        categoryFilter.innerHTML = '<option value="">All Categories</option>' +
            categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');

        if (categories.includes(currentValue)) {
            categoryFilter.value = currentValue;
        }
    }

    // Filter and Search Handlers
    handleSearch(value) {
        this.filters.search = value;
        this.updateTable();
    }

    handleCategoryFilter(value) {
        this.filters.category = value;
        this.updateTable();
    }

    handleStockFilter(value) {
        this.filters.stock = value;
        this.updateTable();
    }

    handleSort(field) {
        if (this.sortConfig.field === field) {
            this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortConfig.field = field;
            this.sortConfig.direction = 'asc';
        }
        this.updateTable();
        this.updateSortIcons();
    }

    updateSortIcons() {
        document.querySelectorAll('.sortable i').forEach(icon => {
            icon.setAttribute('data-feather', 'chevron-up');
        });

        const currentHeader = document.querySelector(`[data-sort="${this.sortConfig.field}"] i`);
        if (currentHeader) {
            currentHeader.setAttribute('data-feather',
                this.sortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down');
        }

        feather.replace();
    }

    adjustQuantity(id, delta) {
        const product = this.products.find(p => p.id === id);
        if (product) {
            const newQuantity = Math.max(0, product.quantity + delta);
            this.updateQuantity(id, newQuantity);
        }
    }

    // Product Modal Management
    openProductModal(id = null) {
        this.currentEditId = id;
        const modal = document.getElementById('productModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('productForm');

        if (id) {
            const product = this.products.find(p => p.id === id);
            if (product) {
                title.textContent = 'Edit Product';
                document.getElementById('productName').value = product.name;
                document.getElementById('productCategory').value = product.category;
                document.getElementById('productQuantity').value = product.quantity;
                document.getElementById('minStockLevel').value = product.minStockLevel;
                document.getElementById('productPrice').value = product.price;
            }
        } else {
            title.textContent = 'Add Product';
            form.reset();
        }

        this.openModal('productModal');
    }

    handleProductSubmit(e) {
        e.preventDefault();

        const productData = {
            name: document.getElementById('productName').value,
            category: document.getElementById('productCategory').value,
            quantity: document.getElementById('productQuantity').value,
            minStockLevel: document.getElementById('minStockLevel').value,
            price: document.getElementById('productPrice').value
        };

        if (this.validateProductForm(productData)) {
            if (this.currentEditId) {
                this.updateProduct(this.currentEditId, productData);
            } else {
                this.addProduct(productData);
            }
            this.closeModal('productModal');
            this.currentEditId = null;
        }
    }

    validateProductForm(data) {
        this.clearFormErrors();
        let isValid = true;

        if (!data.name.trim()) {
            this.showFormError('nameError', 'Name is required');
            isValid = false;
        }

        if (!data.category.trim()) {
            this.showFormError('categoryError', 'Category is required');
            isValid = false;
        }

        if (!data.quantity || parseInt(data.quantity) < 0) {
            this.showFormError('quantityError', 'Invalid quantity');
            isValid = false;
        }

        if (!data.price || parseFloat(data.price) < 0) {
            this.showFormError('priceError', 'Invalid price');
            isValid = false;
        }

        return isValid;
    }

    showFormError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    clearFormErrors() {
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
    }

    // Settings Management
    loadUserSettings() {
        if (this.userSession) {
            document.getElementById('firstName').value = this.userSession.firstName || '';
            document.getElementById('lastName').value = this.userSession.lastName || '';
            document.getElementById('companyName').value = this.userSession.company || '';
            document.getElementById('companyType').value = this.userSession.companyType || 'retail';
        }
    }

    saveUserSettings(e) {
        e.preventDefault();

        if (this.userSession) {
            this.userSession.firstName = document.getElementById('firstName').value;
            this.userSession.lastName = document.getElementById('lastName').value;
            this.userSession.company = document.getElementById('companyName').value;
            this.userSession.companyType = document.getElementById('companyType').value;

            localStorage.setItem('userSession', JSON.stringify(this.userSession));
            this.showToast('Settings saved');
            this.updateHeaderInfo();
        }
    }

    resetAllData() {
        if (confirm('Are you sure you want to reset all your data? This will delete all your products and history but keep your account.')) {
            if (this.userSession) {
                const productsKey = this.getUserKey('stockProducts');
                const historyKey = this.getUserKey('stockHistory');
                if (productsKey) localStorage.removeItem(productsKey);
                if (historyKey) localStorage.removeItem(historyKey);
                this.products = [];
                this.history = [];
                this.updateDashboard();
                this.updateHistoryList();
                this.showToast('Your data has been reset successfully');
            } else {
                this.showToast('No user session found', 'error');
            }
        }
    }

    // Export functionality
    exportToCsv() {
        if (this.products.length === 0) {
            this.showToast('No data to export', 'warning');
            return;
        }

        const headers = ['Name', 'Category', 'Quantity', 'Price', 'Minimum Stock', 'Last Updated'];
        const csvContent = [
            headers.join(','),
            ...this.products.map(product => [
                `"${product.name}"`,
                `"${product.category}"`,
                product.quantity,
                product.price,
                product.minStockLevel,
                `"${new Date(product.lastUpdated).toLocaleDateString()}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `stock_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showToast('Export successful');
    }

    // Utility functions
    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i data-feather="${type === 'success' ? 'check-circle' : type === 'warning' ? 'alert-triangle' : 'x-circle'}"></i>
                <span>${message}</span>
                <button class="toast-close" aria-label="Close notification">&times;</button>
            </div>
        `;

        container.appendChild(toast);
        feather.replace();

        // Close on click of the cross
        toast.querySelector('.toast-close').addEventListener('click', () => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        });

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    escapeHtml(text) {
        return text.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]);
    }

    clearHistory() {
        if (confirm('Clear all history?')) {
            this.history = [];
            this.saveHistory();
            this.updateHistoryList();
            this.showToast('History cleared');
        }
    }

    handleCsvImport(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            this.parseAndImportCsv(text);
        };
        reader.readAsText(file);
    }

    parseAndImportCsv(text) {
        // We assume the CSV has columns: Name,Category,Quantity,Minimum Stock,Price
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length < 2) {
            this.showToast('Empty or invalid CSV file', 'error');
            return;
        }
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const nameIdx = headers.indexOf('name');
        const catIdx = headers.indexOf('category');
        const qtyIdx = headers.indexOf('quantity');
        const minIdx = headers.indexOf('minimum stock');
        const priceIdx = headers.indexOf('price');
        if (nameIdx === -1 || catIdx === -1 || qtyIdx === -1) {
            this.showToast('Missing CSV columns (Name, Category, Quantity)', 'error');
            return;
        }
        let count = 0;
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',');
            if (cols.length < 3) continue;
            const productData = {
                name: cols[nameIdx],
                category: cols[catIdx],
                quantity: cols[qtyIdx],
                minStockLevel: minIdx !== -1 ? cols[minIdx] : 5,
                price: priceIdx !== -1 ? cols[priceIdx] : 0
            };
            this.addProduct(productData);
            count++;
        }
        if (count > 0) {
            this.showToast(`${count} products imported from CSV`);
        } else {
            this.showToast('No products imported', 'warning');
        }
    }

    deleteCurrentAccount() {
        if (!this.userSession || !this.userSession.email) return;
        // Remove user from the list
        let users = this.getAllUsers();
        users = users.filter(u => u.email !== this.userSession.email);
        this.saveAllUsers(users);
        // Remove user-related data
        const productsKey = this.getUserKey('stockProducts');
        const historyKey = this.getUserKey('stockHistory');
        if (productsKey) localStorage.removeItem(productsKey);
        if (historyKey) localStorage.removeItem(historyKey);
        // Remove session
        localStorage.removeItem('userSession');
        this.userSession = null;
        this.products = [];
        this.history = [];
        this.showWelcome();
        this.showToast('Your account has been deleted.');
    }
}

// Initialize the application
let stockManager;
document.addEventListener('DOMContentLoaded', () => {
    stockManager = new StockManager();
});

// Add some keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + N to add new product
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (stockManager) stockManager.openProductModal();
    }

    // Escape to close modals
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-overlay.active');
        if (activeModal) {
            if (activeModal.id === 'productModal') {
                if (stockManager) stockManager.closeProductModal();
            } else if (activeModal.id === 'quickEditModal') {
                if (stockManager) stockManager.closeQuickEditModal();
            }
        }
    }
});

// Handle window resize for charts
window.addEventListener('resize', () => {
    if (stockManager && stockManager.charts) {
        Object.values(stockManager.charts).forEach(chart => {
            if (chart) chart.resize();
        });
    }
});

// Auto-save when page is about to unload
window.addEventListener('beforeunload', () => {
    if (stockManager) stockManager.saveProducts();
});

// Animations and Interactive Elements for StockPro

// Counter Animation
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString();
    }, 16);
}

// Initialize animations when page loads
document.addEventListener('DOMContentLoaded', function () {
    // Animate counters
    const counters = document.querySelectorAll('.counter-number');
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        animateCounter(counter, target);
    });

    // Add hover effects to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Add click ripple effect to buttons
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
    buttons.forEach(button => {
        button.addEventListener('click', function (e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');

            this.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Parallax effect for floating shapes
    document.addEventListener('mousemove', function (e) {
        const shapes = document.querySelectorAll('.shape');
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;

        shapes.forEach((shape, index) => {
            const speed = (index + 1) * 0.5;
            const xPos = (x - 0.5) * speed * 50;
            const yPos = (y - 0.5) * speed * 50;

            shape.style.transform = `translate(${xPos}px, ${yPos}px)`;
        });
    });

    // Smooth scroll for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add loading animation
    const welcomePage = document.getElementById('welcomePage');
    if (welcomePage) {
        welcomePage.style.opacity = '0';
        welcomePage.style.transform = 'translateY(20px)';

        setTimeout(() => {
            welcomePage.style.transition = 'all 1s ease-out';
            welcomePage.style.opacity = '1';
            welcomePage.style.transform = 'translateY(0)';
        }, 100);
    }
});

// Add CSS for ripple effect
const animationStyle = document.createElement('style');
animationStyle.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: rippleEffect 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes rippleEffect {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .btn-primary, .btn-secondary {
        position: relative;
        overflow: hidden;
    }
`;
document.head.appendChild(animationStyle);