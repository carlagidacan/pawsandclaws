let currentDate = new Date();
window.appointments = [];

async function fetchAppointments() {
    const tbody = document.getElementById('appointmentsTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <div class="mt-2">Loading appointments...</div>
                </td>
            </tr>`;
    }

    try {
        const response = await fetch('/api/appointments', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'include' // Include cookies if using session authentication
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Fetched appointments:', data); // Debug log
        window.appointments = Array.isArray(data) ? data : (data.appointments || []);
        displayAppointments(window.appointments);
        updateCalendarView(window.appointments);

    } catch (error) {
        console.error('Failed to fetch appointments:', error);
        showError('Failed to load appointments. Please try again later.');
        displayAppointments([]); // Show empty state
        updateCalendarView([]);
    }
}

function displayAppointments(appointments) {
    const tbody = document.getElementById('appointmentsTableBody');
    if (!tbody) {
        console.error('Table body element not found');
        return;
    }

    // Clear loading spinner if it exists
    tbody.innerHTML = '';

    if (!appointments || appointments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <i class="fas fa-folder-open me-2"></i>No appointments found
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = appointments.map(apt => {
        const date = new Date(apt.dateTime);
        return `
            <tr>
                <td>
                    <div class="fw-bold">${formatDate(date)}</div>
                    <div class="text-muted">${formatTime(date)}</div>
                </td>
                <td>${apt.client?.firstName || ''} ${apt.client?.lastName || ''}</td>
                <td>${apt.pet?.name || 'Unknown'} (${apt.pet?.type || 'Pet'})</td>
                <td>${apt.service}</td>
                <td>${apt.veterinarian || 'Not assigned'}</td>
                <td><span class="badge ${getStatusBadgeClass(apt.status)}">${apt.status}</span></td>
                <td>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                            <i class="fas fa-ellipsis-h"></i>
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="#" onclick="updateStatus('${apt._id}', 'confirmed')">
                                <i class="fas fa-check me-2"></i>Confirm</a></li>
                            <li><a class="dropdown-item" href="#" onclick="updateStatus('${apt._id}', 'completed')">
                                <i class="fas fa-check-double me-2"></i>Complete</a></li>
                            <li><a class="dropdown-item" href="#" onclick="updateStatus('${apt._id}', 'cancelled')">
                                <i class="fas fa-times me-2"></i>Cancel</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="#" onclick="deleteAppointment('${apt._id}')">
                                <i class="fas fa-trash me-2"></i>Delete</a></li>
                        </ul>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function getStatusBadgeClass(status) {
    const classes = {
        pending: 'bg-warning',
        confirmed: 'bg-success',
        completed: 'bg-info',
        cancelled: 'bg-danger'
    };
    return classes[status?.toLowerCase()] || 'bg-secondary';
}

function updateStatus(appointmentId, newStatus) {
    fetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            location.reload();
        } else {
            showError('Failed to update appointment status');
        }
    })
    .catch(err => {
        console.error('Error updating status:', err);
        showError('Failed to update appointment status');
    });
}

function deleteAppointment(id) {
    if (!confirm('Are you sure you want to delete this appointment?')) return;

    fetch(`/api/appointments/${id}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            location.reload();
        } else {
            showError('Failed to delete appointment');
        }
    })
    .catch(err => {
        console.error('Error deleting appointment:', err);
        showError('Failed to delete appointment');
    });
}

function showError(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.innerHTML = `
        <i class="fas fa-exclamation-circle me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector('.container-fluid').insertBefore(alertDiv, document.querySelector('.container-fluid').firstChild);
}

function updateCalendarView(appointments) {
    const tbody = document.querySelector('.table-bordered tbody');
    if (!tbody) return;

    // Clear existing content
    tbody.innerHTML = '';

    // Group appointments by veterinarian
    const appointmentsByVet = {};
    appointments.forEach(apt => {
        const vet = apt.veterinarian || 'Not Assigned';
        if (!appointmentsByVet[vet]) {
            appointmentsByVet[vet] = [];
        }
        appointmentsByVet[vet].push(apt);
    });

    // Create rows for each veterinarian
    Object.keys(appointmentsByVet).forEach(vet => {
        const row = document.createElement('tr');
        row.innerHTML = `<td class="fw-bold">${vet}</td>` + generateTimeSlots(appointmentsByVet[vet]);
        tbody.appendChild(row);
    });
}

function generateTimeSlots(vetAppointments) {
    const timeSlots = ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00'];
    
    return timeSlots.map(time => {
        const appointment = vetAppointments.find(apt => {
            const aptTime = new Date(apt.dateTime).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: false 
            });
            return aptTime.startsWith(time);
        });

        if (appointment) {
            return `
                <td>
                    <div class="appointment-slot ${appointment.status.toLowerCase()}">
                        <strong>${appointment.pet?.name} (${appointment.pet?.type})</strong>
                        <div>${appointment.service}</div>
                        <small>${appointment.client?.firstName} ${appointment.client?.lastName}</small>
                    </div>
                </td>`;
        }

        return '<td></td>';
    }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    // Fetch real appointments data
    fetchAppointments();

    // Add filter handlers
    const statusFilter = document.querySelector('#statusFilter');
    const dateFilter = document.querySelector('#dateFilter');
    const vetFilter = document.querySelector('#vetFilter');
    const searchInput = document.querySelector('#searchInput');

    if (statusFilter) {
        statusFilter.addEventListener('change', filterAppointments);
    }

    if (dateFilter) {
        dateFilter.addEventListener('change', filterAppointments);
    }

    if (vetFilter) {
        vetFilter.addEventListener('change', filterAppointments);
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterAppointments);
    }
});

function filterAppointments() {
    if (!window.appointments) return;

    let filtered = [...window.appointments];

    // Apply status filter
    const status = document.querySelector('#statusFilter').value;
    if (status) {
        filtered = filtered.filter(apt => apt.status.toLowerCase() === status.toLowerCase());
    }

    // Apply date filter
    const date = document.querySelector('#dateFilter').value;
    if (date) {
        filtered = filtered.filter(apt => apt.dateTime.startsWith(date));
    }

    // Apply vet filter
    const vet = document.querySelector('#vetFilter').value;
    if (vet) {
        filtered = filtered.filter(apt => apt.veterinarian === vet);
    }

    // Apply search filter
    const search = document.querySelector('#searchInput').value.toLowerCase();
    if (search) {
        filtered = filtered.filter(apt => 
            apt.client?.firstName?.toLowerCase().includes(search) ||
            apt.client?.lastName?.toLowerCase().includes(search) ||
            apt.pet?.name?.toLowerCase().includes(search) ||
            apt.service?.toLowerCase().includes(search)
        );
    }

    displayAppointments(filtered);
    updateCalendarView(filtered);
}
