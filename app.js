/* ============================================
   SMART GREENHOUSE HUB - INTERACTIVE JAVASCRIPT
   ============================================ */

// ---- Utility Helpers ----
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const rand = (min, max) => Math.random() * (max - min) + min;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ---- Simulated Sensor State ----
const state = {
    temperature: 28.6,
    humidity: 53.4,
    soilMoisture: 47.6,
    co2: 571,
    light: 695,
    rain: false,
    motion: false,
    aqi: 84,
    devices: {
        pump: false,
        fan: true,
        light: false,
        vent: false,
        heater: false,
        buzzer: false,
    },
    autoMode: true,
    history: {
        temp: [],
        hum: [],
        soil: [],
        co2: [],
        light: [],
        labels: [],
    },
};

// ---- Initialize History Data (last 24 data points) ----
function initHistory() {
    const now = new Date();
    for (let i = 24; i >= 0; i--) {
        const t = new Date(now.getTime() - i * 60000 * 30);
        const h = t.getHours();
        const m = t.getMinutes();
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hr = h % 12 || 12;
        state.history.labels.push(`${hr.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')} ${ampm}`);
        state.history.temp.push(clamp(26 + rand(-3, 6), 20, 40));
        state.history.hum.push(clamp(50 + rand(-10, 15), 30, 80));
        state.history.soil.push(clamp(45 + rand(-8, 10), 20, 70));
        state.history.co2.push(clamp(500 + rand(-80, 150), 350, 1000));
        state.history.light.push(clamp(600 + rand(-200, 300), 100, 1200));
    }
}

// ---- Chart.js Setup ----
let chartTempHum, chartSoil, chartCo2Light;

function createCharts() {
    const commonOpts = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 16,
                    font: { family: "'Inter', sans-serif", size: 12, weight: '600' },
                },
            },
            tooltip: {
                backgroundColor: 'rgba(17,24,39,0.9)',
                titleFont: { family: "'Inter', sans-serif", size: 13 },
                bodyFont: { family: "'Inter', sans-serif", size: 12 },
                padding: 12,
                cornerRadius: 10,
                displayColors: true,
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: {
                    font: { family: "'Inter', sans-serif", size: 10 },
                    color: '#9ca3af',
                    maxRotation: 0,
                    maxTicksLimit: 6,
                },
            },
            y: {
                grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
                ticks: {
                    font: { family: "'Inter', sans-serif", size: 11 },
                    color: '#9ca3af',
                },
            },
        },
        elements: {
            point: { radius: 2, hoverRadius: 5 },
            line: { tension: 0.4, borderWidth: 2 },
        },
    };

    // Temperature & Humidity Chart
    const ctxTH = document.getElementById('chartTempHum');
    if (ctxTH) {
        chartTempHum = new Chart(ctxTH, {
            type: 'line',
            data: {
                labels: state.history.labels,
                datasets: [
                    {
                        label: 'Temp (°C)',
                        data: state.history.temp,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239,68,68,0.08)',
                        fill: true,
                    },
                    {
                        label: 'Humidity (%)',
                        data: state.history.hum,
                        borderColor: '#06b6d4',
                        backgroundColor: 'rgba(6,182,212,0.08)',
                        fill: true,
                    },
                ],
            },
            options: { ...commonOpts },
        });
    }

    // Soil Moisture Chart
    const ctxS = document.getElementById('chartSoil');
    if (ctxS) {
        chartSoil = new Chart(ctxS, {
            type: 'line',
            data: {
                labels: state.history.labels,
                datasets: [
                    {
                        label: 'Soil Moisture (%)',
                        data: state.history.soil,
                        borderColor: '#22c55e',
                        backgroundColor: 'rgba(34,197,94,0.1)',
                        fill: true,
                    },
                ],
            },
            options: {
                ...commonOpts,
                plugins: {
                    ...commonOpts.plugins,
                    legend: { display: false },
                },
            },
        });
    }

    // CO₂ & Light Chart
    const ctxCL = document.getElementById('chartCo2Light');
    if (ctxCL) {
        chartCo2Light = new Chart(ctxCL, {
            type: 'line',
            data: {
                labels: state.history.labels,
                datasets: [
                    {
                        label: 'CO₂ (ppm)',
                        data: state.history.co2,
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139,92,246,0.08)',
                        fill: true,
                        yAxisID: 'y',
                    },
                    {
                        label: 'Light (lx)',
                        data: state.history.light,
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245,158,11,0.08)',
                        fill: true,
                        yAxisID: 'y1',
                    },
                ],
            },
            options: {
                ...commonOpts,
                scales: {
                    ...commonOpts.scales,
                    y: {
                        ...commonOpts.scales.y,
                        position: 'left',
                    },
                    y1: {
                        ...commonOpts.scales.y,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                    },
                },
            },
        });
    }
}

