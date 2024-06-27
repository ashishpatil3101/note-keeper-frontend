document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const logoutButton = document.getElementById('logout-button');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('http://localhost:5000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                if (response.ok && response.status === 200) {
                    const data = await response.json();
                    localStorage.setItem('token', data.data.token);
                    showModal(data.message);
                    window.location.href = 'index.html';
                } else {
                    const data = await response.json();
                    document.getElementById('login-message').textContent = data.message;
                }
            } catch (error) {
                console.error('Error logging in:', error);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('http://localhost:5000/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if (response.ok &&  response.status === 201) {
                    const data = await response.json();
                    console.log(data)
                    showModal(data.message);
                    // document.getElementById('register-message').textContent = 'Registration successful!';
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1000);
                } else {
                    let rsData = await response.json();
                    document.getElementById('register-message').textContent = rsData.message;
                }
            } catch (error) {
                console.error('Error registering:', error);
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', (event) => {
            event.preventDefault();
            logoutUser();
        });
    }

    async function logoutUser() {
        const response = await fetch(`http://localhost:5000/api/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}` // Add token to the request headers
            }
          });
        localStorage.removeItem('token'); 
        if(response.ok &&  response.status === 200){
            window.location.href = 'login.html';
            showModal('You have been logged out successfully.');
        } 
        else{
            showModal('Failed to logout. Please try again later.');
        }    
    }

    function showModal(message) {
        const modal = document.getElementById('myModal');
        const modalMessage = document.getElementById('modal-message');
        const closeButton = document.querySelector('.close');
        
        if (!modal) {
            console.error("Modal element 'myModal' not found");
            return;
        }
        
        if (!modalMessage) {
            console.error("Modal message element 'modal-message' not found");
            return;
        }
    
        if (!closeButton) {
            console.error("Close button element '.close' not found");
            return;
        }
    
        modalMessage.textContent = message;
        modal.style.display = 'block';
    
        closeButton.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
});
