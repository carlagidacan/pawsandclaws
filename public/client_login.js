document.addEventListener('DOMContentLoaded', function() {
    const clientLoginForm = document.getElementById('clientLoginForm');
    const loginError = document.getElementById('loginError');
    
    // Clear any previous session when accessing login page
    clearPreviousSession();
    
    if (clientLoginForm) {
        clientLoginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // Store the token and user data
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('currentUser', JSON.stringify({
                        ...data.user,
                        isLoggedIn: true,
                        isClient: true
                    }));
                    
                    // Redirect to client home page
                    window.location.href = 'client_home.html';
                } else {
                    loginError.textContent = data.message || 'Invalid email or password';
                    loginError.classList.remove('d-none');
                    document.getElementById('password').value = '';
                }
            } catch (error) {
                console.error('Login error:', error);
                loginError.textContent = 'An error occurred during login. Please try again.';
                loginError.classList.remove('d-none');
                document.getElementById('password').value = '';
            }
        });
    }

    // Handle admin login link directly through HTML href
    const adminLoginLink = document.querySelector('a[href="admin_login.html"]');
    if (adminLoginLink) {
        adminLoginLink.onclick = function() {
            window.location.href = 'admin_login.html';
            return false; // Prevent default and stop propagation
        };
    }
});

