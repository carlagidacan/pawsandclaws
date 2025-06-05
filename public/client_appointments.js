document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'client_login.html'; // Adjust if needed
        return;
    }

    fetch('/api/appointments/user-appointments', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            renderAppointments(data.appointments);
        } else {
            console.error('Failed to fetch appointments:', data.message);
        }
    })
    .catch(err => {
        console.error('Error fetching appointments:', err);
    });
});

// Global variables to track current calendar month and loaded appointments
let currentDate = new Date();
window.appointments = [];

function renderAppointments(appointments) {
    window.appointments = appointments;
    const container = document.getElementById('upcoming-appointments');
    container.innerHTML = '';

    if (!appointments || appointments.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">You have no appointments scheduled.</p>';
        return;
    }

    appointments.forEach(appt => {
        const card = document.createElement('div');
        card.className = 'col-md-6';

        // Properly handle date parsing
        const date = new Date(appt.dateTime);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const formattedTime = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });        // Handle pet info
        const petInfo = appt.pet ? `${appt.pet.name} (${appt.pet.type})` : 'Not specified';

        card.innerHTML = `
            <div class="card shadow-sm appointment-card">
                <div class="card-body">
                    <h5>${formattedDate} @ ${formattedTime}</h5>
                    <p><strong>Pet:</strong> ${petInfo}</p>
                    <p><strong>Service:</strong> ${appt.service || 'Not specified'}</p>
                    <p><strong>Status:</strong> <span class="badge bg-${getStatusColor(appt.status)}">${appt.status}</span></p>
                    <p><strong>Notes:</strong> ${appt.notes || '-'}</p>
                </div>
            </div>
        `;

        container.appendChild(card);
    });

    // Generate the calendar grid with appointment dates
    generateCalendarGrid(currentDate, getAppointmentDates());
}

function getStatusColor(status) {
    const colors = {
        pending: 'warning',
        confirmed: 'success',
        completed: 'info',
        cancelled: 'danger'
    };
    return colors[status?.toLowerCase()] || 'secondary';
}

// Format a Date object as YYYY-MM-DD using local time, not UTC
function formatDateLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Use local date string from the appointment date
function getAppointmentDates() {
    return window.appointments.map(appt => {
        const date = new Date(appt.dateTime);
        return formatDateLocal(date);
    });
}

function generateCalendarGrid(date, appointmentDates = []) {
    const calendarGrid = document.getElementById('calendar-grid');
    calendarGrid.innerHTML = ''; // Clear previous calendar

    const year = date.getFullYear();
    const month = date.getMonth();

    // Set the current month and year header
    const currentMonthLabel = document.getElementById('currentMonth');
    currentMonthLabel.textContent = date.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Calculate first day of month (0=Sun, 6=Sat)
    const firstDay = new Date(year, month, 1).getDay();

    // Number of days in the current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Add blank cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
        const blankCell = document.createElement('div');
        blankCell.className = 'calendar-day';
        calendarGrid.appendChild(blankCell);
    }

    // Generate day cells with date and appointment highlights
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day text-center';
        dayCell.textContent = day;

        const cellDate = new Date(year, month, day);
        const cellDateStr = formatDateLocal(cellDate);
        dayCell.dataset.date = cellDateStr;

        // Highlight if appointment exists on this day
        if (appointmentDates.includes(cellDateStr)) {
            dayCell.classList.add('has-appointment');
        }

        // Highlight today
        const todayStr = formatDateLocal(new Date());
        if (cellDateStr === todayStr) {
            dayCell.classList.add('active');
        }

        // Click event: select date and show daily appointments
        dayCell.addEventListener('click', () => {
            // Remove active class from all days, then add to clicked day
            document.querySelectorAll('.calendar-day.active').forEach(el => el.classList.remove('active'));
            dayCell.classList.add('active');
            showDailyAppointments(cellDateStr);
        });

        calendarGrid.appendChild(dayCell);
    }
}

function showDailyAppointments(dateStr) {
    const dailyContainer = document.getElementById('daily-appointments');
    const header = document.getElementById('selected-date-header');
    header.textContent = `Appointments for ${new Date(dateStr).toLocaleDateString()}`;

    // Filter appointments for the selected date
    const dailyAppointments = window.appointments.filter(appt => {
        return appt.dateTime.startsWith(dateStr);
    });

    if (dailyAppointments.length === 0) {
        dailyContainer.innerHTML = '<p class="text-muted text-center">No appointments for this date.</p>';
        return;
    }    dailyContainer.innerHTML = dailyAppointments.map(appt => {
        const time = new Date(appt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const petInfo = appt.pet ? `${appt.pet.name} (${appt.pet.type})` : 'Not specified';
        return `
            <div class="mb-3 border rounded p-2 shadow-sm">
                <p><strong>Time:</strong> ${time}</p>
                <p><strong>Pet:</strong> ${petInfo}</p>
                <p><strong>Service:</strong> ${appt.service}</p>
                <p><strong>Status:</strong> ${appt.status}</p>
                <p><strong>Notes:</strong> ${appt.notes || '-'}</p>
            </div>
        `;
    }).join('');
}

// Month navigation buttons
document.getElementById('prevMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    generateCalendarGrid(currentDate, getAppointmentDates());
    // Clear daily appointments view on month change
    document.getElementById('selected-date-header').textContent = 'Select a date';
    document.getElementById('daily-appointments').innerHTML = '<p class="text-muted text-center">Select a date to view appointments</p>';
});

document.getElementById('nextMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    generateCalendarGrid(currentDate, getAppointmentDates());
    // Clear daily appointments view on month change
    document.getElementById('selected-date-header').textContent = 'Select a date';
    document.getElementById('daily-appointments').innerHTML = '<p class="text-muted text-center">Select a date to view appointments</p>';
});
