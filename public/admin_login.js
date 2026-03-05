function togglePassword() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.querySelector('.fa-eye');
    
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
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const loginError = document.getElementById('loginError');
        
        try {
            const response = await fetch('/api/auth/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: document.getElementById('email').value,
                    password: document.getElementById('password').value
                })
            });

            const data = await response.json();

            if (response.ok && data.token) {
                // Store admin token and data
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminData', JSON.stringify({
                    ...data.admin,
                    isAdmin: true
                }));
                
                window.location.href = 'admin_dashboard.html';
            } else {
                loginError.textContent = data.message || 'Invalid credentials';
                loginError.classList.remove('d-none');
            }
        } catch (error) {
            console.error('Login error:', error);
            loginError.textContent = 'Login failed. Please try again.';
            loginError.classList.remove('d-none');
        }
    });
});

// Clear stored data when accessing login page
localStorage.removeItem('adminToken');
localStorage.removeItem('adminData');

