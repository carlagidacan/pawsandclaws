// Shared client-side authentication functions for Paws & Claws Vet Clinic

// Check if user is logged in and redirect appropriately
function checkAuthStatus() {
    // Don't redirect if we're on login or signup pages
    if (window.location.pathname.includes('login.html') || 
        window.location.pathname.includes('signup.html')) {
        return;
    }
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && currentUser.isLoggedIn) {
        // Redirect to appropriate dashboard based on user type
        if (currentUser.isClient) {
            window.location.href = 'client_home.html';
        } else {
            window.location.href = 'admin.html';
        }
    }
}

// Clear any previous session when accessing login/signup pages
function clearPreviousSession() {
    if (window.location.pathname.includes('login.html') || 
        window.location.pathname.includes('signup.html')) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
    }
}

// Handle logout for all user types
function handleLogout() {
    // For admin pages, show confirmation
    if (window.location.pathname.includes('admin')) {
        if (!confirm("Are you sure you want to log out?")) {
            return;
        }
    }
    
    // Clear user data
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    
    // Redirect to appropriate login page
    if (window.location.pathname.includes('admin')) {
        window.location.href = 'login.html';
    } else {
        window.location.href = 'client_login.html';
    }
}

// Function to make authenticated requests
async function makeAuthenticatedRequest(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        // Redirect to login if no token
        window.location.href = 'client_login.html';
        return null;
    }

    try {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...(options.headers || {})
        };

        // If it's a FormData request, don't set Content-Type
        if (options.body instanceof FormData) {
            delete headers['Content-Type'];
        }

        const response = await fetch(url, {
            ...options,
            headers: headers
        });

        if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            window.location.href = 'client_login.html';
            return null;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
        }

        return response;
    } catch (error) {
        console.error('Request failed:', error);
        throw error;
    }
}

// Function to fetch user data
async function fetchUserData() {
    try {
        const response = await makeAuthenticatedRequest('/api/auth/user');
        if (!response) return null;

        const data = await response.json();
        if (response.ok) {
            // Update the stored user data
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const updatedUser = { ...currentUser, ...data, isLoggedIn: true };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            return data;
        } else {
            console.error('Failed to fetch user data:', data.message);
            return null;
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
}

// Handle client signup
async function handleClientSignup(userData) {
    try {
        console.log('Sending signup request with data:', userData);
        
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        console.log('Signup response status:', response.status);
        const data = await response.json();
        console.log('Signup response data:', data);

        if (response.ok) {
            // On successful signup, redirect to login page instead of auto-login
            alert('Account created successfully! Please log in.');
            window.location.href = 'client_login.html';
            return true;
        } else {
            return { error: data.message || 'Sign up failed. Please try again.' };
        }
    } catch (error) {
        console.error('Error during sign up:', error);
        return { error: 'An error occurred. Please try again.' };
    }
}

// Function to make authenticated requests
async function makeAuthenticatedRequest(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        // Redirect to login if no token
        window.location.href = 'client_login.html';
        return null;
    }

    try {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...(options.headers || {})
        };

        // If it's a FormData request, don't set Content-Type
        if (options.body instanceof FormData) {
            delete headers['Content-Type'];
        }

        const response = await fetch(url, {
            ...options,
            headers: headers
        });

        if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            window.location.href = 'client_login.html';
            return null;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
        }

        return response;
    } catch (error) {
        console.error('Request failed:', error);
        throw error;
    }
}

// Function to fetch user data
async function fetchUserData() {
    try {
        const response = await makeAuthenticatedRequest('/api/auth/user');
        if (!response) return null;

        const data = await response.json();
        if (response.ok) {
            // Update the stored user data
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const updatedUser = { ...currentUser, ...data, isLoggedIn: true };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            return data;
        } else {
            console.error('Failed to fetch user data:', data.message);
            return null;
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
}

