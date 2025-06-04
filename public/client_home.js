// client_home.js

// Function to fetch and display user data and pets on the dashboard
async function loadUserData() {
    try {
        // Show loading state in sidebar
        const sidebarUserName = document.getElementById('sidebarUserName');
        const sidebarUserEmail = document.getElementById('sidebarUserEmail');
        const memberSince = document.getElementById('memberSince');
        
        if (sidebarUserName) sidebarUserName.textContent = 'Loading...';
        if (sidebarUserEmail) sidebarUserEmail.textContent = '';
        if (memberSince) memberSince.textContent = 'Loading...';

        // Get the token
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'client_login.html';
            return;
        }

        // Load both user data and pets in parallel
        await Promise.all([loadUserProfile(), loadUserPets()]);// Use makeAuthenticatedRequest helper
        const response = await makeAuthenticatedRequest('/api/auth/user', {
            method: 'GET'
        });

        if (!response) {
            throw new Error('Authentication failed');
        }

        const userData = await response.json();
        
        // Update stored user data
        const updatedUser = { ...userData, isLoggedIn: true };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        // Display the data
        displayUserData(userData);
        updateWelcomeMessage(userData);
    } catch (error) {
        console.error('Error loading user data:', error);
        const loginError = document.getElementById('loginError');
        if (loginError) {
            loginError.textContent = 'Could not load user data. Please try again later.';
            loginError.classList.remove('d-none');
        } else {
            window.location.href = 'client_login.html';
        }
    }
}

// Function to format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Function to display user data on the page
function displayUserData(data) {
    // Update the sidebar user info
    const sidebarUserName = document.getElementById('sidebarUserName');
    if (sidebarUserName) {
        sidebarUserName.textContent = `${data.firstName} ${data.lastName}`;
    }

    const sidebarUserEmail = document.getElementById('sidebarUserEmail');
    if (sidebarUserEmail) {
        sidebarUserEmail.textContent = data.email;
    }

    const memberSince = document.getElementById('memberSince');
    if (memberSince && data.createdAt) {
        memberSince.textContent = `Member since ${formatDate(data.createdAt)}`;
    }
}

// Function to update the welcome message
function updateWelcomeMessage(data) {
    const welcomeMessage = document.getElementById('welcomeMessage');
    welcomeMessage.textContent = `Welcome back, ${data.firstName}!`;
}

// Function to load user profile data
async function loadUserProfile() {
    const response = await makeAuthenticatedRequest('/api/auth/user', {
        method: 'GET'
    });

    if (!response) {
        throw new Error('Authentication failed');
    }

    const userData = await response.json();
    
    // Update stored user data
    const updatedUser = { ...userData, isLoggedIn: true };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    // Display the data
    displayUserData(userData);
    updateWelcomeMessage(userData);
}

// Function to load and display user's pets in the dashboard
async function loadUserPets() {
    try {
        console.log('Fetching user pets...');
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found');
            return;
        }
        
        const response = await makeAuthenticatedRequest('/api/pets/user-pets', {
            method: 'GET'
        });

        if (!response) {
            console.error('No response from pets API');
            displayError('Failed to connect to the server. Please try again later.');
            return;
        }

        if (!response.ok) {
            console.error('Error response:', response.status, response.statusText);
            displayError('Server error occurred. Please try again later.');
            return;
        }

        const data = await response.json();
        console.log('Received pets data:', data);

        if (data.success && data.pets) {
            console.log('Displaying pets:', data.pets);
            displayDashboardPets(data.pets);
        } else {
            throw new Error(data.message || 'Failed to load pets');
        }
    } catch (error) {
        console.error('Error loading pets:', error);
        displayError('Failed to load pets: ' + error.message);
    }
}

