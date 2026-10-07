// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Header background change on scroll
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
        header.style.boxShadow = '0 4px 30px rgba(233, 30, 99, 0.15)';
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.boxShadow = '0 2px 20px rgba(233, 30, 99, 0.1)';
    }
});

// Non-blocking toast notification for iframe environment compatibility
function showAppNotification(message) {
    let container = document.getElementById('app-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'app-toast-container';
        container.style.cssText = 'position:fixed;top:24px;right:24px;z-index:99999;display:flex;flex-direction:column;gap:12px;max-width:380px;pointer-events:none;';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.style.cssText = 'background:#1a1a1a;color:#ffffff;padding:14px 20px;border-radius:12px;font-size:0.95rem;box-shadow:0 8px 30px rgba(0,0,0,0.3);border-left:4px solid #E91E63;opacity:0;transform:translateY(-10px);transition:all 0.3s ease;pointer-events:auto;';
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 350);
    }, 4000);
}

// Override window.alert to avoid blocking browser modals in iframes
window.alert = function(msg) {
    showAppNotification(msg);
};

// Update navigation for logged in user
document.addEventListener('DOMContentLoaded', () => {
    try {
        const currentUserStr = localStorage.getItem('currentUser');
        if (currentUserStr) {
            const user = JSON.parse(currentUserStr);
            const isArabic = document.documentElement.lang === 'ar';
            document.querySelectorAll('a[href="login.html"]').forEach(link => {
                link.href = 'profile.html';
                link.textContent = isArabic ? `الملف الشخصي (${user.username})` : `Profile (${user.username})`;
            });
        }
    } catch (e) {
        console.warn('Error reading currentUser from localStorage:', e);
    }
});

// Form submission handling with SQLite database & API
const reservationForm = document.querySelector('.reservation-form');
if (reservationForm) {
    reservationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(reservationForm);
        const data = Object.fromEntries(formData);
        
        // Check if page is Arabic
        const isArabic = document.documentElement.lang === 'ar';
        
        // Simple validation
        if (data.name && data.email && data.phone && data.date && data.time && data.guests) {
            // Show loading state
            const submitButton = reservationForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = isArabic ? 'جاري الحجز...' : 'Submitting...';
            submitButton.disabled = true;
            
            try {
                let savedOnServer = false;
                
                // 1. Try sending to Server API
                try {
                    const token = localStorage.getItem('token');
                    const headers = { 'Content-Type': 'application/json' };
                    if (token) headers['Authorization'] = `Bearer ${token}`;

                    const response = await fetch('/api/reservations', {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            name: data.name,
                            email: data.email,
                            phone: data.phone,
                            date: data.date,
                            time: data.time,
                            guests: data.guests
                        })
                    });
                    const resData = await response.json();
                    if (response.ok && resData.success) {
                        savedOnServer = true;
                    }
                } catch (netErr) {
                    console.warn('API reservation request failed, saving to local DB:', netErr);
                }

                // 2. Also save to client-side database as backup
                if (!dbManager && typeof initializeDatabase === 'function') {
                    await initializeDatabase();
                }
                
                if (dbManager) {
                    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
                    const userId = currentUser ? currentUser.id : null;
                    
                    dbManager.addReservation(
                        userId,
                        data.name,
                        data.email,
                        data.phone,
                        data.date,
                        data.time,
                        data.guests
                    );
                }
                
                if (isArabic) {
                    alert('شكراً لحجزك! سنتصل بك قريباً للتأكيد.');
                } else {
                    alert('Thank you for your reservation! We will contact you shortly to confirm.');
                }
                reservationForm.reset();
            } catch (error) {
                console.error('Reservation error:', error);
                alert(isArabic ? 'حدث خطأ أثناء الحجز.' : 'An error occurred during reservation.');
            } finally {
                // Reset button state
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        } else {
            if (isArabic) {
                alert('يرجى ملء جميع الحقول المطلوبة.');
            } else {
                alert('Please fill in all required fields.');
            }
        }
    });
}

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe feature cards
document.querySelectorAll('.feature-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

// Observe menu items
document.querySelectorAll('.menu-item').forEach(item => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(30px)';
    item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(item);
});

// Observe breakfast items
document.querySelectorAll('.breakfast-item').forEach(item => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(30px)';
    item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(item);
});

// Observe drink items
document.querySelectorAll('.drink-item').forEach(item => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(30px)';
    item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(item);
});

// Observe sweet items
document.querySelectorAll('.sweet-item').forEach(item => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(30px)';
    item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(item);
});

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const hero = document.querySelector('.hero');
    const scrolled = window.pageYOffset;
    if (hero) {
        // Subtle parallax for gradient background
        hero.style.backgroundPosition = `center ${scrolled * 0.2}px`;
    }
});

// Add active state to navigation links based on scroll position
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.style.color = '';
        if (link.getAttribute('href') === `#${current}`) {
            link.style.color = '#E91E63';
        }
    });
});