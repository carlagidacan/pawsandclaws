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
        const response = await fetch('/api/appointments/all', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        console.log('Fetched appointments:', data);

        window.appointments = Array.isArray(data) ? data : (data.appointments || []);
        displayAppointments(window.appointments);
    } catch (error) {
        console.error('Failed to fetch appointments:', error);
        showError('Failed to load appointments. Please try again later.');
        displayAppointments([]);
    }
}

function displayAppointments(appointments) {
    const tbody = document.getElementById('appointmentsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!appointments || appointments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No appointments found</td></tr>';
        return;
    }

    tbody.innerHTML = appointments.map(apt => {
        console.log('Processing appointment:', apt);

        const clientName = apt.client;
        const petName = apt.pet;

        return `
            <tr>
                <td>
                    <div class="fw-bold">${apt.dateTime ? new Date(apt.dateTime).toLocaleDateString() : 'Date not specified'}</div>
                    <div class="text-muted">${apt.dateTime ? new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Time not specified'}</div>
                </td>
                <td>${clientName}</td>
                <td>${petName}</td>
                <td>${apt.service || 'N/A'}</td>
                <td><span class="badge ${getStatusBadgeClass(apt.status)}">${apt.status || 'pending'}</span></td>
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
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
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
    if (!appointmentId) {
        console.error('No appointment ID provided');
        return;
    }

    // Update the API endpoint to match your backend route
    fetch(`/api/appointments/update-status/${appointmentId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ 
            status: newStatus,
            appointmentId: appointmentId 
        })
    })
    .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
    })
    .then(data => {
        if (data.success) {
            fetchAppointments();
        } else {
            showError(data.message || 'Failed to update appointment status');
        }
    })
    .catch(err => {
        console.error('Error updating status:', err);
        showError('Failed to update appointment status');
    });
}

function deleteAppointment(id) {
    if (!id || !confirm('Are you sure you want to delete this appointment?')) return;

    fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
    })
    .then(data => {
        if (data.success) {
            fetchAppointments(); // Refresh the list instead of full page reload
        } else {
            showError(data.message || 'Failed to delete appointment');
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

document.addEventListener('DOMContentLoaded', () => {
    fetchAppointments();
    setupNewAppointmentModal();
});

async function setupNewAppointmentModal() {
    const modal = document.getElementById('newAppointmentModal');
    if (!modal) return;

    modal.addEventListener('show.bs.modal', async () => {
        await populateClients();
    });

    // Add client change handler to load their pets
    document.getElementById('clientSelect')?.addEventListener('change', function() {
        populatePets(this.value);
    });
}

async function populateClients() {
    try {
        const response = await fetch('/api/appointments/get-clients', {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch clients');
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'Failed to load clients');
        }
        
        const select = document.getElementById('clientSelect');
        select.innerHTML = '<option value="" selected disabled>Select client</option>';
        
        data.clients.forEach(client => {
            select.innerHTML += `<option value="${client._id}">${client.firstName} ${client.lastName}</option>`;
        });
    } catch (error) {
        console.error('Error loading clients:', error);
        showError('Failed to load clients');
    }
}

async function populatePets(clientId) {
    try {
        const response = await fetch(`/api/appointments/get-pets/${clientId}`, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch pets');
        }

        const data = await response.json();
        console.log('Pets data received:', data); // Debug log

        const select = document.getElementById('petSelect');
        select.innerHTML = '<option value="" selected disabled>Select pet</option>';
        
        if (data.success && data.pets) {
            data.pets.forEach(pet => {
                select.innerHTML += `<option value="${pet._id}">${pet.name} (${pet.type})</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading pets:', error);
        showError('Failed to load pets');
    }
}

async function createAppointment() {
    const form = document.getElementById('newAppointmentForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const appointmentData = {
        dateTime: `${document.getElementById('appointmentDate').value}T${document.getElementById('appointmentTime').value}`,
        client: document.getElementById('clientSelect').value,
        pet: document.getElementById('petSelect').value,
        service: document.getElementById('serviceSelect').value,
        status: 'pending',
        notes: document.getElementById('appointmentNotes').value || ''
    };

    try {
        const response = await fetch('/api/appointments/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(appointmentData)
        });

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to create appointment');
        }

        const modal = bootstrap.Modal.getInstance(document.getElementById('newAppointmentModal'));
        modal.hide();
        form.reset();
        fetchAppointments();
        showSuccess('Appointment created successfully');
    } catch (error) {
        console.error('Error creating appointment:', error);
        showError(error.message || 'Failed to create appointment');
    }
}