// ---- Update Sensor Readings (Simulated) ----
function simulateSensors() {
    state.temperature = clamp(state.temperature + rand(-0.5, 0.5), 22, 38);
    state.humidity = clamp(state.humidity + rand(-1, 1), 30, 85);
    state.soilMoisture = clamp(state.soilMoisture + rand(-0.8, 0.8), 15, 80);
    state.co2 = clamp(state.co2 + rand(-15, 15), 350, 1500);
    state.light = clamp(state.light + rand(-20, 20), 50, 1200);
    state.aqi = clamp(state.aqi + rand(-3, 3), 20, 200);
    state.rain = Math.random() < 0.03;
    state.motion = Math.random() < 0.05;
}

function updateDashboard() {
    // Hero sensor cards
    const heroTemp = $('#heroTemp');
    const heroHum = $('#heroHum');
    const heroSoil = $('#heroSoil');
    const heroCo2 = $('#heroCo2');
    const heroLight = $('#heroLight');
    const heroRain = $('#heroRain');

    if (heroTemp) heroTemp.textContent = state.temperature.toFixed(1) + '°C';
    if (heroHum) heroHum.textContent = Math.round(state.humidity) + '%';
    if (heroSoil) heroSoil.textContent = Math.round(state.soilMoisture) + '%';
    if (heroCo2) heroCo2.textContent = Math.round(state.co2) + ' ppm';
    if (heroLight) heroLight.textContent = Math.round(state.light) + ' lx';
    if (heroRain) heroRain.textContent = state.rain ? 'Wet' : 'Dry';

    // Dashboard sensor cards
    const dashTemp = $('#dashTemp');
    const dashHum = $('#dashHum');
    const dashSoil = $('#dashSoil');
    const dashCo2 = $('#dashCo2');
    const dashLight = $('#dashLight');
    const dashRain = $('#dashRain');
    const dashMotion = $('#dashMotion');
    const dashAqi = $('#dashAqi');

    if (dashTemp) dashTemp.textContent = state.temperature.toFixed(1) + '°C';
    if (dashHum) dashHum.textContent = state.humidity.toFixed(1) + '%';
    if (dashSoil) dashSoil.textContent = state.soilMoisture.toFixed(1) + '%';
    if (dashCo2) dashCo2.textContent = Math.round(state.co2) + ' ppm';
    if (dashLight) dashLight.textContent = Math.round(state.light) + ' lx';
    if (dashRain) dashRain.textContent = state.rain ? 'Raining ⛈️' : 'Dry';
    if (dashMotion) dashMotion.textContent = state.motion ? 'Motion detected! ⚠️' : 'No motion';
    if (dashAqi) {
        let aqLabel = 'Good';
        if (state.aqi > 150) aqLabel = 'Unhealthy';
        else if (state.aqi > 100) aqLabel = 'Moderate';
        dashAqi.textContent = `${aqLabel} · ${Math.round(state.aqi)} AQI`;
    }

    // Update progress bars
    const tempBar = $('.temp-bar');
    const humBar = $('.hum-bar');
    const soilBar = $('.soil-bar');
    const co2Bar = $('.co2-bar');
    const lightBar = $('.light-bar');

    if (tempBar) tempBar.style.width = `${(state.temperature / 50) * 100}%`;
    if (humBar) humBar.style.width = `${state.humidity}%`;
    if (soilBar) soilBar.style.width = `${state.soilMoisture}%`;
    if (co2Bar) co2Bar.style.width = `${(state.co2 / 1500) * 100}%`;
    if (lightBar) lightBar.style.width = `${(state.light / 1200) * 100}%`;

    // Update badges
    updateBadge('#cardTemp .sc-badge', state.temperature, 32, 36);
    updateBadge('#cardHum .sc-badge', state.humidity, 75, 85);
    updateBadge('#cardSoil .sc-badge', state.soilMoisture < 30 ? 100 : 0, 50, 80);
    updateBadge('#cardCo2 .sc-badge', state.co2, 1000, 1200);
    updateBadge('#cardLight .sc-badge', state.light < 500 ? 100 : 0, 50, 80);
}

