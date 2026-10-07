// Profile page functionality
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    if (!currentUser) {
        // Redirect to login if not logged in
        window.location.href = 'login.html';
        return;
    }
    
    // Display user information
    const userEl = document.getElementById('profileUsername');
    const emailEl = document.getElementById('profileEmail');
    if (userEl) userEl.textContent = currentUser.username;
    if (emailEl) emailEl.textContent = currentUser.email;

    // Initialize client database for fallback if needed
    if (!dbManager && typeof initializeDatabase === 'function') {
        await initializeDatabase();
    }
    
    // Load user reservations
    await loadUserReservations(currentUser.id);
    
    // Load database statistics
    await loadDatabaseStatistics();
    
    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        });
    }
});

function renderReservationsList(reservations) {
    const reservationsList = document.getElementById('reservationsList');
    if (!reservationsList) return;

    if (!reservations || reservations.length === 0) {
        reservationsList.innerHTML = '<p>No reservations found.</p>';
        return;
    }
    
    let html = '<div class="reservations-grid">';
    reservations.forEach(reservation => {
        html += `
            <div class="reservation-card">
                <div class="reservation-info">
                    <h4>Reservation #${reservation.id}</h4>
                    <p><strong>Date:</strong> ${reservation.date}</p>
                    <p><strong>Time:</strong> ${reservation.time}</p>
                    <p><strong>Guests:</strong> ${reservation.guests}</p>
                    <p><strong>Phone:</strong> ${reservation.phone}</p>
                </div>
            </div>
        `;
    });
    html += '</div>';
    reservationsList.innerHTML = html;
}

async function loadUserReservations(userId) {
    const reservationsList = document.getElementById('reservationsList');
    
    try {
        // Try server profile API first if token exists
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await fetch('/api/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const profileData = await response.json();
                    if (profileData && profileData.reservations) {
                        renderReservationsList(profileData.reservations);
                        return;
                    }
                }
            } catch (err) {
                console.warn('Server profile fetch failed, using local DB:', err);
            }
        }

        // Local DB fallback
        if (dbManager) {
            const reservations = dbManager.getUserReservations(userId);
            renderReservationsList(reservations);
        } else if (reservationsList) {
            reservationsList.innerHTML = '<p>Unable to load reservations.</p>';
        }
    } catch (error) {
        console.error('Error loading reservations:', error);
        if (reservationsList) reservationsList.innerHTML = '<p>Error loading reservations.</p>';
    }
}

async function loadDatabaseStatistics() {
    try {
        // Try server stats API first
        try {
            const response = await fetch('/api/stats');
            if (response.ok) {
                const stats = await response.json();
                const u = document.getElementById('userCount');
                const r = document.getElementById('reservationCount');
                const m = document.getElementById('messageCount');
                if (u) u.textContent = stats.users;
                if (r) r.textContent = stats.reservations;
                if (m) m.textContent = stats.messages;
                return;
            }
        } catch (e) {
            console.warn('Server stats fetch failed, using local DB:', e);
        }

        // Local DB fallback
        if (dbManager) {
            const stats = dbManager.getStatistics();
            const u = document.getElementById('userCount');
            const r = document.getElementById('reservationCount');
            const m = document.getElementById('messageCount');
            if (u) u.textContent = stats.users;
            if (r) r.textContent = stats.reservations;
            if (m) m.textContent = stats.messages;
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}