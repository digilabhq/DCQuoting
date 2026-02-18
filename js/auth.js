// Simple PIN Authentication for DesireCabinets PWA

class Auth {
    constructor() {
        this.correctPin = 'DC1869';
        this.storageKey = 'dcquoting-auth';
        this.sessionDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    }

    // Check if user is authenticated
    isAuthenticated() {
        const session = localStorage.getItem(this.storageKey);
        if (!session) return false;

        try {
            const { timestamp } = JSON.parse(session);
            const now = Date.now();
            
            // Check if session is still valid (within 24 hours)
            if (now - timestamp < this.sessionDuration) {
                return true;
            } else {
                // Session expired
                this.logout();
                return false;
            }
        } catch (e) {
            return false;
        }
    }

    // Verify PIN and create session
    login(pin) {
        if (pin === this.correctPin) {
            const session = {
                timestamp: Date.now(),
                authenticated: true
            };
            localStorage.setItem(this.storageKey, JSON.stringify(session));
            return true;
        }
        return false;
    }

    // Clear session
    logout() {
        localStorage.removeItem(this.storageKey);
    }

    // Show login screen
    showLoginScreen() {
        document.body.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <div style="
                    background: white;
                    padding: 40px;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
                    text-align: center;
                    max-width: 400px;
                    width: 90%;
                ">
                    <img src="/DCQuoting/images/logo.jpg" alt="Desire Cabinets" style="
                        max-width: 250px;
                        margin-bottom: 30px;
                    ">
                    <h2 style="
                        color: #2C2C2C;
                        margin-bottom: 20px;
                        font-size: 24px;
                        font-weight: 600;
                    ">Enter PIN to Continue</h2>
                    <input 
                        type="password" 
                        id="pinInput" 
                        placeholder="Enter PIN"
                        maxlength="6"
                        autocomplete="off"
                        style="
                            width: 100%;
                            padding: 15px;
                            font-size: 18px;
                            border: 2px solid #E0E0E0;
                            border-radius: 8px;
                            text-align: center;
                            letter-spacing: 4px;
                            font-weight: 600;
                            margin-bottom: 20px;
                            box-sizing: border-box;
                        "
                    >
                    <button 
                        id="loginBtn"
                        style="
                            width: 100%;
                            padding: 15px;
                            background: #AB8900;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                        "
                        onmouseover="this.style.background='#8B6F00'"
                        onmouseout="this.style.background='#AB8900'"
                    >Unlock</button>
                    <div id="errorMsg" style="
                        color: #d32f2f;
                        margin-top: 15px;
                        font-size: 14px;
                        display: none;
                    ">Incorrect PIN. Please try again.</div>
                </div>
            </div>
        `;

        const pinInput = document.getElementById('pinInput');
        const loginBtn = document.getElementById('loginBtn');
        const errorMsg = document.getElementById('errorMsg');

        // Focus input
        pinInput.focus();

        // Handle login
        const attemptLogin = () => {
            const pin = pinInput.value.trim();
            if (this.login(pin)) {
                // Reload page to show main app
                window.location.reload();
            } else {
                errorMsg.style.display = 'block';
                pinInput.value = '';
                pinInput.focus();
                
                // Shake animation
                pinInput.style.animation = 'shake 0.5s';
                setTimeout(() => {
                    pinInput.style.animation = '';
                }, 500);
            }
        };

        // Click login button
        loginBtn.addEventListener('click', attemptLogin);

        // Press Enter
        pinInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                attemptLogin();
            }
        });

        // Add shake animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-10px); }
                75% { transform: translateX(10px); }
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize auth check
    init() {
        if (!this.isAuthenticated()) {
            this.showLoginScreen();
            return false;
        }
        return true;
    }
}

// Create global auth instance
const auth = new Auth();