function updateBadge(selector, value, warnThresh, dangerThresh) {
    const badge = $(selector);
    if (!badge) return;
    if (value >= dangerThresh) {
        badge.className = 'sc-badge danger';
        badge.textContent = 'Alert';
    } else if (value >= warnThresh) {
        badge.className = 'sc-badge warning';
        badge.textContent = 'Warning';
    } else {
        badge.className = 'sc-badge normal';
        badge.textContent = 'Normal';
    }
}

// ---- Automation Logic ----
function runAutomation() {
    if (!state.autoMode) return;

    const prevState = { ...state.devices };

    // Soil dry → pump ON
    if (state.soilMoisture < 30) {
        state.devices.pump = true;
    } else if (state.soilMoisture > 70) {
        state.devices.pump = false;
    }

    // Temperature high → fan ON
    if (state.temperature > 32 || state.humidity > 80) {
        state.devices.fan = true;
    } else if (state.temperature < 28 && state.humidity < 70) {
        state.devices.fan = false;
    }

    // Light low → grow light ON
    if (state.light < 500) {
        state.devices.light = true;
    } else if (state.light > 600) {
        state.devices.light = false;
    }

    // CO₂ high → ventilation ON
    if (state.co2 > 1200) {
        state.devices.vent = true;
    } else if (state.co2 < 800) {
        state.devices.vent = false;
    }

    // Rain → pump OFF
    if (state.rain) {
        state.devices.pump = false;
    }

    // Update device toggles in UI
    $$('.device-toggle').forEach((toggle) => {
        const dev = toggle.dataset.device;
        if (state.devices[dev] !== undefined) {
            toggle.checked = state.devices[dev];
            const card = toggle.closest('.device-card');
            if (card) {
                card.classList.toggle('active', state.devices[dev]);
            }
        }
    });

    // Generate alerts for state changes
    for (const key in state.devices) {
        if (state.devices[key] !== prevState[key]) {
            const action = state.devices[key] ? 'ON' : 'OFF';
            addAlert(`${capitalize(key)} turned ${action} automatically`, state.devices[key] ? 'warning' : 'info');
        }
    }

    // Environmental alerts
    if (state.temperature > 36) addAlert('⚠️ Temperature critically high: ' + state.temperature.toFixed(1) + '°C', 'danger');
    if (state.co2 > 1200) addAlert('⚠️ CO₂ level exceeded 1200 ppm', 'danger');
    if (state.soilMoisture < 20) addAlert('⚠️ Soil extremely dry: ' + Math.round(state.soilMoisture) + '%', 'danger');
    if (state.rain) addAlert('🌧️ Rain detected — Pump disabled', 'warning');
    if (state.motion) addAlert('📡 Motion detected near greenhouse!', 'warning');
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ---- Alert System ----
let alertCount = 0;
function addAlert(message, type = 'info') {
    const alertsList = $('#alertsList');
    if (!alertsList) return;

    alertCount++;
    if (alertCount > 20) {
        // Remove old alerts to prevent memory issues
        const items = alertsList.querySelectorAll('.alert-item');
        if (items.length > 15) {
            for (let i = 0; i < items.length - 15; i++) {
                items[i].remove();
            }
        }
    }

    const now = new Date();
    const h = now.getHours() % 12 || 12;
    const m = now.getMinutes().toString().padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    const timeStr = `${h}:${m} ${ampm}`;

    const alertEl = document.createElement('div');
    alertEl.className = `alert-item ${type}`;
    alertEl.innerHTML = `
        <div class="alert-dot"></div>
        <div class="alert-content">
            <span class="alert-msg">${message}</span>
            <span class="alert-time">${timeStr}</span>
        </div>
    `;

    alertEl.style.opacity = '0';
    alertEl.style.transform = 'translateX(-10px)';
    alertsList.prepend(alertEl);

    requestAnimationFrame(() => {
        alertEl.style.transition = 'all 0.3s ease';
        alertEl.style.opacity = '1';
        alertEl.style.transform = 'translateX(0)';
    });
}

// ---- Update Charts ----
function updateCharts() {
    const now = new Date();
    const h = now.getHours() % 12 || 12;
    const m = now.getMinutes().toString().padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    const label = `${h.toString().padStart(2, '0')}:${m} ${ampm}`;

    // Push new data
    state.history.labels.push(label);
    state.history.temp.push(state.temperature);
    state.history.hum.push(state.humidity);
    state.history.soil.push(state.soilMoisture);
    state.history.co2.push(state.co2);
    state.history.light.push(state.light);

    // Keep max 30 data points
    const maxPoints = 30;
    if (state.history.labels.length > maxPoints) {
        state.history.labels.shift();
        state.history.temp.shift();
        state.history.hum.shift();
        state.history.soil.shift();
        state.history.co2.shift();
        state.history.light.shift();
    }

    if (chartTempHum) {
        chartTempHum.data.labels = state.history.labels;
        chartTempHum.data.datasets[0].data = state.history.temp;
        chartTempHum.data.datasets[1].data = state.history.hum;
        chartTempHum.update('none');
    }

    if (chartSoil) {
        chartSoil.data.labels = state.history.labels;
        chartSoil.data.datasets[0].data = state.history.soil;
        chartSoil.update('none');
    }

    if (chartCo2Light) {
        chartCo2Light.data.labels = state.history.labels;
        chartCo2Light.data.datasets[0].data = state.history.co2;
        chartCo2Light.data.datasets[1].data = state.history.light;
        chartCo2Light.update('none');
    }
}

// ---- Main Update Loop ----
function mainLoop() {
    simulateSensors();
    updateDashboard();
    runAutomation();
    updateCharts();
}

// ---- Navbar Scroll Effect ----
function initNavbar() {
    const navbar = $('#navbar');
    const backToTop = $('#backToTop');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        if (navbar) navbar.classList.toggle('scrolled', scrollY > 20);
        if (backToTop) backToTop.classList.toggle('visible', scrollY > 400);
    });

    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// ---- Mobile Menu Toggle ----
