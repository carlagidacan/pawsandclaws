// Fetch and process dashboard data
async function fetchDashboardData() {
    try {
        // Get admin token from localStorage
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken) {
            window.location.href = 'admin_login.html';
            return;
        }

        // Fetch appointments with proper headers
        const [appointmentsResponse, ordersResponse] = await Promise.all([
            fetch('/api/appointments/all', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                credentials: 'include'
            }),
            fetch('/api/orders/recent', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                credentials: 'include'
            })
        ]);

        if (!appointmentsResponse.ok || !ordersResponse.ok) {
            throw new Error('One or more network responses were not ok');
        }

        const appointmentsData = await appointmentsResponse.json();
        const orders = await ordersResponse.json();

        // Extract appointments array from response
        const appointments = Array.isArray(appointmentsData) ? appointmentsData : (appointmentsData.appointments || []);
        
        console.log('Fetched appointments:', appointments);
        console.log('Orders:', orders);

        // Update UI with appointment data
        updateDashboardStats(calculateDashboardStats(appointments, orders));
        displayUpcomingAppointments(appointments);
        displayRecentOrders(orders);
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to load dashboard data');
        updateDashboardStats({});
        displayUpcomingAppointments([]);
        displayRecentOrders([]);
    }
}

function calculateDashboardStats(appointments, orders) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Count today's appointments
    const todayAppointments = appointments.length; // All appointments are for today or future

    // Count pending orders
    const pendingOrders = orders.filter(order => 
        order.status.toLowerCase() === 'pending'
    ).length;

    // Calculate total revenue from recent orders
    const revenue = orders.reduce((total, order) => {
        const amount = parseFloat(order.total.replace('₱', '').replace(',', ''));
        return total + (isNaN(amount) ? 0 : amount);
    }, 0);

    // Calculate new clients (unique customers in recent orders)
    const uniqueClients = new Set(orders.map(order => order.customer)).size;

    return {
        todayAppointments,
        pendingOrders,
        newClients: uniqueClients,
        revenue
    };
}

function updateDashboardStats(stats) {
    document.querySelector('.card h3').textContent = stats.todayAppointments || '0';
    document.querySelectorAll('.card h3')[1].textContent = stats.pendingOrders || '0';
    document.querySelectorAll('.card h3')[2].textContent = stats.newClients || '0';
    document.querySelectorAll('.card h3')[3].textContent = `₱${(stats.revenue || 0).toFixed(2)}`;
}

function displayUpcomingAppointments(appointments) {
    const tbody = document.querySelector('.col-lg-6:first-of-type tbody');
    if (!tbody) return;

    if (!appointments || appointments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No upcoming appointments</td></tr>';
        return;
    }

    tbody.innerHTML = appointments.map(appt => {
        // Keep original client and pet data
        const clientName = appt.client;
        const petInfo = appt.pet;

        // Parse the datetime
        let timeString = 'No time set';
        if (appt.dateTime) {
            try {
                const datetime = new Date(appt.dateTime);
                if (!isNaN(datetime)) {
                    timeString = datetime.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    });
                }
            } catch (e) {
                console.error('Error parsing date:', e);
            }
        }

        return `
            <tr>
                <td>${timeString}</td>
                <td>${clientName || 'Unknown Client'}</td>
                <td>${petInfo || 'Unknown Pet'}</td>
                <td>${appt.service || 'Not specified'}</td>
                <td><span class="badge ${appt.status === 'pending' ? 'bg-warning text-dark' : `bg-${getStatusBadgeClass(appt.status)}`}">${appt.status || 'pending'}</span></td>
            </tr>
        `;
    }).join('');
}

function displayRecentOrders(orders) {
    const tbody = document.querySelector('.col-lg-6:last-of-type tbody');
    if (!tbody) return;
    
    tbody.innerHTML = orders.length ? orders.map(order => `
        <tr>
            <td>${order.orderNumber}</td>
            <td>${order.customer}</td>
            <td>${order.items}</td>
            <td>₱${parseFloat(order.total).toFixed(2)}</td>
            <td><span class="badge bg-${getOrderStatusColor(order.status)}">${order.status}</span></td>
        </tr>
    `).join('') : '<tr><td colspan="5" class="text-center">No recent orders</td></tr>';
}

function formatTime(time) {
    if (!time) return 'N/A';
    return new Date(time).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

function getStatusBadgeClass(status) {
    switch(status) {
        case 'confirmed': return 'success';
        case 'completed': return 'info';
        case 'cancelled': return 'danger';
        case 'pending': return 'warning';
        default: return 'secondary';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function getOrderStatusColor(status) {
    switch(status?.toLowerCase()) {
        case 'delivered':
        case 'shipped': return 'success';
        case 'processing': return 'info';
        case 'pending': return 'warning';
        case 'cancelled': return 'danger';
        default: return 'secondary';
    }
}

function showError(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger alert-dismissible fade show mb-3';
    alert.innerHTML = `
        <i class="fas fa-exclamation-circle me-2"></i>${escapeHtml(message)}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector('.container-fluid').insertAdjacentElement('afterbegin', alert);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

function removeTableBorders() {
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        table.classList.add('table-borderless');
        const cells = table.querySelectorAll('th, td');
        cells.forEach(cell => {
            cell.style.borderBottom = '1px solid #f5f5f5';
        });
    });
}

// Add logout handler
function handleLogout() {
    // Clear all stored data
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('adminData');
    
    // Redirect to admin login page
    window.location.href = 'admin_login.html';
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardData();
    removeTableBorders();
    
    // Set up logout handler
    const logoutBtn = document.querySelector('[onclick="handleLogout()"]');
    if (logoutBtn) {
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            handleLogout();
        };
    }
});
