function handleSignup(event) {
    event.preventDefault();
    
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const termsAgree = document.getElementById('termsAgree').checked;
    const signupError = document.getElementById('signupError');
    
    // Validation
    if (!validateForm(firstName, lastName, email, password, confirmPassword, termsAgree)) {
        return;
    }
    
    // Store admin data (replace with proper backend registration)
    const adminData = {
        firstName,
        lastName,
        email,
        password,
        role: 'admin',
        createdAt: new Date().toISOString()
    };
    
    // Store in localStorage for demo
    localStorage.setItem('adminAccount', JSON.stringify(adminData));
    localStorage.setItem('adminLoggedIn', 'true');
    
    // Redirect to admin dashboard
    window.location.href = 'admin_dashboard.html';
}

function validateForm(firstName, lastName, email, password, confirmPassword, termsAgree) {
    const signupError = document.getElementById('signupError');
    
    if (password !== confirmPassword) {
        showError("Passwords don't match");
        return false;
    }
    
    if (password.length < 8) {
        showError("Password must be at least 8 characters long");
        return false;
    }
    
    if (!/\d/.test(password) || !/[!@#$%^&*]/.test(password)) {
        showError("Password must contain numbers and special characters");
        return false;
    }
    
    if (!termsAgree) {
        showError("Please agree to the Terms of Service");
        return false;
    }
    
    return true;
}

function showError(message) {
    const signupError = document.getElementById('signupError');
    signupError.textContent = message;
    signupError.classList.remove('d-none');
    
    setTimeout(() => {
        signupError.classList.add('d-none');
    }, 3000);
}

function togglePassword(inputId) {
    const passwordInput = document.getElementById(inputId);
    const eyeIcon = passwordInput.nextElementSibling.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const adminSignupForm = document.getElementById('adminSignupForm');
    const signupError = document.getElementById('signupError');
    
    // Clear any previous admin session
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    
    if (adminSignupForm) {
        adminSignupForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const formData = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
                confirmPassword: document.getElementById('confirmPassword').value,
                isAdmin: true
            };
            
            try {
                const response = await fetch('/api/auth/admin/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    // Show success message
                    showSuccess('Admin registration successful! Redirecting to login...');
                    
                    // Redirect to admin login after delay
                    setTimeout(() => {
                        window.location.href = 'admin_login.html';
                    }, 2000);
                } else {
                    throw new Error(data.message || 'Registration failed');
                }
            } catch (error) {
                console.error('Signup error:', error);
                showError(error.message || 'Registration failed. Please try again.');
            }
        });
    }
});

function showError(message) {
    const errorDiv = document.getElementById('signupError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('d-none');
    }
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success text-center mb-4';
    successDiv.textContent = message;
    
    const form = document.getElementById('adminSignupForm');
    form.insertBefore(successDiv, form.firstChild);
}
