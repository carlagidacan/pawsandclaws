// Function to handle client signup
document.addEventListener('DOMContentLoaded', function() {
    const clientSignupForm = document.getElementById('signupForm');
    const signupError = document.getElementById('signupError');
    
    // Clear any previous auth tokens
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    
    if (clientSignupForm) {
        clientSignupForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Basic validation
            if (!firstName || !lastName || !email || !phone || !password) {
                showError("All fields are required");
                return;
            }
            
            // Validate passwords match
            if (password !== confirmPassword) {
                showError("Passwords do not match!");
                return;
            }
            
            const submitButton = clientSignupForm.querySelector('button[type="submit"]');
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
            submitButton.disabled = true;
            
            try {
                const response = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        firstName,
                        lastName,
                        email,
                        phone,
                        password,
                        role: 'client'
                    })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showSuccess('Registration successful! Redirecting to login...');
                    setTimeout(() => {
                        window.location.href = 'client_login.html';
                    }, 2000);
                } else {
                    throw new Error(data.message || 'Registration failed');
                }
            } catch (error) {
                console.error('Signup error:', error);
                showError(error.message || 'Registration failed. Please try again.');
                submitButton.innerHTML = 'Create Account';
                submitButton.disabled = false;
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
    const form = document.getElementById('signupForm');
    if (!form) return;

    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success text-center';
    successDiv.innerHTML = `
        <i class="fas fa-check-circle fa-2x mb-2"></i>
        <p class="mb-0">${message}</p>
    `;
    
    // Remove any existing alerts
    form.querySelectorAll('.alert').forEach(alert => alert.remove());
    form.insertBefore(successDiv, form.firstChild);
}


