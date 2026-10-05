// Profile page functionality
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    if (!currentUser) {
        // Redirect to login if not logged in
        window.location.href = 'login.html';
        return;
    }
    
    // Initialize database
    if (!dbManager) {
        await initializeDatabase();
    }
    
    // Display user information
    document.getElementById('profileUsername').textContent = currentUser.username;
    document.getElementById('profileEmail').textContent = currentUser.email;
    
    // Load user reservations
    await loadUserReservations(currentUser.id);
    
    // Load database statistics
    await loadDatabaseStatistics();
    
    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
});

async function loadUserReservations(userId) {
    const reservationsList = document.getElementById('reservationsList');
    
    try {
        if (dbManager) {
            const reservations = dbManager.getUserReservations(userId);
            
            if (reservations.length === 0) {
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
        } else {
            reservationsList.innerHTML = '<p>Unable to load reservations.</p>';
        }
    } catch (error) {
        console.error('Error loading reservations:', error);
        reservationsList.innerHTML = '<p>Error loading reservations.</p>';
    }
}

async function loadDatabaseStatistics() {
    try {
        if (dbManager) {
            const stats = dbManager.getStatistics();
            document.getElementById('userCount').textContent = stats.users;
            document.getElementById('reservationCount').textContent = stats.reservations;
            document.getElementById('messageCount').textContent = stats.messages;
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}