// Function to load upcoming appointments
async function loadUpcomingAppointments() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found');
            return;
        }
        
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display= 'block'
        }

        const response = await fetch('/api/appointments/user-appointments', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch appointments');
        }

        const data = await response.json();
        loadingIndicator.style.display = 'none';

        if (!data.success || !data.appointments || data.appointments.length === 0) {
            const appointmentsContainer = document.querySelector('.list-group.list-group-flush');
            appointmentsContainer.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-calendar-day fa-2x text-muted mb-3"></i>
                    <p class="text-muted mb-0">No upcoming appointments</p>
                </div>`;
            return;
        }

        // Filter and sort upcoming appointments
        const upcomingAppointments = data.appointments
            .filter(apt => new Date(apt.dateTime) >= new Date())
            .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
            .slice(0, 3); // Show only 3 most recent

        const appointmentsContainer = document.getElementById('upcoming-appointments');
        appointmentsContainer.innerHTML = upcomingAppointments.map(apt => {
            const date = new Date(apt.dateTime);
            const formattedDate = date.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
            });
            const formattedTime = date.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
            });

            const statusClasses = {
                'pending': 'bg-warning',
                'confirmed': 'bg-success',
                'completed': 'bg-info',
                'cancelled': 'bg-danger'
            };

            return `
                <div class="list-group-item border-0 py-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${apt.service.charAt(0).toUpperCase() + apt.service.slice(1)}</h6>
                            <small class="text-muted">${formattedDate} • ${formattedTime}</small>
                        </div>
                        <span class="badge ${statusClasses[apt.status]} d-flex align-items-center" 
                              style="height: 24px; padding: 0 10px;">
                            ${apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                        </span>
                    </div>
                    <div class="mt-2">
                        <small><i class="fas fa-paw me-1"></i> ${apt.pet}</small>
                    </div>
                </div>`;
        }).join('');

    } catch (error) {
        console.error('Error loading appointments:', error);
        const loadingIndicator = document.getElementById('loading-indicator');
        loadingIndicator.style.display = 'block';
        const appointmentsContainer = document.querySelector('.list-group.list-group-flush');
        appointmentsContainer.innerHTML = `
            <div class="alert alert-danger m-3">
                <i class="fas fa-exclamation-circle me-2"></i>
                Failed to load appointments
            </div>`;
    }
}

// Function to display error message
function displayError(message) {
    const errorDiv = document.getElementById('petLoadingError');
    const errorMessage = document.getElementById('petErrorMessage');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    if (errorDiv && errorMessage) {
        errorMessage.textContent = message;
        errorDiv.classList.remove('d-none');
    }

    if (loadingIndicator) {
        loadingIndicator.classList.add('d-none');
    }
}

// Function to hide error message
function hideError() {
    const errorDiv = document.getElementById('petLoadingError');
    if (errorDiv) {
        errorDiv.classList.add('d-none');
    }
}

// Function to display pets in the dashboard
function displayDashboardPets(pets) {    const petsContainer = document.querySelector('#petsContainer');
    if (!petsContainer) {
        console.error('Pets container not found');
        return;
    }

    // Clear existing pets (except the "Add New Pet" card)
    petsContainer.innerHTML = '';

    // If no pets, just show the "Add New Pet" card
    if (!pets || pets.length === 0) {
        petsContainer.innerHTML = `
            <div class="col-md-4 mb-3">
                <div class="card pet-card h-100 border-dashed">
                    <div class="card-body text-center d-flex flex-column justify-content-center">
                        <i class="fas fa-plus-circle fa-3x text-muted mb-3"></i>
                        <h5 class="text-muted">Add New Pet</h5>
                        <a href="client_add_pet.html" class="btn btn-sm mt-2" style="color: white; background-color: #4A628A; border-color: #4A628A;">Register Pet</a>
                    </div>
                </div>
            </div>`;
        return;
    }

    // Display up to 2 most recent pets
    const recentPets = pets.slice(0, 2);
    const petsHTML = recentPets.map(pet => `
        <div class="col-md-4 mb-3">
            <div class="card pet-card h-100">
                <div class="card-body text-center">
                    ${pet.avatarUrl ? 
                        `<img src="${pet.avatarUrl}" alt="${pet.name}" class="rounded-circle mb-3" style="width: 80px; height: 80px; object-fit: cover;">` :
                        `<i class="fas fa-paw fa-3x text-muted mb-3"></i>`
                    }
                    <h5>${pet.name}</h5>
                    <p class="text-muted">${pet.breed} • ${getAge(pet.birthdate, pet.age)}</p>
                    <div class="d-flex justify-content-center gap-2">
                        ${getStatusBadges(pet)}
                    </div>
                    <hr>
                    <a href="client_pet_medical_history.html?id=${pet._id}" 
                       class="btn btn-sm" 
                       style="color: white; background-color: #4A628A; border-color: #4A628A;">
                        View Details
                    </a>
                </div>
            </div>
        </div>
    `).join('');

    // Add the "Add New Pet" card
    const addNewPetCard = `
        <div class="col-md-4 mb-3">
            <div class="card pet-card h-100 border-dashed">
                <div class="card-body text-center d-flex flex-column justify-content-center">
                    <i class="fas fa-plus-circle fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Add New Pet</h5>
                    <a href="client_add_pet.html" class="btn btn-sm mt-2" style="color: white; background-color: #4A628A; border-color: #4A628A;">Register Pet</a>
                </div>
            </div>
        </div>`;

    petsContainer.innerHTML = petsHTML + addNewPetCard;
}

// Helper function to get pet age display
function getAge(birthdate, age) {
    if (birthdate) {
        const years = Math.floor((new Date() - new Date(birthdate)) / (365.25 * 24 * 60 * 60 * 1000));
        return `${years} year${years !== 1 ? 's' : ''}`;
    }
    return age ? `${age} year${age !== 1 ? 's' : ''}` : 'Age unknown';
}

// Helper function to generate status badges
function getStatusBadges(pet) {
    const badges = [];
    
    // Check vaccinations
    if (pet.vaccinations && (pet.vaccinations.rabies || pet.vaccinations.dhp || pet.vaccinations.bordetella)) {
        badges.push('<span class="badge bg-info">Vaccinated</span>');
    }
    
    // Add status badge based on last checkup
    if (pet.lastCheckup) {
        const lastCheckup = new Date(pet.lastCheckup);
        const monthsSinceCheckup = (new Date() - lastCheckup) / (30 * 24 * 60 * 60 * 1000);
        
        if (monthsSinceCheckup > 12) {
            badges.push('<span class="badge bg-warning">Due for checkup</span>');
        } else {
            badges.push('<span class="badge bg-success">Healthy</span>');
        }
    } else {
        badges.push('<span class="badge bg-warning">Needs checkup</span>');
    }
    
    return badges.join('');
}

// Check auth status and load user data when the page loads
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // First check if we have a token
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'client_login.html';
            return;
        }

        // Then load user data and pets
        await Promise.all([loadUserData(), loadUserPets()]);
    
        // Set up logout handler
        const logoutBtn = document.querySelector('[onclick="handleLogout()"]');
        if (logoutBtn) {
            logoutBtn.onclick = (e) => {
                e.preventDefault();
                handleLogout();
            };
        }
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        displayError('Failed to load dashboard. Please try refreshing the page.');
    }

    loadUpcomingAppointments();
});
