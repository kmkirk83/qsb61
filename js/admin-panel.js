/**
 * Admin Panel Controller
 * Comprehensive admin dashboard for user management and analytics
 */

class AdminPanel {
    constructor() {
        this.currentView = 'dashboard';
        this.users = [];
        this.analytics = {};
        this.init();
    }

    init() {
        if (!this.checkAdminAccess()) {
            window.location.href = '/index.html';
            return;
        }

        this.loadDashboardData();
        this.setupEventListeners();
        this.startAutoRefresh();
    }

    checkAdminAccess() {
        return authManager.isAuthenticated() && authManager.isAdmin();
    }

    setupEventListeners() {
        // View switching
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.getAttribute('data-view');
                this.switchView(view);
            });
        });

        // User management actions
        document.getElementById('createUserBtn')?.addEventListener('click', () => this.showCreateUserModal());
        document.getElementById('exportUsersBtn')?.addEventListener('click', () => this.exportUsers());
        document.getElementById('searchUsers')?.addEventListener('input', (e) => this.searchUsers(e.target.value));
    }

    async loadDashboardData() {
        try {
            await this.loadUsers();
            await this.loadAnalytics();
            this.updateDashboard();
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    }

    async loadUsers() {
        this.users = authManager.getUsers();
        this.displayUsers();
    }

    async loadAnalytics() {
        this.analytics = {
            totalUsers: this.users.length,
            activeUsers: this.users.filter(u => u.isActive).length,
            freeUsers: this.users.filter(u => u.tier === 'free').length,
            proUsers: this.users.filter(u => u.tier === 'pro').length,
            enterpriseUsers: this.users.filter(u => u.tier === 'enterprise').length,
            totalRevenue: this.calculateTotalRevenue(),
            monthlyRevenue: this.calculateMonthlyRevenue()
        };
    }

    calculateTotalRevenue() {
        const proRevenue = this.analytics?.proUsers * 29.99 || 0;
        const enterpriseRevenue = this.analytics?.enterpriseUsers * 99.99 || 0;
        return proRevenue + enterpriseRevenue;
    }

    calculateMonthlyRevenue() {
        return this.calculateTotalRevenue(); // Same for now
    }

    updateDashboard() {
        // Update stats cards
        document.getElementById('totalUsersCount')?.textContent = this.analytics.totalUsers;
        document.getElementById('activeUsersCount')?.textContent = this.analytics.activeUsers;
        document.getElementById('totalRevenueCount')?.textContent = `$${this.analytics.totalRevenue.toFixed(2)}`;
        document.getElementById('monthlyRevenueCount')?.textContent = `$${this.analytics.monthlyRevenue.toFixed(2)}`;
        
        // Update charts
        this.updateCharts();
    }

    displayUsers(filteredUsers = null) {
        const users = filteredUsers || this.users;
        const container = document.getElementById('usersTable');
        if (!container) return;

        if (users.length === 0) {
            container.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">No users found</td></tr>';
            return;
        }

        container.innerHTML = users.map(user => `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm">${user.email}</td>
                <td class="px-4 py-3 text-sm">${user.name || 'N/A'}</td>
                <td class="px-4 py-3 text-sm">
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${this.getTierBadgeClass(user.tier)}">
                        ${user.tier.toUpperCase()}
                    </span>
                </td>
                <td class="px-4 py-3 text-sm">
                    <span class="px-2 py-1 rounded-full text-xs ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${user.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="px-4 py-3 text-sm">${new Date(user.createdAt).toLocaleDateString()}</td>
                <td class="px-4 py-3 text-sm">
                    <button onclick="adminPanel.editUser('${user.id}')" class="text-blue-600 hover:text-blue-800 mr-2">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="adminPanel.toggleUserStatus('${user.id}')" class="text-yellow-600 hover:text-yellow-800 mr-2">
                        <i class="fas fa-${user.isActive ? 'ban' : 'check-circle'}"></i>
                    </button>
                    <button onclick="adminPanel.deleteUser('${user.id}')" class="text-red-600 hover:text-red-800">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    getTierBadgeClass(tier) {
        const classes = {
            free: 'bg-gray-100 text-gray-800',
            pro: 'bg-blue-100 text-blue-800',
            enterprise: 'bg-purple-100 text-purple-800'
        };
        return classes[tier] || 'bg-gray-100 text-gray-800';
    }

    searchUsers(query) {
        if (!query) {
            this.displayUsers();
            return;
        }

        const filtered = this.users.filter(user => 
            user.email.toLowerCase().includes(query.toLowerCase()) ||
            (user.name && user.name.toLowerCase().includes(query.toLowerCase()))
        );

        this.displayUsers(filtered);
    }

    showCreateUserModal() {
        const modalHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="createUserModal">
                <div class="bg-white rounded-lg p-6 max-w-md w-full">
                    <h3 class="text-xl font-bold mb-4">Create New User</h3>
                    <form id="createUserForm">
                        <div class="mb-4">
                            <label class="block text-sm font-medium mb-1">Email</label>
                            <input type="email" name="email" required class="w-full px-3 py-2 border rounded-lg">
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium mb-1">Name</label>
                            <input type="text" name="name" required class="w-full px-3 py-2 border rounded-lg">
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium mb-1">Password</label>
                            <input type="password" name="password" required class="w-full px-3 py-2 border rounded-lg">
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium mb-1">Tier</label>
                            <select name="tier" class="w-full px-3 py-2 border rounded-lg">
                                <option value="free">Free</option>
                                <option value="pro">Pro</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                        </div>
                        <div class="flex space-x-3">
                            <button type="submit" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg">Create</button>
                            <button type="button" onclick="document.getElementById('createUserModal').remove()" 
                                    class="flex-1 bg-gray-300 px-4 py-2 rounded-lg">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        document.getElementById('createUserForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const result = await authManager.register(
                formData.get('email'),
                formData.get('password'),
                formData.get('name')
            );

            if (result.success) {
                // Update tier if needed
                if (formData.get('tier') !== 'free') {
                    await authManager.updateUser(result.user.id, { tier: formData.get('tier') });
                }
                
                alert('User created successfully!');
                document.getElementById('createUserModal').remove();
                this.loadDashboardData();
            } else {
                alert('Failed to create user: ' + result.error);
            }
        });
    }

    async editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const newTier = prompt(`Change tier for ${user.email}:\nCurrent: ${user.tier}\n\nEnter new tier (free/pro/enterprise):`, user.tier);
        
        if (newTier && ['free', 'pro', 'enterprise'].includes(newTier)) {
            await authManager.updateUser(userId, { tier: newTier });
            alert('User updated successfully!');
            this.loadDashboardData();
        }
    }

    async toggleUserStatus(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const newStatus = !user.isActive;
        await authManager.updateUser(userId, { isActive: newStatus });
        alert(`User ${newStatus ? 'activated' : 'deactivated'} successfully!`);
        this.loadDashboardData();
    }

    async deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        const users = authManager.getUsers();
        const filteredUsers = users.filter(u => u.id !== userId);
        localStorage.setItem('quantumSparkUsers', JSON.stringify(filteredUsers));
        
        alert('User deleted successfully!');
        this.loadDashboardData();
    }

    exportUsers() {
        const csv = this.generateCSV();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    }

    generateCSV() {
        const headers = ['Email', 'Name', 'Tier', 'Status', 'Created At'];
        const rows = this.users.map(user => [
            user.email,
            user.name || '',
            user.tier,
            user.isActive ? 'Active' : 'Inactive',
            new Date(user.createdAt).toLocaleDateString()
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    updateCharts() {
        // Tier distribution chart
        const tierCanvas = document.getElementById('tierDistributionChart');
        if (tierCanvas) {
            new Chart(tierCanvas, {
                type: 'doughnut',
                data: {
                    labels: ['Free', 'Pro', 'Enterprise'],
                    datasets: [{
                        data: [
                            this.analytics.freeUsers,
                            this.analytics.proUsers,
                            this.analytics.enterpriseUsers
                        ],
                        backgroundColor: ['#9CA3AF', '#3B82F6', '#8B5CF6']
                    }]
                }
            });
        }

        // Revenue chart
        const revenueCanvas = document.getElementById('revenueChart');
        if (revenueCanvas) {
            new Chart(revenueCanvas, {
                type: 'bar',
                data: {
                    labels: ['This Month'],
                    datasets: [{
                        label: 'Revenue',
                        data: [this.analytics.monthlyRevenue],
                        backgroundColor: '#10B981'
                    }]
                },
                options: {
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }
    }

    switchView(view) {
        this.currentView = view;
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.classList.remove('border-blue-500', 'text-blue-600');
            btn.classList.add('border-transparent', 'text-gray-500');
        });
        document.querySelector(`[data-view="${view}"]`)?.classList.add('border-blue-500', 'text-blue-600');
        
        // Show/hide content sections
        document.querySelectorAll('[data-content]').forEach(section => {
            section.classList.add('hidden');
        });
        document.querySelector(`[data-content="${view}"]`)?.classList.remove('hidden');
    }

    startAutoRefresh() {
        // Refresh dashboard every 30 seconds
        setInterval(() => {
            this.loadDashboardData();
        }, 30000);
    }
}

// Initialize admin panel
let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});
