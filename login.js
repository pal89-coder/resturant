// Login form handling with SQLite database
const loginForm = document.querySelector('.login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Check if page is Arabic
        const isArabic = document.documentElement.lang === 'ar';
        
        // Get form values
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const remember = document.querySelector('input[name="remember"]').checked;
        
        // Simple validation
        if (username && email && password) {
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert(isArabic ? 'يرجى إدخال عنوان بريد إلكتروني صحيح.' : 'Please enter a valid email address.');
                return;
            }
            
            // Password validation (minimum 6 characters)
            if (password.length < 6) {
                alert(isArabic ? 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.' : 'Password must be at least 6 characters long.');
                return;
            }
            
            // Show loading state
            const submitButton = loginForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = isArabic ? 'جاري تسجيل الدخول...' : 'Signing in...';
            submitButton.disabled = true;
            
            try {
                let loginSuccess = false;
                let loggedInUser = null;
                let loginErrorMessage = '';

                // 1. Try server login first
                try {
                    const response = await fetch('/api/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });
                    const data = await response.json();
                    if (response.ok && data.success) {
                        loginSuccess = true;
                        loggedInUser = data.user;
                        if (data.token) {
                            localStorage.setItem('token', data.token);
                        }
                    } else if (data.error) {
                        loginErrorMessage = data.error;
                    }
                } catch (netErr) {
                    console.warn('Server login request failed, trying client db:', netErr);
                }

                // 2. Client-side database fallback
                if (!loginSuccess) {
                    if (!dbManager && typeof initializeDatabase === 'function') {
                        await initializeDatabase();
                    }
                    if (dbManager) {
                        const result = dbManager.loginUser(username, password);
                        if (result.success) {
                            loginSuccess = true;
                            loggedInUser = result.user;
                        } else if (!loginErrorMessage) {
                            loginErrorMessage = result.message;
                        }
                    }
                }

                if (loginSuccess && loggedInUser) {
                    // Store user session
                    localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
                    
                    // Store login info if remember me is checked
                    if (remember) {
                        localStorage.setItem('rememberedUser', username);
                        localStorage.setItem('rememberedEmail', email);
                    } else {
                        localStorage.removeItem('rememberedUser');
                        localStorage.removeItem('rememberedEmail');
                    }
                    
                    alert(isArabic ? `مرحباً بعودتك، ${loggedInUser.username}! تم تسجيل الدخول بنجاح.` : `Welcome back, ${loggedInUser.username}! Login successful.`);
                    
                    // Redirect to appropriate home page
                    setTimeout(() => {
                        window.location.href = isArabic ? 'index-arabic.html' : 'index.html';
                    }, 500);
                } else {
                    alert(loginErrorMessage || (isArabic ? 'بيانات الاعتماد غير صحيحة.' : 'Invalid credentials.'));
                }
            } catch (error) {
                console.error('Login error:', error);
                alert(isArabic ? 'حدث خطأ أثناء تسجيل الدخول.' : 'An error occurred during login.');
            } finally {
                // Reset button state
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        } else {
            alert(isArabic ? 'يرجى ملء جميع الحقول المطلوبة.' : 'Please fill in all required fields.');
        }
    });
}

// Check for remembered user on page load
window.addEventListener('DOMContentLoaded', () => {
    const rememberedUser = localStorage.getItem('rememberedUser');
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    
    if (rememberedUser) {
        const usernameInput = document.getElementById('username');
        const emailInput = document.getElementById('email');
        const rememberCheckbox = document.querySelector('input[name="remember"]');
        
        if (usernameInput) usernameInput.value = rememberedUser;
        if (emailInput) emailInput.value = rememberedEmail;
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }
});

// Social login buttons (placeholder functionality)
const socialButtons = document.querySelectorAll('.btn-social');
socialButtons.forEach(button => {
    button.addEventListener('click', () => {
        const isArabic = document.documentElement.lang === 'ar';
        const provider = button.classList.contains('btn-google') ? 'Google' : 'Facebook';
        if (isArabic) {
            alert(`سيتم تنفيذ تسجيل الدخول عبر ${provider} هنا.`);
        } else {
            alert(`${provider} login integration would be implemented here.`);
        }
    });
});

// Password visibility toggle (optional enhancement)
const passwordInput = document.getElementById('password');
if (passwordInput) {
    // Create toggle button
    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.innerHTML = '👁️';
    
    // Check if RTL for positioning
    const isRTL = document.documentElement.dir === 'rtl';
    const position = isRTL ? 'left' : 'right';
    
    toggleButton.style.cssText = `
        position: absolute;
        ${position}: 15px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.2rem;
        padding: 0;
    `;
    
    // Add positioning to password input parent
    const passwordGroup = passwordInput.parentElement;
    passwordGroup.style.position = 'relative';
    
    toggleButton.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        toggleButton.innerHTML = type === 'password' ? '👁️' : '🙈';
    });
    
    passwordGroup.appendChild(toggleButton);
}