function initMobileMenu() {
    const toggle = $('#mobileToggle');
    const links = $('#navLinks');

    if (toggle && links) {
        toggle.addEventListener('click', () => {
            links.classList.toggle('open');
            const spans = toggle.querySelectorAll('span');
            if (links.classList.contains('open')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
            } else {
                spans[0].style.transform = '';
                spans[1].style.opacity = '';
                spans[2].style.transform = '';
            }
        });

        // Close menu on link click
        links.querySelectorAll('.nav-link').forEach((link) => {
            link.addEventListener('click', () => {
                links.classList.remove('open');
                const spans = toggle.querySelectorAll('span');
                spans[0].style.transform = '';
                spans[1].style.opacity = '';
                spans[2].style.transform = '';
            });
        });
    }
}

// ---- Smooth Scroll for Nav Links ----
function initSmoothScroll() {
    $$('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (e) => {
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// ---- Device Toggle Handlers ----
function initDeviceToggles() {
    $$('.device-toggle').forEach((toggle) => {
        toggle.addEventListener('change', (e) => {
            const dev = e.target.dataset.device;
            state.devices[dev] = e.target.checked;
            const card = e.target.closest('.device-card');
            if (card) card.classList.toggle('active', e.target.checked);

            const action = e.target.checked ? 'ON' : 'OFF';
            addAlert(`${capitalize(dev)} manually turned ${action}`, 'info');
            showToast(`${capitalize(dev)} ${action}`);
        });
    });

    // Auto mode toggle
    const autoToggle = $('#autoMode');
    if (autoToggle) {
        autoToggle.addEventListener('change', (e) => {
            state.autoMode = e.target.checked;
            showToast(`Auto Mode ${state.autoMode ? 'Enabled' : 'Disabled'}`);
            addAlert(`Auto Mode ${state.autoMode ? 'enabled' : 'disabled'}`, 'info');
        });
    }
}

// ---- Toast Notifications ----
let toastTimer = null;
function showToast(message) {
    let toast = $('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('show');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// ---- Contact Form ----
function initContactForm() {
    const form = $('#contactForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Message sent successfully! ✅');
            form.reset();
        });
    }
}

// ---- Stat Counter Animation ----
function animateCounters() {
    $$('.stat-number[data-count]').forEach((el) => {
        const target = parseInt(el.dataset.count);
        let current = 0;
        const step = Math.ceil(target / 40);
        const interval = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(interval);
            }
            el.textContent = current;
        }, 40);
    });
}

