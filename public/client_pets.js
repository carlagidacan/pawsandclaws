// Function to load user's pets
async function loadUserPets() {
    try {
        const response = await makeAuthenticatedRequest('/api/pets/user-pets', {
            method: 'GET'
        });

        if (!response) return;

        const data = await response.json();
        if (data.success && data.pets) {
            displayPets(data.pets);
        } else {
            throw new Error(data.message || 'Failed to load pets');
        }
    } catch (error) {
        console.error('Error loading pets:', error);
        // Show error message in UI
        const petsContainer = document.querySelector('#petsContainer');
        if (petsContainer) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'col-12';
            errorDiv.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    Failed to load pets. Please try refreshing the page.
                </div>
            `;
            petsContainer.insertBefore(errorDiv, petsContainer.firstChild);
        }
    }
}

// Function to generate health status badge
function getHealthStatus(pet) {
    if (!pet.lastCheckup) {
        return { text: 'Needs Checkup', class: 'bg-warning' };
    }
    
    const lastCheckup = new Date(pet.lastCheckup);
    const monthsSinceCheckup = (new Date() - lastCheckup) / (30 * 24 * 60 * 60 * 1000);
    
    if (monthsSinceCheckup > 12) {
        return { text: 'Due for Checkup', class: 'bg-warning' };
    }
    
    return { text: 'Healthy', class: 'bg-success' };
}

// Function to calculate pet's age
function calculateAge(birthdate, age) {
    if (birthdate) {
        const years = Math.floor((new Date() - new Date(birthdate)) / (365.25 * 24 * 60 * 60 * 1000));
        return `${years} year${years !== 1 ? 's' : ''}`;
    }
    return age ? `${age} year${age !== 1 ? 's' : ''}` : 'Age unknown';
}

// Function to display pets in the UI
function displayPets(pets) {
    const petsContainer = document.querySelector('#petsContainer');
    if (!petsContainer) return;

    // Clear existing content
    petsContainer.innerHTML = '';

    // If no pets, show message
    if (!pets || pets.length === 0) {
        petsContainer.innerHTML = `
            <div class="col-12 text-center">
                <div class="card shadow-sm border-0 p-4">
                    <i class="fas fa-paw fa-3x mb-3 text-muted"></i>
                    <h5>No Pets Added Yet</h5>
                    <p class="text-muted">Start by adding your first pet!</p>
                    <div class="d-grid gap-2 col-md-6 mx-auto">
                        <a href="client_add_pet.html" class="btn btn-primary">
                            <i class="fas fa-plus-circle me-2"></i> Add New Pet
                        </a>
                    </div>
                </div>
            </div>`;
        return;
    }

    // Generate HTML for each pet
    const petsHTML = pets.map(pet => {
        const healthStatus = getHealthStatus(pet);
        return `
            <div class="col-md-4 mb-4">
                <div class="card pet-card h-100 shadow-sm border-0">
                    <div class="status-badge">
                        <span class="badge ${healthStatus.class}">${healthStatus.text}</span>
                    </div>
                    <div class="card-body text-center p-4">
                        <div class="pet-avatar mb-3">
                            ${pet.avatarUrl 
                                ? `<img src="${pet.avatarUrl}" alt="${pet.name}" class="img-fluid rounded-circle">` 
                                : `<i class="fas fa-paw fa-3x text-muted"></i>`}
                        </div>
                        <h5 class="mb-1">${pet.name}</h5>
                        <p class="text-muted mb-2">${pet.breed} • ${calculateAge(pet.birthdate, pet.age)}</p>
                        <div class="mb-3">
                            ${pet.vaccinations?.rabies ? '<span class="badge bg-info me-1">Rabies Vaccinated</span>' : ''}
                            ${pet.vaccinations?.dhp ? '<span class="badge bg-info me-1">DHP Vaccinated</span>' : ''}
                            ${pet.vaccinations?.bordetella ? '<span class="badge bg-info">Bordetella Vaccinated</span>' : ''}
                        </div>
                        <hr>
                        <div class="d-grid gap-2">
                            <a href="client_pet_medical_history.html?id=${pet._id}" class="btn btn-primary">
                                <i class="fas fa-file-medical me-2"></i>View Medical History
                            </a>
                            <button class="btn btn-outline-primary" onclick="scheduleAppointment('${pet._id}')">
                                <i class="fas fa-calendar-plus me-2"></i>Schedule Appointment
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
    }).join('');

    // Add the "Add New Pet" card
    const addNewPetCard = `
        <div class="col-md-4 mb-4">
            <div class="card pet-card h-100 border-dashed">
                <div class="card-body text-center d-flex flex-column justify-content-center p-4">
                    <i class="fas fa-plus-circle fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Add New Pet</h5>
                    <p class="text-muted mb-4">Register your pet with us</p>
                    <a href="client_add_pet.html" class="btn btn-primary">
                        <i class="fas fa-plus me-2"></i>Register Pet
                    </a>
                </div>
            </div>
        </div>`;

    petsContainer.innerHTML = petsHTML + addNewPetCard;
}

// Function to handle scheduling appointment
function scheduleAppointment(petId) {
    window.location.href = `client_add_appointment.html?petId=${petId}`;
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'client_login.html';
        return;
    }
    
    loadUserPets();
});
