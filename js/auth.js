// Simple PIN Authentication for DCQuoting PWA

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
            
            if (now - timestamp < this.sessionDuration) {
                return true;
            } else {
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
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;1,300;1,400&family=Karla:wght@300;400;500&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #fff; font-family: "Karla", system-ui, sans-serif; }
                .login-wrap {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    padding: 40px 20px;
                }
                .login-box {
                    text-align: center;
                    width: 100%;
                    max-width: 340px;
                }
                .login-logo {
                    max-width: 210px;
                    margin: 0 auto 28px;
                    display: block;
                }
                .login-rule {
                    width: 40px;
                    height: 1.5px;
                    background: #AB8900;
                    margin: 0 auto 22px;
                }
                .login-title {
                    font-family: "Cormorant", Georgia, serif;
                    font-style: italic;
                    font-weight: 300;
                    font-size: 26px;
                    color: #1C1A15;
                    margin-bottom: 24px;
                    line-height: 1.2;
                }
                .login-input {
                    width: 100%;
                    padding: 14px 12px;
                    font-size: 22px;
                    font-family: "Karla", sans-serif;
                    font-weight: 300;
                    border: 1px solid #E6E0D4;
                    background: #fff;
                    color: #1C1A15;
                    text-align: center;
                    letter-spacing: 8px;
                    margin-bottom: 12px;
                    outline: none;
                    border-radius: 0;
                    -webkit-appearance: none;
                    transition: border-color 0.2s;
                }
                .login-input:focus { border-color: #AB8900; }
                .login-btn {
                    width: 100%;
                    padding: 14px;
                    background: #AB8900;
                    color: #fff;
                    border: 1.5px solid #AB8900;
                    font-family: "Karla", sans-serif;
                    font-size: 11px;
                    font-weight: 500;
                    letter-spacing: 3px;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all 0.2s;
                    border-radius: 0;
                }
                .login-btn:hover { background: transparent; color: #AB8900; }
                .login-error {
                    color: #AB8900;
                    margin-top: 14px;
                    font-size: 12px;
                    letter-spacing: 0.5px;
                    display: none;
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-8px); }
                    75% { transform: translateX(8px); }
                }
            </style>
            <div class="login-wrap">
                <div class="login-box">
                    <img src="/DCQuoting/images/Logo.svg" alt="Desire Cabinets" class="login-logo">
                    <div class="login-rule"></div>
                    <h2 class="login-title">Enter PIN to Continue</h2>
                    <input type="password" id="pinInput" class="login-input"
                        placeholder="······" maxlength="6" autocomplete="off">
                    <button id="loginBtn" class="login-btn">Unlock</button>
                    <div id="errorMsg" class="login-error">Incorrect PIN. Please try again.</div>
                </div>
            </div>
        `;

        const pinInput = document.getElementById('pinInput');
        const loginBtn = document.getElementById('loginBtn');
        const errorMsg = document.getElementById('errorMsg');

        pinInput.focus();

        const attemptLogin = () => {
            const pin = pinInput.value.trim();
            if (this.login(pin)) {
                window.location.reload();
            } else {
                errorMsg.style.display = 'block';
                pinInput.value = '';
                pinInput.focus();
                pinInput.style.animation = 'shake 0.5s';
                setTimeout(() => { pinInput.style.animation = ''; }, 500);
            }
        };

        loginBtn.addEventListener('click', attemptLogin);
        pinInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') attemptLogin();
        });
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