// ---- Scroll Reveal Animations ----
function initScrollReveal() {
    const revealElements = [
        ...$$('.sensor-card'),
        ...$$('.sec-sensor-card'),
        ...$$('.chart-card'),
        ...$$('.feature-card'),
        ...$$('.future-card'),
        ...$$('.tech-item'),
        ...$$('.app-chip'),
        ...$$('.device-card'),
        ...$$('.rule-card'),
        ...$$('.arch-node'),
        ...$$('.wf-step'),
        ...$$('.info-item'),
    ];

    revealElements.forEach((el) => el.classList.add('reveal'));

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry, idx) => {
                if (entry.isIntersecting) {
                    // Stagger the animation
                    const delay = (Array.from(entry.target.parentElement.children).indexOf(entry.target)) * 80;
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, Math.min(delay, 500));
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    revealElements.forEach((el) => observer.observe(el));
}

// ---- Active Nav Link Highlight ----
function initActiveNavHighlight() {
    const sections = $$('section[id]');
    const navLinks = $$('.nav-link');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach((section) => {
            const top = section.offsetTop - 100;
            if (window.scrollY >= top) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach((link) => {
            link.style.color = '';
            link.style.background = '';
            if (link.getAttribute('href') === '#' + current) {
                link.style.color = '#15803d';
                link.style.background = '#f0fdf4';
            }
        });
    });
}

// ---- Update Alert Timestamp ----
function updateAlertTime() {
    const alertTime = $('#alertTime');
    if (alertTime) {
        const now = new Date();
        const h = now.getHours() % 12 || 12;
        const m = now.getMinutes().toString().padStart(2, '0');
        const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
        alertTime.textContent = `${h}:${m} ${ampm}`;
    }
}

