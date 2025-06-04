// Variables to store form state
let selectedPet = null;
let selectedDate = null;
let selectedTime = null;
let selectedService = null;
let currentUser = null;  // Add this line

// Service definitions matching the backend
const services = {
    checkup: { id: 'checkup', name: 'General Checkup', duration: 30, price: 50, icon: 'stethoscope', description: 'Comprehensive physical examination' },
    vaccination: { id: 'vaccination', name: 'Vaccination', duration: 30, price: 75, icon: 'syringe', description: 'Core and non-core vaccines' },
    grooming: { id: 'grooming', name: 'Grooming', duration: 60, price: 45, icon: 'bath', description: 'Full grooming service' },
    dental: { id: 'dental', name: 'Dental Cleaning', duration: 60, price: 120, icon: 'tooth', description: 'Professional teeth cleaning' },
    surgery: { id: 'surgery', name: 'Surgery Consultation', duration: 45, price: 150, icon: 'hospital', description: 'Pre-surgery consultation' }
};

// Function to load user's pets
async function loadUserPets() {
    try {
        const response = await makeAuthenticatedRequest('/api/pets/user-pets', {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch pets');
        }

        const data = await response.json();
        if (data.success && data.pets) {
            displayPets(data.pets);
        } else {
            throw new Error(data.message || 'Failed to load pets');
        }
    } catch (error) {
        console.error('Error loading pets:', error);
        showError('Failed to load your pets. Please try again later.');
    }
}

// Function to display pets
function displayPets(pets) {
    const petsContainer = document.getElementById('petsContainer');
    if (!petsContainer) return;

    // Clear existing content
    petsContainer.innerHTML = '';

    if (!pets || pets.length === 0) {
        petsContainer.innerHTML = `
            <div class="col-12 text-center">
                <p class="text-muted">No pets found. Please add a pet first.</p>
                <a href="client_add_pet.html" class="btn btn-primary">
                    <i class="fas fa-plus-circle me-2"></i>Add New Pet
                </a>
            </div>`;
        return;
    }

    // Get petId from URL if it exists
    const urlParams = new URLSearchParams(window.location.search);
    const preselectedPetId = urlParams.get('petId');

    pets.forEach(pet => {
        const card = document.createElement('div');
        card.className = 'col-md-4 mb-3';
        card.innerHTML = `
            <div class="card pet-selector-card ${pet._id === preselectedPetId ? 'selected' : ''}" 
                 data-pet-id="${pet._id}" onclick="selectPet('${pet._id}')">
                <div class="card-body text-center">
                    ${pet.avatarUrl ? 
                        `<img src="${pet.avatarUrl}" alt="${pet.name}" class="rounded-circle mb-3" style="width: 80px; height: 80px; object-fit: cover;">` :
                        `<i class="fas fa-paw fa-3x text-muted mb-3"></i>`
                    }
                    <h5 class="card-title">${pet.name}</h5>
                    <p class="text-muted mb-0">${pet.breed}</p>
                </div>
            </div>`;
        petsContainer.appendChild(card);
    });

    // If there's a preselected pet, select it
    if (preselectedPetId) {
        selectPet(preselectedPetId);
    }
}

// Function to select a pet
function selectPet(petId) {
    // Remove selected class from all cards
    document.querySelectorAll('.pet-selector-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Add selected class to clicked card
    const selectedCard = document.querySelector(`.pet-selector-card[data-pet-id="${petId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
        selectedPet = petId;

        // Add animation
        selectedCard.style.transform = 'scale(1.02)';
        setTimeout(() => {
            selectedCard.style.transform = 'scale(1)';
        }, 200);
    }

    // Enable next button if a pet is selected
    updateNextButtonState();
}

// Function to load available services
function loadServices() {
    const servicesContainer = document.getElementById('servicesContainer');
    if (!servicesContainer) return;

    // Clear existing content
    servicesContainer.innerHTML = '';

    // Group services by type
    const wellnessServices = Object.values(services).filter(s => ['checkup', 'vaccination'].includes(s.id));
    const groomingServices = Object.values(services).filter(s => ['grooming'].includes(s.id));
    const medicalServices = Object.values(services).filter(s => ['dental', 'surgery'].includes(s.id));

    // Create service groups
    const createServiceGroup = (title, groupServices) => {
        const groupHtml = `
            <div class="mb-4">
                <h6 class="mb-3">${title} Services</h6>
                <div class="row">
                    ${groupServices.map(service => `
                        <div class="col-md-4 mb-3">
                            <div class="card service-card h-100" data-service-id="${service.id}" onclick="selectService('${service.id}')">
                                <div class="card-body text-center">
                                    <i class="fas fa-${service.icon} fa-3x mb-3" style="color: #4A628A;"></i>
                                    <h5>${service.name}</h5>
                                    <p class="text-muted mb-2">${service.description}</p>
                                    <p class="mb-0"><span class="badge bg-primary">₱${service.price}</span></p>
                                    <small class="text-muted d-block mt-1">${service.duration} minutes</small>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        servicesContainer.insertAdjacentHTML('beforeend', groupHtml);
    };

    // Add service groups
    createServiceGroup('Wellness', wellnessServices);
    createServiceGroup('Grooming', groomingServices);
    createServiceGroup('Medical', medicalServices);
}

// Function to select a service
function selectService(serviceId) {
    console.log('selectService called with:', serviceId);
    
    // Validate the service exists
    if (!services[serviceId]) {
        console.error('Invalid service ID:', serviceId);
        return;
    }

    // Remove selected class and styles from all cards
    document.querySelectorAll('[data-service-id]').forEach(card => {
        card.classList.remove('selected', 'border-primary');
        card.style.transform = 'scale(1)';
        card.style.borderColor = '';
    });

    // Add selected class to clicked card
    const selectedCard = document.querySelector(`[data-service-id="${serviceId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected', 'border-primary');
        selectedService = serviceId; // Set the selected service
        console.log('Service selected:', serviceId);

        // Add visual feedback
        selectedCard.style.borderColor = '#4A628A';
        selectedCard.style.transform = 'scale(1.02)';
        setTimeout(() => {
            selectedCard.style.transform = 'scale(1)';
        }, 200);

        // Immediately update button state
        const isValid = updateNextButtonState();
        console.log('Button update result:', isValid);
    } else {
        console.error('Could not find card for service:', serviceId);
    }
}

// Function to initialize date picker
function initializeDatePicker() {
    if (!document.getElementById('datepicker')) return;

    // Initialize Flatpickr with better styling
    flatpickr("#datepicker", {
        inline: true,
        minDate: "today",
        maxDate: new Date().fp_incr(30),
        disable: [disablePastDates],
        dateFormat: "Y-m-d",
        locale: {
            firstDayOfWeek: 1
        },
        onChange: function(selectedDates) {
            if (selectedDates.length > 0) {
                selectedDate = selectedDates[0];
                document.getElementById('selected-date').textContent = selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                loadTimeSlots(selectedDate);
                updateNextButtonState();
            }
        }
    });

    // Add custom styling
    const datepickerContainer = document.querySelector('.flatpickr-calendar');
    if (datepickerContainer) {
        datepickerContainer.style.border = '1px solid #e0e0e0';
        datepickerContainer.style.borderRadius = '8px';
        datepickerContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    }
}

// Function to load time slots
async function loadTimeSlots(date) {
    const timeSlotsContainer = document.getElementById('timeSlotsContainer');
    if (!timeSlotsContainer) return;

    // Show loading state
    timeSlotsContainer.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border" style="color: #4A628A;" role="status">
                <span class="visually-hidden">Loading available time slots...</span>
            </div>
            <p class="mt-2 text-muted">Loading available time slots...</p>
        </div>`;

    try {
        // Get booked appointments for this date
        const formattedDate = date.toISOString().split('T')[0];
        const response = await makeAuthenticatedRequest(`/api/appointments/available-slots?date=${formattedDate}`, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch available time slots');
        }

        const data = await response.json();
        const bookedSlots = new Set(data.bookedSlots || []);

        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        // Clear loading state
        timeSlotsContainer.innerHTML = '';

        // Create morning and afternoon sections with better styling
        let morningHtml = `
            <div class="mb-4">
                <h6 class="mb-3">
                    <i class="fas fa-sun me-2 text-warning"></i>Morning Slots
                </h6>
                <div class="row g-2">`;

        let afternoonHtml = `
            <div class="mb-4">
                <h6 class="mb-3">
                    <i class="fas fa-cloud-sun me-2 text-info"></i>Afternoon Slots
                </h6>
                <div class="row g-2">`;

        // Generate time slots from 9 AM to 5 PM
        const startHour = 9;
        const endHour = 17;
        
        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute of ['00', '30']) {
                const timeString = `${hour.toString().padStart(2, '0')}:${minute}`;
                const slotDate = new Date(date);
                slotDate.setHours(hour, parseInt(minute), 0, 0);
                const isInPast = isToday && slotDate <= now;
                const isBooked = bookedSlots.has(timeString);

                const slotHtml = `
                    <div class="col-4">
                        <button class="btn w-100 time-slot ${selectedTime === timeString ? 'selected' : ''} 
                            ${isInPast || isBooked ? 'disabled' : ''}" 
                            style="border: 1px solid #dee2e6; position: relative; ${selectedTime === timeString ? 'background-color: #4A628A; color: white;' : ''}"
                            ${!isInPast && !isBooked ? `onclick="selectTimeSlot('${timeString}')"` : ''} 
                            ${isInPast || isBooked ? 'disabled' : ''}>
                            <div class="text-center py-2">
                                <span class="fw-medium">${timeString}</span>
                                ${isBooked ? '<small class="d-block text-danger mt-1">Booked</small>' : ''}
                                ${isInPast ? '<small class="d-block text-muted mt-1">Past</small>' : ''}
                            </div>
                        </button>
                    </div>`;

                if (hour < 12) {
                    morningHtml += slotHtml;
                } else {
                    afternoonHtml += slotHtml;
                }
            }
        }

        morningHtml += '</div></div>';
        afternoonHtml += '</div></div>';

        // Add empty state if no slots are available
        if (!morningHtml.includes('time-slot') && !afternoonHtml.includes('time-slot')) {
            timeSlotsContainer.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    No available time slots for this date.
                </div>`;
        } else {
            timeSlotsContainer.innerHTML = morningHtml + afternoonHtml;
        }

        updateNextButtonState();

    } catch (error) {
        console.error('Error loading time slots:', error);
        timeSlotsContainer.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle me-2"></i>
                Failed to load available time slots. Please try again.
            </div>`;
    }
}

// Function to select time slot
function selectTimeSlot(time) {
    // Remove selected class from all time slots
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected');
        slot.style.backgroundColor = '';
        slot.style.color = '';
    });

    // Add selected class to clicked time slot
    const slots = document.querySelectorAll('.time-slot');
    for (let slot of slots) {
        if (slot.textContent.trim().includes(time)) {
            slot.classList.add('selected');
            slot.style.backgroundColor = '#4A628A';
            slot.style.color = 'white';
            selectedTime = time;
            
            // Add animation
            slot.style.transform = 'scale(1.05)';
            setTimeout(() => {
                slot.style.transform = 'scale(1)';
            }, 200);
            break;
        }
    }

    // Enable next button if a time is selected
    updateNextButtonState();
}

// Update next button state based on current step validation
function updateNextButtonState() {
    const currentStep = document.querySelector('.step-content:not(.d-none)');
    
    if (!currentStep) {
        console.error('Could not find current step');
        return;
    }

    const stepId = currentStep.id;
    const nextBtn = document.getElementById(stepId + 'Next');
    
    if (!nextBtn) {
        console.error('Could not find next button for step:', stepId);
        return;
    }

    console.log('Current step:', stepId);
    console.log('Selected service:', selectedService);

    let isValid = false;
    let nextBtnText = 'Next <i class="fas fa-arrow-right ms-2"></i>';

    switch (stepId) {
        case 'step1':
            isValid = selectedPet !== null;
            console.log('Step 1 validation:', isValid);
            break;
        case 'step2':
            isValid = selectedService !== null;
            console.log('Step 2 validation:', isValid);
            break;
        case 'step3':
            isValid = selectedDate !== null && selectedTime !== null;
            console.log('Step 3 validation:', isValid);
            break;
        case 'step4':
            isValid = true;
            nextBtnText = '<i class="fas fa-calendar-check me-2"></i> Confirm Appointment';
            break;
    }

    nextBtn.disabled = !isValid;
    nextBtn.innerHTML = nextBtnText;
    
    if (isValid) {
        nextBtn.classList.remove('disabled', 'btn-outline-secondary');
        nextBtn.classList.add('btn-primary');
        nextBtn.style.cursor = 'pointer';
        nextBtn.style.pointerEvents = 'auto';
        console.log('Button enabled');
    } else {
        nextBtn.classList.add('disabled', 'btn-outline-secondary');
        nextBtn.classList.remove('btn-primary');
        nextBtn.style.cursor = 'not-allowed';
        nextBtn.style.pointerEvents = 'none';
        console.log('Button disabled');
    }

    return isValid;
}

// Update step indicators to show progress
function updateStepIndicators() {
    const currentStep = document.querySelector('.step-content:not(.d-none)');
    const steps = ['step1', 'step2', 'step3', 'step4'];
    const currentIndex = steps.indexOf(currentStep.id);

    steps.forEach((step, index) => {
        const indicator = document.querySelector(`.step-indicator:nth-child(${index + 1})`);
        if (!indicator) return;

        const numberEl = indicator.querySelector('.step-number');
        const labelEl = indicator.querySelector('.step-label');
        
        // Update number element
        numberEl.style.backgroundColor = index <= currentIndex ? '#4A628A' : '#dee2e6';
        numberEl.style.color = index <= currentIndex ? 'white' : '#6c757d';
        
        // Update label
        labelEl.style.color = index === currentIndex ? '#4A628A' : '#6c757d';
        labelEl.style.fontWeight = index === currentIndex ? '600' : '500';

        // Update the line after the step
        if (index < steps.length - 1) {
            const line = indicator.querySelector('.progress');
            if (line) {
                line.classList.toggle('bg-primary', index < currentIndex);
            }
        }
    });
}

// Disable all dates in the past and Sundays
function disablePastDates(date) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // Disable past dates and Sundays
    return date < now || date.getDay() === 0;
}

// Function to show error message
function showError(message) {
    const alertHtml = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            <i class="fas fa-exclamation-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    // Find the active step and insert error at the top
    const activeStep = document.querySelector('.step-content:not(.d-none)');
    if (activeStep) {
        // Remove any existing error alerts
        activeStep.querySelectorAll('.alert-danger').forEach(alert => alert.remove());
        // Add new error alert
        activeStep.insertAdjacentHTML('afterbegin', alertHtml);
    }
}

// Function to navigate between steps
function navigateStep(direction) {
    console.log('Navigating with direction:', direction);
    const steps = document.querySelectorAll('.step-content');
    const currentStep = document.querySelector('.step-content:not(.d-none)');
    const currentIndex = Array.from(steps).indexOf(currentStep);
    const nextIndex = currentIndex + direction;

    console.log('Current index:', currentIndex, 'Next index:', nextIndex);

    if (nextIndex >= 0 && nextIndex < steps.length) {
        // Validate before moving forward
        if (direction > 0) {
            const isValid = validateStep(currentIndex);
            console.log('Step validation result:', isValid);
            if (!isValid) {
                console.log('Validation failed, staying on current step');
                return;
            }
        }

        // Hide current step
        currentStep.classList.add('d-none');
        
        // Show next step
        steps[nextIndex].classList.remove('d-none');
        console.log('Moved to step:', nextIndex);

        // Update step indicators
        updateStepIndicators();

        // Update back button visibility
        const prevBtn = document.querySelector(`.prev-btn`);
        if (prevBtn) {
            prevBtn.style.visibility = nextIndex === 0 ? 'hidden' : 'visible';
        }

        // Get the next button for the new step
        const nextBtn = document.getElementById(`step${nextIndex + 1}Next`);
        if (nextBtn) {
            nextBtn.innerHTML = nextIndex === steps.length - 1 ? 
                '<i class="fas fa-calendar-check me-2"></i> Confirm Appointment' : 
                'Next <i class="fas fa-arrow-right ms-2"></i>';
        }

        // If we're on the review step, update the summary
        if (nextIndex === steps.length - 1) {
            updateReviewStep();
        }

        // Update button states
        updateNextButtonState();
    }
}

// Function to validate current step
function validateStep(stepIndex) {
    console.log('Validating step:', stepIndex); // Debug log
    console.log('Current state - Pet:', selectedPet, 'Service:', selectedService, 'Date:', selectedDate, 'Time:', selectedTime);

    switch (stepIndex) {
        case 0: // Pet selection
            if (!selectedPet) {
                showError('Please select a pet to proceed.');
                return false;
            }
            break;
        case 1: // Service selection
            if (!selectedService) {
                showError('Please select a service to proceed.');
                return false;
            }
            console.log('Service validation passed'); // Debug log
            break;
        case 2: // Date and time selection
            if (!selectedDate || !selectedTime) {
                showError('Please select both date and time to proceed.');
                return false;
            }
            break;
    }
    return true;
}

// Function to update review step
function updateReviewStep() {
    const reviewContainer = document.getElementById('reviewContainer');
    if (!reviewContainer) return;

    // Get pet details
    const selectedPetCard = document.querySelector(`.pet-selector-card[data-pet-id="${selectedPet}"]`);
    const petName = selectedPetCard ? selectedPetCard.querySelector('h5').textContent : '';
    const petInfo = selectedPetCard ? selectedPetCard.querySelector('.text-muted').textContent : '';

    // Get service details
    const service = services[selectedService] || {};

    // Format date and time
    const formattedDate = selectedDate ? selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : '';

    reviewContainer.innerHTML = `
        <div class="card shadow-sm border-0">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-4">
                            <h6 class="mb-2">Pet Information:</h6>
                            <p class="mb-1"><strong>${petName}</strong></p>
                            <p class="text-muted mb-0">${petInfo}</p>
                        </div>
                        <div class="mb-4">
                            <h6 class="mb-2">Service:</h6>
                            <p class="mb-1"><strong>${service.name}</strong></p>
                            <p class="text-muted mb-2">${service.description}</p>
                            <p class="mb-0">
                                <span class="badge bg-primary">₱${service.price}</span>
                                <small class="text-muted ms-2">${service.duration} minutes</small>
                            </p>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-4">
                            <h6 class="mb-2">Date & Time:</h6>
                            <p class="mb-1">${formattedDate}</p>
                            <p class="mb-0"><strong>${selectedTime}</strong></p>
                        </div>
                        <div class="form-group">
                            <h6 class="mb-2">Additional Notes:</h6>
                            <textarea id="appointmentNotes" class="form-control" rows="3" 
                                placeholder="Any special instructions or concerns..."></textarea>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="alert alert-info mt-3">
            <i class="fas fa-info-circle me-2"></i>
            You will receive a confirmation email once your appointment is confirmed.
        </div>`;
}

// Function to submit appointment
async function submitAppointment() {
    const confirmBtn = document.getElementById('step4Next');
    const originalText = confirmBtn.innerHTML;

    try {
        console.log('Starting appointment submission...'); // Debug log

        // Validate all required fields
        if (!selectedPet || !selectedService || !selectedDate || !selectedTime) {
            throw new Error('Please fill in all required fields');
        }

        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Booking...';
        confirmBtn.disabled = true;

        // Format the date and time properly
        const appointmentDateTime = new Date(selectedDate);
        const [hours, minutes] = selectedTime.split(':');
        appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Create appointment data
        const appointmentData = {
            petId: selectedPet,           
            serviceId: selectedService,   
            dateTime: appointmentDateTime.toISOString(),
            notes: document.getElementById('appointmentNotes')?.value || ''
        };

        console.log('Sending appointment data:', appointmentData); // Debug log

        const response = await makeAuthenticatedRequest('/api/appointments/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(appointmentData)
        });

        console.log('Response received:', response); // Debug log

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error response:', errorData); // Debug log
            throw new Error(errorData.message || 'Failed to book appointment');
        }

        const data = await response.json();
        console.log('Success response:', data); // Debug log

        if (data.success) {
            window.location.href = 'client_appointments.html';
        } else {
            throw new Error(data.message || 'Failed to book appointment');
        }
    } catch (error) {
        console.error('Error booking appointment:', error);
        showError(`Failed to book appointment: ${error.message}`);
        confirmBtn.innerHTML = originalText;
        confirmBtn.disabled = false;
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication using token only
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'client_login.html';
        return;
    }

    // Initialize components
    loadUserPets();
    loadServices();
    initializeDatePicker();
    updateStepIndicators();

    // Set up navigation button handlers for all steps
    document.querySelectorAll('.next-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            console.log('Next button clicked:', btn.id);
            e.preventDefault();
            
            const currentStep = document.querySelector('.step-content:not(.d-none)');
            const steps = document.querySelectorAll('.step-content');
            const currentIndex = Array.from(steps).indexOf(currentStep);
            const isLastStep = currentIndex === steps.length - 1;
            
            if (isLastStep) {
                submitAppointment();
            } else {
                navigateStep(1);
            }
        });
    });

    document.querySelectorAll('.prev-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            console.log('Previous button clicked:', btn.id);
            e.preventDefault();
            navigateStep(-1);
        });
    });

    // Set initial visibility for step 1
    updateNextButtonState();
});
