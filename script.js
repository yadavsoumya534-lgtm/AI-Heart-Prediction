document.addEventListener("DOMContentLoaded", () => {
   
    /* ==========================================================================
       1. GLOBAL UI & PROFILE SETTINGS
       ========================================================================== */
    const profileModal = document.getElementById('profileModal');
    const topRightProfile = document.querySelector('.profile-avatar'); 
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const googleSyncBtn = document.querySelector('.btn-google-sync');

    // Desktop Photo Upload Logic
    const desktopPhotoUpload = document.getElementById('desktopPhotoUpload');
    if (desktopPhotoUpload) {
        desktopPhotoUpload.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                if (file.size > 2.5 * 1024 * 1024) {
                    alert('Photo is too large! Please select an image under 2.5MB.');
                    return;
                }
                const reader = new FileReader();
                reader.onload = function(e) {
                    const base64Image = e.target.result;
                    try {
                        localStorage.setItem('userPhoto', base64Image);
                        updateUI(null, base64Image, null);
                        const uploadLabel = document.querySelector('label[for="desktopPhotoUpload"]');
                        if (uploadLabel) {
                            const originalText = uploadLabel.innerHTML;
                            uploadLabel.innerHTML = '<i class="fa-solid fa-check" style="color: green;"></i> Uploaded!';
                            setTimeout(() => { uploadLabel.innerHTML = originalText; }, 2000);
                        }
                    } catch (error) {
                        console.error("Storage Error:", error);
                        alert("Could not save the image. Your browser storage might be full.");
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (topRightProfile) {
        topRightProfile.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'profile-settings.html';
        });
    }

    if (googleSyncBtn) {
        googleSyncBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const currentName = localStorage.getItem('userName') || "User";
            const currentEmail = localStorage.getItem('userEmail') || "synced.user@gmail.com";
            const mockGoogleData = {
                name: currentName + " (Google)",
                email: currentEmail,
                photoUrl: "https://i.pravatar.cc/150?img=47"
            };
            localStorage.setItem('userName', mockGoogleData.name);
            localStorage.setItem('userPhoto', mockGoogleData.photoUrl);
            updateUI(mockGoogleData.name, mockGoogleData.photoUrl, mockGoogleData.email);
            googleSyncBtn.innerHTML = '<i class="fa-solid fa-check" style="color: green;"></i> Synced!';
            setTimeout(() => { googleSyncBtn.innerHTML = '<i class="fa-brands fa-google"></i> Sync Gmail Photo'; }, 2000);
        });
    }

    // --- Helper Function: Calculate Age from ISO Date String (YYYY-MM-DD) ---
    function calculateAge(dobString) {
        if (!dobString) return null;
        const today = new Date();
        const birthDate = new Date(dobString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    function updateUI(name, photoUrl, email) {
        const savedName = name || localStorage.getItem('userName') || "Guest";
        const savedPhoto = photoUrl || localStorage.getItem('userPhoto') || "https://i.pravatar.cc/100?img=32";
        const savedEmail = email || localStorage.getItem('userEmail') || "Not logged in";

        // Retrieve stored DOB and compute age
        const savedDOB = localStorage.getItem('userDOB') || "1990-05-16";
        const computedAge = calculateAge(savedDOB);

        const headerGreeting = document.querySelector('.username-highlight');
        if (headerGreeting) headerGreeting.innerText = savedName;

        const topProfileName = document.querySelector('.profile-name');
        if (topProfileName) topProfileName.innerHTML = `${savedName.split(' ')[0]} <i class="fa-solid fa-chevron-down"></i>`;

        const displayName = document.getElementById('displayName');
        if (displayName) displayName.innerText = savedName;

        const allAvatars = document.querySelectorAll('.profile-avatar img, .large-avatar, #settingsAvatar, #topAvatar');
        allAvatars.forEach(img => img.src = savedPhoto);
        
        const nameInput = document.getElementById('profileName');
        if (nameInput) nameInput.value = savedName;

        const emailInput = document.getElementById('profileEmail');
        if (emailInput) emailInput.value = savedEmail;

        // Sync DOB & Age across Patient Profile (profile-settings.html)
        const displayDOB = document.getElementById('displayDOB');
        if (displayDOB) {
            displayDOB.innerText = `DOB: ${savedDOB} (${computedAge ? computedAge + 'y' : '--'})`;
        }

        const profileDOBInput = document.getElementById('profileDOB');
        if (profileDOBInput) {
            profileDOBInput.value = savedDOB;
        }

        // Auto Pre-fill Full Name & Age in Health Prediction Form (heart-prediction.html)
        const formNameInput = document.getElementById('name') || document.querySelector('input[name="name"]');
        if (formNameInput && !formNameInput.value) {
            formNameInput.value = savedName;
        }

        const formAgeInput = document.getElementById('age') || document.querySelector('input[name="age"]');
        if (formAgeInput && !formAgeInput.value && computedAge) {
            formAgeInput.value = computedAge;
        }
    }

    updateUI(null, null, null);

    // Listen for DOB inputs on profile-settings.html to auto-update
    const profileDOBInput = document.getElementById('profileDOB');
    if (profileDOBInput) {
        profileDOBInput.addEventListener('change', (e) => {
            const newDOB = e.target.value;
            localStorage.setItem('userDOB', newDOB);
            updateUI(null, null, null);
        });
    }

    window.addEventListener('storage', (event) => {
        if (event.key === 'userName' || event.key === 'userPhoto' || event.key === 'userEmail' || event.key === 'userDOB') {
            updateUI(null, null, null);
        }
    });

    /* ==========================================================================
       2. AUTH / LOGIN PAGE LOGIC
       ========================================================================== */

    const loginForm = document.querySelector('.login-form');
    const altLoginBtn = document.querySelector('.btn-alt-login'); 

    if (loginForm) {
        const togglePassword = document.querySelector('.toggle-password');
        const passwordInput = document.querySelector('input[type="password"]');
        
        if (togglePassword && passwordInput) {
            togglePassword.addEventListener('click', () => {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                togglePassword.innerHTML = type === 'password' ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
                togglePassword.style.color = type === 'password' ? 'var(--text-muted)' : 'var(--primary)';
            });
        }

        let errorMsg = loginForm.querySelector('.error-message');
        if (!errorMsg) {
            errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.style.cssText = 'color: #ef4444; font-size: 0.85rem; font-weight: 500; text-align: center; margin-bottom: 0.5rem; display: none;';
            const submitBtn = loginForm.querySelector('.btn-submit');
            loginForm.insertBefore(errorMsg, submitBtn);
        }

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            const emailInput = loginForm.querySelector('input[type="email"]');
            const passwordInput = loginForm.querySelector('input[type="password"]');
            const email = emailInput ? emailInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value : '';

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (!emailRegex.test(email)) {
                errorMsg.innerText = "Please enter a valid email address.";
                errorMsg.style.display = 'block';
                return; 
            }
            if (password.length < 6) {
                errorMsg.innerText = "Password must be at least 6 characters long.";
                errorMsg.style.display = 'block';
                return; 
            }

            errorMsg.style.display = 'none';

            if (emailInput && emailInput.value) {
                localStorage.setItem('userEmail', emailInput.value);
                let derivedName = emailInput.value.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                localStorage.setItem('userName', derivedName);
                if (!localStorage.getItem('userPhoto')) localStorage.setItem('userPhoto', 'https://i.pravatar.cc/100?img=32'); 
            }

            const submitBtn = loginForm.querySelector('.btn-submit');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';
                submitBtn.style.opacity = '0.8';
                submitBtn.disabled = true;
            }
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
        });        
    }

    if (altLoginBtn) {
        altLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.setItem('userEmail', 'demo.patient@healthpredict.com');
            localStorage.setItem('userName', 'Demo Patient');
            localStorage.setItem('userPhoto', 'https://i.pravatar.cc/150?img=11'); 

            altLoginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading Dashboard...';
            altLoginBtn.style.opacity = '0.8';
            altLoginBtn.disabled = true;
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
        });
    }

    /* ==========================================================================
       OFFICIAL GOOGLE AUTHENTICATION LOGIC (index.html)
       ========================================================================== */

    function handleCredentialResponse(response) {
        // Decode the JWT token
        const responsePayload = JSON.parse(atob(response.credential.split('.')[1]));

        // Save REAL Google data
        localStorage.setItem('userName', responsePayload.name);
        localStorage.setItem('userEmail', responsePayload.email);
        localStorage.setItem('userPhoto', responsePayload.picture);

        // Save DOB from payload (or set/retain stored DOB)
        const userDOB = responsePayload.birthdate || localStorage.getItem('userDOB') || "1990-05-16";
        localStorage.setItem('userDOB', userDOB);

        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    }

    window.onload = function () {
        if (typeof google !== 'undefined' && google.accounts) {
            // 1. Initialize Google Identity
            google.accounts.id.initialize({
                client_id: "66445890031-ftlfc1mu9g84josa1ud0cu2nf97ndgfg.apps.googleusercontent.com",
                callback: handleCredentialResponse
            });

            const googleContainer = document.getElementById('googleButtonContainer');
            
            // 2. Find main blue Login button to match measurements
            const mainLoginButton = document.querySelector('.btn-submit');
            
            // 3. Measure width
            const targetWidth = mainLoginButton ? mainLoginButton.offsetWidth : 350;

            if (googleContainer) {
                google.accounts.id.renderButton(
                    googleContainer,
                    { 
                        theme: "outline", 
                        size: "large", 
                        shape: "rectangular",
                        width: targetWidth,
                        type: "standard",
                        text: "signin_with"
                    }
                );
            }
        }
    };

    // --- Interactive Welcome Toast Logic ---
    const userName = localStorage.getItem('userName');
    const userPhoto = localStorage.getItem('userPhoto');
    const userDOB = localStorage.getItem('userDOB');
    const justLoggedIn = sessionStorage.getItem('justLoggedIn');

    if (window.location.pathname.includes('dashboard') && userName && !justLoggedIn) {
        const userAge = calculateAge(userDOB);
        const ageText = userAge ? ` (${userAge}y)` : '';

        // 1. Create the toast element
        const toast = document.createElement('div');
        toast.className = 'welcome-toast';
        toast.innerHTML = `
            <img src="${userPhoto}" class="toast-img" alt="Profile">
            <div class="toast-content">
                <h4>Welcome back, ${userName.split(' ')[0]}${ageText}!</h4>
                <p>Authentication successful.</p>
            </div>
        `;
        
        // 2. Append to body and trigger animation
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // 3. Slide back out after 4 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            sessionStorage.setItem('justLoggedIn', 'true');
        }, 4000);
    }

    /* ==========================================================================
       3. DASHBOARD PAGE LOGIC (Real-time Vitals, Assessment & Telemetry Chart)
       ========================================================================== */
    if (document.body.classList.contains('dashboard-page')) {
        const heartRateEl = document.getElementById('dashHeartRate');
        const bpEl = document.getElementById('dashBloodPressure');
        const bloodSugarEl = document.getElementById('dashBloodSugar');
        const spo2El = document.getElementById('dashSpo2');
        const assessmentPill = document.getElementById('dashAssessmentPill');
        const assessmentText = document.getElementById('dashAssessmentText');

        // Fetch Stored Records & Update Vitals + Assessment Status
        const history = JSON.parse(localStorage.getItem('healthHistory')) || [];
        let latestRiskScore = 12;
        let latestRecord = null;

        // Helper: derive a realistic SpO2 reading from the risk score
        // (SpO2 isn't collected on the prediction form, so we infer it:
        // higher cardiovascular risk skews slightly lower oxygen saturation)
        function deriveSpo2(score) {
            const value = Math.round(99 - (score / 100) * 7);
            return Math.max(92, Math.min(99, value));
        }

        if (history.length > 0) {
            latestRecord = history[0];
            latestRiskScore = parseFloat(latestRecord.score || latestRecord.riskScore) || 12;

            // Populate Heart Rate + Blood Pressure from the saved assessment
            if (latestRecord.vitals) {
                if (heartRateEl && latestRecord.vitals.hr) {
                    heartRateEl.innerHTML = `${latestRecord.vitals.hr} <span style="font-size: 1rem; color: #94a3b8;">bpm</span>`;
                }
                if (bpEl && latestRecord.vitals.bp) {
                    // If stored as a single value (e.g. 120), format with default diastolic
                    const bpVal = typeof latestRecord.vitals.bp === 'number'
                        ? `${latestRecord.vitals.bp}/80`
                        : latestRecord.vitals.bp;
                    bpEl.innerHTML = `${bpVal} <span style="font-size: 1rem; color: #94a3b8;">mmHg</span>`;
                }
                if (bloodSugarEl && latestRecord.vitals.bs) {
                    bloodSugarEl.innerHTML = `${latestRecord.vitals.bs} <span style="font-size: 1rem; color: #94a3b8;">mg/dL</span>`;
                }
            }

            // Populate SpO2 (derived from risk score, since it isn't collected on the form)
            if (spo2El) {
                spo2El.innerHTML = `${deriveSpo2(latestRiskScore)} <span style="font-size: 1rem; color: #94a3b8;">%</span>`;
            }

            // Populate Assessment status card
            if (assessmentPill && assessmentText) {
                const riskInfo = getRiskCategory(latestRiskScore);

                assessmentPill.textContent = `${riskInfo.label.toUpperCase()} (${latestRiskScore}%)`;
                assessmentPill.style.background = riskInfo.bgColor;
                assessmentPill.style.color = riskInfo.textColor;

                assessmentText.textContent = `Latest Assessment: ${latestRecord.statusText || riskInfo.label} — ${riskInfo.description} recorded on ${latestRecord.date}.`;
            }
        }

        // Initialize Telemetry Chart using real recorded history
        const healthChartCanvas = document.getElementById('healthTrendChart');
        if (healthChartCanvas && typeof Chart !== 'undefined') {
            const ctx = healthChartCanvas.getContext('2d');

            const chartRecords = [...history].reverse().slice(-5);
            let labels = chartRecords.length > 0 ? chartRecords.map(r => r.date ? r.date.split(' ').slice(0, 2).join(' ') : 'Past') : ['00:00', '04:00', '08:00', '12:00', '16:00'];
            let riskPoints = chartRecords.length > 0 ? chartRecords.map(r => r.score || 10) : [10, 12, 11, 14, 13];
            let hrPoints = chartRecords.length > 0 ? chartRecords.map(r => (r.vitals && r.vitals.hr) || 72) : [65, 70, 72, 75, 80];
            let bpPoints = chartRecords.length > 0 ? chartRecords.map(r => (r.vitals && r.vitals.bp) || 120) : [118, 120, 122, 121, 125];

            if (history.length > 0) {
                labels.push('Current');
                riskPoints.push(latestRiskScore);
                hrPoints.push((latestRecord.vitals && latestRecord.vitals.hr) || 72);
                bpPoints.push((latestRecord.vitals && latestRecord.vitals.bp) || 120);
            }

            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'AI Risk Profile (%)',
                            data: riskPoints,
                            borderColor: '#4F46E5',
                            backgroundColor: 'rgba(79, 70, 229, 0.1)',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Heart Rate (BPM)',
                            data: hrPoints,
                            borderColor: '#ec4899',
                            tension: 0.4
                        },
                        {
                            label: 'Systolic BP (mmHg)',
                            data: bpPoints,
                            borderColor: '#3b82f6',
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                }
            });
        }
    }

    /* ==========================================================================
       4. HEALTH RECORDS LOGIC (Dynamic Sync & Live Search)
       ========================================================================== */
    const recordsPage = document.querySelector('.records-page');
    const recordsGrid = document.getElementById('recordsGrid');
    const searchInput = document.getElementById('searchInput');

    if (recordsPage || recordsGrid) {
        
        const renderHealthRecords = (filterQuery = '') => {
            const history = JSON.parse(localStorage.getItem('healthHistory')) || [];
            const query = filterQuery.toLowerCase().trim();

            const filteredHistory = history.filter(rec => {
                const title = (rec.statusText || 'AI Prediction').toLowerCase();
                const date = (rec.date || '').toLowerCase();
                const score = (rec.score + '%').toLowerCase();
                const riskLabel = getRiskCategory(rec.score || 10).label.toLowerCase();

                return title.includes(query) || date.includes(query) || score.includes(query) || riskLabel.includes(query);
            });

            if (!recordsGrid) return;

            if (filteredHistory.length === 0) {
                recordsGrid.innerHTML = `
                    <div class="empty-state">
                        <i class="fa-solid fa-folder-open"></i>
                        <h3>No health records found</h3>
                        <p style="color: var(--text-muted); margin-top: 0.5rem;">Try running a health prediction or modifying your search filter.</p>
                    </div>
                `;
                return;
            }

            recordsGrid.innerHTML = filteredHistory.map(rec => {
                const score = rec.score || rec.riskScore || 10;
                const risk = getRiskCategory(score);
                const hr = rec.vitals && rec.vitals.hr ? rec.vitals.hr : '72 bpm';
                const bp = rec.vitals && rec.vitals.bp ? rec.vitals.bp : '120/80';
                const bs = rec.vitals && rec.vitals.bs ? rec.vitals.bs : '95 mg/dL';

                return `
                    <div class="record-card">
                        <div class="record-header">
                            <span class="record-date"><i class="fa-regular fa-calendar"></i> ${rec.date || 'Recent'}</span>
                            <span style="font-size: 0.8rem; padding: 0.25rem 0.65rem; border-radius: 9999px; font-weight: 700; background: ${risk.bgColor}; color: ${risk.textColor};">
                                ${risk.label.toUpperCase()} (${score}%)
                            </span>
                        </div>
                        <div class="record-body">
                            <div class="record-type" style="color: var(--primary); font-size: 0.8rem; font-weight: 600;"><i class="fa-solid fa-robot"></i> AI Health Assessment</div>
                            <div class="record-title" style="font-size: 1.1rem; font-weight: 700; margin: 0.4rem 0 1rem 0;">${rec.statusText || 'Cardiovascular Profile Evaluation'}</div>
                            <div class="vitals-mini-grid">
                                <div class="vital-item">
                                    <span class="vital-lbl">Heart Rate</span>
                                    <span class="vital-val">${hr}</span>
                                </div>
                                <div class="vital-item">
                                    <span class="vital-lbl">Blood Pressure</span>
                                    <span class="vital-val">${bp}</span>
                                </div>
                                <div class="vital-item">
                                    <span class="vital-lbl">Blood Sugar</span>
                                    <span class="vital-val">${bs}</span>
                                </div>
                                <div class="vital-item">
                                    <span class="vital-lbl">SpO2</span>
                                    <span class="vital-val">98%</span>
                                </div>
                            </div>
                        </div>
                        <div class="record-footer">
                            <button class="btn-delete-record" data-id="${rec.id}" style="padding: 0.5rem 1rem; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; border-radius: 8px; cursor: pointer; flex: 1; font-weight: 600;">
                                <i class="fa-solid fa-trash-can"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        };

        renderHealthRecords();

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                renderHealthRecords(e.target.value);
            });
        }

        recordsGrid.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.btn-delete-record');
            if (deleteBtn) {
                const recordId = deleteBtn.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this record?')) {
                    let history = JSON.parse(localStorage.getItem('healthHistory')) || [];
                    history = history.filter(rec => rec.id !== recordId);
                    localStorage.setItem('healthHistory', JSON.stringify(history));
                    renderHealthRecords(searchInput ? searchInput.value : '');
                }
            }
        });
    }

    function getRiskCategory(score) {
        const numScore = parseFloat(score);
        if (numScore >= 50) {
            return { label: 'High Risk', bgColor: '#fee2e2', textColor: '#b91c1c', description: 'Priority clinical attention recommended' };
        } else if (numScore >= 25) {
            return { label: 'Moderate Risk', bgColor: '#fef3c7', textColor: '#d97706', description: 'Moderate risk indicators observed' };
        } else {
            return { label: 'Low Risk', bgColor: '#dcfce7', textColor: '#15803d', description: 'Vitals within normal health baseline' };
        }
    }    

    /* ==========================================================================
       5. HEART PREDICTION FORM LOGIC
       ========================================================================== */
    const riskForm = document.getElementById('riskForm') || document.getElementById('heartRiskForm'); 
    if (riskForm) {
        riskForm.addEventListener('submit', function(e) {
            e.preventDefault(); 

            if (!this.checkValidity()) {
                const requiredFields = this.querySelectorAll('[required]');
                let missing = [];
                requiredFields.forEach(field => {
                    if (!field.value) {
                        const label = field.closest('.form-group, .form-group-item, .form-element')?.querySelector('label');
                        if (label) missing.push(label.innerText.replace('*', '').trim());
                    }
                });
                alert("Please complete the following required fields:\n\n• " + missing.join('\n• '));
                return;
            }

            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing Data...';
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.8';
            }

            const getValue = (identifier) => {
                const el = document.getElementById(identifier) || riskForm.querySelector(`[name="${identifier}"]`);
                return el ? el.value : '';
            };

            const name = getValue('name') || localStorage.getItem('userName') || 'Patient';
            const age = parseInt(getValue('age')) || 0;
            const gender = getValue('gender');
            const cp = parseInt(getValue('chestPainType') || getValue('chestPain')) || 0;
            const bp = parseInt(getValue('restingBP') || getValue('bp')) || 120; 
            const chol = parseInt(getValue('cholesterol')) || 0;
            const fbs = parseInt(getValue('fastingBloodSugar') || getValue('fbs')) || 0;
            const restingECG = parseInt(getValue('restingECG')) || 0;
            const thalach = parseInt(getValue('maxHeartRate') || getValue('thalach')) || 75; 
            const exang = parseInt(getValue('exerciseAngina') || getValue('exang')) || 0;
            const oldpeak = parseFloat(getValue('oldpeak')) || 0.0;
            const slope = parseInt(getValue('slope')) || 1;
            const majorVessels = parseInt(getValue('majorVessels')) || 0;
            const thalassemia = parseInt(getValue('thalassemia')) || 1;

            let riskScore = 10; 
            if (age > 50) riskScore += 12; 
            if (age > 65) riskScore += 8; 
            if (gender === 'male') riskScore += 8;
            if (cp > 0) riskScore += 18; 
            if (bp > 130) riskScore += 10; 
            if (bp > 150) riskScore += 15;
            if (chol > 240) riskScore += 12; 
            if (fbs === 1 || fbs === '1') riskScore += 10; 
            if (thalach < 130) riskScore += 8; 
            if (exang === 1 || exang === '1') riskScore += 15; 
            if (oldpeak > 1.5) riskScore += 10;
            riskScore = Math.min(riskScore, 98);

            let statusText = "", statusColor = "", statusIcon = "", recommendation = "", colorClass = "", badgeClass = "", badgeText = "";

            if (riskScore < 30) {
                statusText = "Low Risk"; statusColor = "#10b981"; statusIcon = "fa-shield-heart"; colorClass = "text-green"; badgeClass = "light-green"; badgeText = "Good";
                recommendation = "Great job! Your cardiovascular profile looks healthy. Maintain your current diet and exercise routine.";
            } else if (riskScore < 60) {
                statusText = "Moderate Risk"; statusColor = "#f59e0b"; statusIcon = "fa-triangle-exclamation"; colorClass = "text-orange"; badgeClass = "light-orange"; badgeText = "Moderate";
                recommendation = "You have some risk factors. Consider speaking with a doctor about managing your blood pressure or cholesterol levels.";
            } else {
                statusText = "High Risk"; statusColor = "#ef4444"; statusIcon = "fa-truck-medical"; colorClass = "text-red"; badgeClass = "light-red"; badgeText = "At Risk";
                recommendation = "Your profile indicates a high probability of cardiovascular issues. Please schedule a consultation with a cardiologist soon.";
            }

            const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            
            const newRecord = { 
                id: 'rec_' + Date.now(),
                date: today, 
                score: riskScore, 
                statusText: statusText, 
                statusColorClass: colorClass, 
                badgeClass: badgeClass, 
                badgeText: badgeText,
                vitals: { hr: thalach, bp: bp, bs: fbs === 1 ? 140 : 95 },
                isManual: false 
            };
            
            let history = JSON.parse(localStorage.getItem('healthHistory')) || [];
            history.unshift(newRecord); 
            if (history.length > 20) history.pop();
            localStorage.setItem('healthHistory', JSON.stringify(history));

            const payload = {
                name: name,
                age: age, 
                gender: gender, 
                chestPainType: cp, 
                restingBP: bp, 
                cholesterol: chol, 
                fastingBloodSugar: fbs,
                restingECG: restingECG,
                maxHeartRate: thalach,
                exerciseAngina: exang,
                oldpeak: oldpeak,
                slope: slope,
                majorVessels: majorVessels,
                thalassemia: thalassemia,
                riskScore: riskScore, 
                statusText: statusText
            };

            fetch('http://localhost:5001/api/save-prediction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(response => {
                if (!response.ok) throw new Error("Backend response error");
                return response.json();
            })
            .then(data => {
                showPredictionSuccess(riskScore, statusText, statusColor, statusIcon, recommendation);
            })
            .catch(error => {
                console.warn('MongoDB endpoint unreachable. Saved locally instead:', error);
                showPredictionSuccess(riskScore, statusText, statusColor, statusIcon, recommendation);
            });
        });

        function showPredictionSuccess(riskScore, statusText, statusColor, statusIcon, recommendation) {
            const formCard = riskForm.closest('.prediction-form-card') || riskForm.closest('.container') || riskForm.closest('.form-card') || riskForm.closest('.form-workspace');
            if (formCard) {
                formCard.innerHTML = `
                    <div style="text-align: center; padding: 2rem 1rem; animation: fadeIn 0.5s ease;">
                        <div style="width: 80px; height: 80px; background: ${statusColor}20; color: ${statusColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin: 0 auto 1.5rem auto;"><i class="fa-solid ${statusIcon}"></i></div>
                        <h2 style="font-size: 1.5rem; color: var(--text-dark); margin-bottom: 0.5rem;">Prediction Complete</h2>
                        <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 2rem;">Analysis successfully processed and saved to your profile.</p>
                        <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 12px; padding: 2rem; margin-bottom: 2rem;">
                            <span style="font-size: 0.9rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;">Estimated Risk Probability</span>
                            <div style="font-size: 4rem; font-weight: 800; color: ${statusColor}; line-height: 1;">${riskScore}%</div>
                            <div style="display: inline-block; margin-top: 1rem; padding: 0.5rem 1rem; background: ${statusColor}15; color: ${statusColor}; font-weight: 600; border-radius: 20px; font-size: 0.9rem;">${statusText}</div>
                        </div>
                        <div style="text-align: left; background: #eff6ff; color: #1e293b; padding: 1.5rem; border-radius: 8px; border-left: 4px solid var(--primary); font-size: 0.9rem; line-height: 1.5;">
                            <strong><i class="fa-solid fa-user-doctor"></i> Recommendation:</strong><br>${recommendation}
                        </div>
                        <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem;">
                            <button onclick="window.location.reload()" style="background: white; border: 1px solid var(--border-color); color: var(--text-dark); padding: 0.8rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer;">
                                <i class="fa-solid fa-rotate-left"></i> Run Again
                            </button>
                            <button onclick="window.location.href='dashboard.html'" style="background: var(--primary); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer;">
                                View Dashboard <i class="fa-solid fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>
                `;
            }
        }
    }

    /* ==========================================================================
       6. MY HISTORY PAGE LOGIC
       ========================================================================== */
    const historyPage = document.querySelector('.history-table');
    if (historyPage) {
        const historyBody = document.getElementById('historyBody');
        const history = JSON.parse(localStorage.getItem('healthHistory')) || [];

        if (historyBody) {
            const aiOnlyHistory = history.filter(record => record.isManual !== true);

            if (aiOnlyHistory.length === 0) {
                historyBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:2rem;">No history found.</td></tr>`;
            } else {
                historyBody.innerHTML = '';
                aiOnlyHistory.forEach(record => {
                    historyBody.innerHTML += `
                        <tr>
                            <td><strong>${record.date}</strong></td>
                            <td><span class="status-pill ${record.badgeClass || 'light-green'}">${record.statusText}</span></td>
                            <td>${record.score}%</td>
                            <td><button onclick="window.location.href='health-records.html'" class="btn-outline">Details</button></td>
                        </tr>
                    `;
                });
            }
        }
    }
    
    /* ==========================================================================
       7. PROFILE SETTINGS LOGIC
       ========================================================================== */
    const profilePage = document.querySelector('.profile-page');
    if (profilePage && saveProfileBtn) {
        saveProfileBtn.addEventListener("click", async (e) => {
            e.preventDefault(); 
            const nameInput = document.getElementById("profileName");
            if(nameInput) {
                localStorage.setItem('userName', nameInput.value);
                updateUI(nameInput.value, null, null);
            }
            const originalText = saveProfileBtn.innerHTML;
            saveProfileBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
            setTimeout(() => {
                saveProfileBtn.innerHTML = '<i class="fa-solid fa-check"></i> Profile Updated!';
                saveProfileBtn.style.backgroundColor = '#16a34a'; 
                saveProfileBtn.style.color = 'white';
                saveProfileBtn.style.borderColor = '#16a34a';
                setTimeout(() => {
                    saveProfileBtn.innerHTML = originalText;
                    saveProfileBtn.style.backgroundColor = ''; 
                    saveProfileBtn.style.color = '';
                    saveProfileBtn.style.borderColor = '';
                }, 2000);
            }, 1000); 
        });
    }

    /* ==========================================================================
       8. RECOMMENDATIONS PAGE LOGIC
       ========================================================================== */
    const recPage = document.querySelector('.recommendations-page');
    if (recPage) {
        const history = JSON.parse(localStorage.getItem('healthHistory')) || [];
        const recGrid = document.getElementById('recGrid');
        const alertContainer = document.getElementById('riskAlertContainer');

        if (history.length === 0) {
            if (recGrid) recGrid.innerHTML = `<p>No data found. Please complete an assessment first.</p>`;
        } else {
            const latest = history[0];
            if (latest.score > 60 && alertContainer) {
                alertContainer.innerHTML = `
                    <div class="risk-alert">
                        <i class="fa-solid fa-triangle-exclamation"></i> <strong>Medical Priority:</strong> 
                        Based on your latest high-risk assessment, we strongly recommend scheduling a consultation with your cardiologist.
                    </div>
                `;
            }
            const advice = [
                { title: "Dietary Adjustments", icon: "fa-apple-whole", desc: "Focus on low-sodium foods, leafy greens, and whole grains to support heart health." },
                { title: "Physical Activity", icon: "fa-person-walking", desc: "Aim for 30 minutes of moderate aerobic activity (brisk walking) at least 5 days a week." },
                { title: "Stress Management", icon: "fa-spa", desc: "Incorporate mindfulness meditation or deep breathing exercises to lower cortisol levels." },
                { title: "Routine Monitoring", icon: "fa-notes-medical", desc: "Track your blood pressure and sugar levels at the same time every day." }
            ];
            if (recGrid) {
                advice.forEach(item => {
                    recGrid.innerHTML += `
                        <div class="rec-card">
                            <i class="fa-solid ${item.icon}"></i>
                            <h3>${item.title}</h3>
                            <p style="color: var(--text-muted);">${item.desc}</p>
                        </div>
                    `;
                });
            }
        }
    }

    /* ==========================================================================
       9. CHARTS & TRENDS PAGE LOGIC
       ========================================================================== */
    const chartsPage = document.querySelector('.charts-page');
    if (chartsPage) {
        const history = JSON.parse(localStorage.getItem('healthHistory')) || [];
        const canvasObj = document.getElementById('healthChart');
        
        if (canvasObj && typeof Chart !== 'undefined') {
            const ctx = canvasObj.getContext('2d');
            if (history.length === 0) {
                const historyContainer = document.querySelector('.history-container');
                if (historyContainer) historyContainer.innerHTML = `<p style="text-align:center;">No data available. Please complete an assessment.</p>`;
            } else {
                const sortedHistory = [...history].reverse(); 
                const labels = sortedHistory.map(record => record.date);
                const dataPoints = sortedHistory.map(record => record.score);

                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{ label: 'Health Risk Score', data: dataPoints, borderColor: '#2563eb', backgroundColor: 'rgba(37, 99, 235, 0.1)', tension: 0.4, fill: true, pointBackgroundColor: '#2563eb' }]
                    },
                    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100 } } }
                });
            }
        }
    }

    /* ==========================================================================
       10. UTILITIES (Logout)
       ========================================================================== */
    const logoutBtn = document.querySelector('.logout-btn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            
            logoutBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span class="nav-text">Signing out...</span>';
            logoutBtn.style.opacity = '0.7';
            logoutBtn.style.pointerEvents = 'none';

            setTimeout(() => {
                localStorage.removeItem('userName');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userPhoto');
                sessionStorage.removeItem('justLoggedIn');
                
                window.location.href = 'index.html';
            }, 800);
        });
    }
});