// ---- Particle Effect for Hero (subtle background dots) ----
function initParticles() {
    const hero = $('.hero');
    if (!hero) return;

    for (let i = 0; i < 20; i++) {
        const dot = document.createElement('div');
        dot.style.cssText = `
            position: absolute;
            width: ${rand(3, 7)}px;
            height: ${rand(3, 7)}px;
            background: rgba(255,255,255,${rand(0.05, 0.15)});
            border-radius: 50%;
            top: ${rand(0, 100)}%;
            left: ${rand(0, 100)}%;
            pointer-events: none;
            animation: floatParticle ${rand(10, 25)}s ease-in-out infinite;
            animation-delay: ${rand(0, 10)}s;
        `;
        hero.appendChild(dot);
    }

    // Add CSS animation for particles
    if (!$('#particleStyles')) {
        const style = document.createElement('style');
        style.id = 'particleStyles';
        style.textContent = `
            @keyframes floatParticle {
                0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.1; }
                25% { transform: translate(${rand(-30, 30)}px, ${rand(-40, -20)}px) scale(1.2); opacity: 0.2; }
                50% { transform: translate(${rand(-20, 20)}px, ${rand(-50, -30)}px) scale(0.8); opacity: 0.15; }
                75% { transform: translate(${rand(-40, 40)}px, ${rand(-30, -10)}px) scale(1.1); opacity: 0.1; }
            }
        `;
        document.head.appendChild(style);
    }
}

// ---- ESP32 Status Blink ----
function initEspStatus() {
    const statusText = $('.status-text');
    if (!statusText) return;

    // Occasionally show "syncing" state
    setInterval(() => {
        if (Math.random() < 0.1) {
            statusText.textContent = 'Syncing...';
            statusText.style.color = '#f59e0b';
            setTimeout(() => {
                statusText.textContent = 'ESP32 Online';
                statusText.style.color = '';
            }, 800);
        }
    }, 10000);
}

// ---- Sensor Card Pulse Animation on Value Change ----
function pulseCard(cardId) {
    const card = $(cardId);
    if (!card) return;
    card.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.3)';
    setTimeout(() => {
        card.style.boxShadow = '';
    }, 500);
}

// ---- Rain/Motion Visual Feedback ----
function updateSecondaryVisuals() {
    const rainCard = $$('.sec-sensor-card')[0];
    const motionCard = $$('.sec-sensor-card')[1];

    if (rainCard) {
        if (state.rain) {
            rainCard.style.borderColor = '#3b82f6';
            rainCard.style.background = '#eff6ff';
        } else {
            rainCard.style.borderColor = '';
            rainCard.style.background = '';
        }
    }

    if (motionCard) {
        if (state.motion) {
            motionCard.style.borderColor = '#f59e0b';
            motionCard.style.background = '#fffbeb';
        } else {
            motionCard.style.borderColor = '';
            motionCard.style.background = '';
        }
    }
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Init all systems
    initHistory();
    createCharts();
    initNavbar();
    initMobileMenu();
    initSmoothScroll();
    initDeviceToggles();
    initContactForm();
    initScrollReveal();
    initActiveNavHighlight();
    initParticles();
    initEspStatus();
    updateAlertTime();

    // Initial dashboard update
    updateDashboard();

    // Animate stats when hero comes into view
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                animateCounters();
                statsObserver.unobserve(entry.target);
            }
        });
    });
    const statsBar = $('.stats-bar');
    if (statsBar) statsObserver.observe(statsBar);

    // Main update loop — every 5 seconds
    setInterval(() => {
        mainLoop();
        updateSecondaryVisuals();

        // Randomly pulse a card
        const cards = ['#cardTemp', '#cardHum', '#cardSoil', '#cardCo2', '#cardLight'];
        pulseCard(cards[Math.floor(Math.random() * cards.length)]);
    }, 5000);

    // Update time every minute
    setInterval(updateAlertTime, 60000);

    console.log('%c🌿 Smart Greenhouse Hub Initialized', 'color: #22c55e; font-size: 16px; font-weight: bold;');
    console.log('%cAll sensors active • Auto-mode enabled • Cloud connected', 'color: #6b7280; font-size: 12px;');
});
