// Configuración de Supabase
const SUPABASE_URL = 'https://baucinbexifmglfhsvsl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhdWNpbmJleGlmbWdsZmhzdnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNDM0NTUsImV4cCI6MjA2ODkxOTQ1NX0.XzwzlxKPT2aSWDco3dPhe31TQxaPPkM6XLzFd1dH3x0';

// Inicializar Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Estado global de la aplicación
let currentUser = null;
let currentAdventure = null;
let currentStations = [];
let editingStationIndex = -1;
let gameState = {
    adventure: null,
    currentStationIndex: 0,
    score: 0,
    selectedAnswer: null
};
let multiplayerState = {
    room: null,
    session: null,
    playerId: null,
    playerName: null
};
let locationMap = null;
let selectedLocation = null;

// Generar ID único para jugadores no autenticados
function generatePlayerId() {
    return 'player_' + Math.random().toString(36).substr(2, 9);
}

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar sesión de usuario
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        updateAuthUI();
    }

    // Configurar listeners de autenticación
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
            currentUser = session.user;
            updateAuthUI();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            updateAuthUI();
            showScreen('main-screen');
        }
    });

    // Configurar event listeners
    setupEventListeners();

    // Mostrar pantalla principal después de un breve delay
    setTimeout(() => {
        hideScreen('loading-screen');
        showScreen('main-screen');
    }, 1500);
});

// Configurar todos los event listeners
function setupEventListeners() {
    // Navegación principal
    document.getElementById('create-adventure-btn').addEventListener('click', () => {
        if (!currentUser) {
            showAuthScreen('login');
            return;
        }
        showCreateScreen();
    });

    document.getElementById('play-adventure-btn').addEventListener('click', showAdventuresScreen);
    document.getElementById('multiplayer-btn').addEventListener('click', showMultiplayerScreen);

    // Autenticación
    document.getElementById('login-btn').addEventListener('click', () => showAuthScreen('login'));
    document.getElementById('register-btn').addEventListener('click', () => showAuthScreen('register'));
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('auth-back-btn').addEventListener('click', () => showScreen('main-screen'));
    document.getElementById('auth-switch-btn').addEventListener('click', toggleAuthMode);
    document.getElementById('auth-form').addEventListener('submit', handleAuth);

    // Creación de aventuras
    document.getElementById('create-back-btn').addEventListener('click', () => showScreen('main-screen'));
    document.getElementById('save-adventure-btn').addEventListener('click', saveAdventure);
    document.getElementById('preview-adventure-btn').addEventListener('click', previewAdventure);
    document.getElementById('add-station-btn').addEventListener('click', () => showStationModal());

    // Lista de aventuras
    document.getElementById('adventures-back-btn').addEventListener('click', () => showScreen('main-screen'));

    // Juego
    document.getElementById('game-back-btn').addEventListener('click', () => showScreen('adventures-screen'));

    // Multijugador
    document.getElementById('multiplayer-back-btn').addEventListener('click', () => showScreen('main-screen'));
    document.getElementById('create-room-btn').addEventListener('click', showAdventureSelectModal);
    document.getElementById('join-room-btn').addEventListener('click', joinRoom);

    // Sala de juego
    document.getElementById('room-back-btn').addEventListener('click', leaveRoom);
    document.getElementById('start-game-btn').addEventListener('click', startMultiplayerGame);

    // Modal de estación
    document.getElementById('station-modal-close').addEventListener('click', hideStationModal);
    document.getElementById('station-cancel-btn').addEventListener('click', hideStationModal);
    document.getElementById('station-form').addEventListener('submit', saveStation);
    document.getElementById('station-type').addEventListener('change', updateStationFields);

    // Modal de selección de aventura
    document.getElementById('adventure-select-close').addEventListener('click', hideAdventureSelectModal);

    // Modal de nombre de jugador
    document.getElementById('player-name-cancel').addEventListener('click', hidePlayerNameModal);
    document.getElementById('player-name-confirm').addEventListener('click', confirmPlayerName);
}

// Funciones de navegación
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');
}

function hideScreen(screenId) {
    document.getElementById(screenId).classList.add('hidden');
}

// Funciones de autenticación
function updateAuthUI() {
    const authButtons = document.getElementById('auth-buttons');
    const userInfo = document.getElementById('user-info');
    const userEmail = document.getElementById('user-email');

    if (currentUser) {
        authButtons.classList.add('hidden');
        userInfo.classList.remove('hidden');
        userEmail.textContent = currentUser.email;
    } else {
        authButtons.classList.remove('hidden');
        userInfo.classList.add('hidden');
    }
}

function showAuthScreen(mode) {
    const title = document.getElementById('auth-title');
    const submitBtn = document.getElementById('auth-submit-btn');
    const switchText = document.getElementById('auth-switch-text');
    const switchBtn = document.getElementById('auth-switch-btn');

    if (mode === 'login') {
        title.textContent = 'Iniciar Sesión';
        submitBtn.textContent = 'Iniciar Sesión';
        switchText.textContent = '¿No tienes cuenta?';
        switchBtn.textContent = 'Registrarse';
        switchBtn.dataset.mode = 'register';
    } else {
        title.textContent = 'Registrarse';
        submitBtn.textContent = 'Crear Cuenta';
        switchText.textContent = '¿Ya tienes cuenta?';
        switchBtn.textContent = 'Iniciar Sesión';
        switchBtn.dataset.mode = 'login';
    }

    showScreen('auth-screen');
}

function toggleAuthMode() {
    const mode = document.getElementById('auth-switch-btn').dataset.mode;
    showAuthScreen(mode);
}

async function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const isLogin = document.getElementById('auth-title').textContent === 'Iniciar Sesión';

    try {
        let result;
        if (isLogin) {
            result = await supabase.auth.signInWithPassword({ email, password });
        } else {
            result = await supabase.auth.signUp({ email, password });
        }

        if (result.error) {
            showAlert(result.error.message, 'error');
        } else {
            if (!isLogin) {
                showAlert('Cuenta creada exitosamente. Revisa tu email para confirmar.', 'success');
            }
            showScreen('main-screen');
        }
    } catch (error) {
        showAlert('Error de conexión', 'error');
    }
}

async function logout() {
    await supabase.auth.signOut();
}

// Funciones de creación de aventuras
function showCreateScreen() {
    currentAdventure = null;
    currentStations = [];
    document.getElementById('adventure-name').value = '';
    document.getElementById('adventure-description').value = '';
    updateStationsList();
    showScreen('create-screen');
}

async function saveAdventure() {
    const name = document.getElementById('adventure-name').value.trim();
    const description = document.getElementById('adventure-description').value.trim();

    if (!name) {
        showAlert('El nombre de la aventura es requerido', 'error');
        return;
    }

    if (currentStations.length === 0) {
        showAlert('Agrega al menos una estación a tu aventura', 'error');
        return;
    }

    try {
        const adventureData = {
            nombre: name,
            descripcion: description,
            estaciones: currentStations,
            creador_id: currentUser.id
        };

        let result;
        if (currentAdventure) {
            result = await supabase
                .from('aventuras')
                .update(adventureData)
                .eq('id', currentAdventure.id)
                .select();
        } else {
            result = await supabase
                .from('aventuras')
                .insert([adventureData])
                .select();
        }

        if (result.error) {
            showAlert('Error al guardar la aventura', 'error');
        } else {
            showAlert('Aventura guardada exitosamente', 'success');
            currentAdventure = result.data[0];
        }
    } catch (error) {
        showAlert('Error de conexión', 'error');
    }
}

function previewAdventure() {
    if (currentStations.length === 0) {
        showAlert('Agrega al menos una estación para previsualizar', 'error');
        return;
    }

    gameState = {
        adventure: {
            nombre: document.getElementById('adventure-name').value || 'Vista Previa',
            descripcion: document.getElementById('adventure-description').value || '',
            estaciones: currentStations
        },
        currentStationIndex: 0,
        score: 0,
        selectedAnswer: null
    };

    startGame();
}

// Funciones de estaciones
function showStationModal(index = -1) {
    editingStationIndex = index;
    const modal = document.getElementById('station-modal');
    const title = document.getElementById('station-modal-title');
    
    if (index >= 0) {
        title.textContent = 'Editar Estación';
        loadStationData(currentStations[index]);
    } else {
        title.textContent = 'Crear Estación';
        clearStationForm();
    }

    modal.classList.remove('hidden');
    updateStationFields();
}

function hideStationModal() {
    document.getElementById('station-modal').classList.add('hidden');
    if (locationMap) {
        locationMap.remove();
        locationMap = null;
    }
}

function updateStationFields() {
    const type = document.getElementById('station-type').value;
    const fields = document.querySelectorAll('.station-fields');
    
    fields.forEach(field => field.classList.add('hidden'));
    document.getElementById(`${type}-fields`).classList.remove('hidden');

    if (type === 'location' && !locationMap) {
        setTimeout(initLocationMap, 100);
    }
}

function initLocationMap() {
    const mapContainer = document.getElementById('location-map');
    if (!mapContainer || locationMap) return;

    locationMap = L.map('location-map').setView([40.4168, -3.7038], 13); // Madrid por defecto

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(locationMap);

    let marker = null;

    locationMap.on('click', function(e) {
        const { lat, lng } = e.latlng;
        
        if (marker) {
            locationMap.removeLayer(marker);
        }
        
        marker = L.marker([lat, lng]).addTo(locationMap);
        selectedLocation = { lat, lng };
        
        document.getElementById('location-latitude').value = lat.toFixed(6);
        document.getElementById('location-longitude').value = lng.toFixed(6);
    });

    // Si estamos editando, mostrar la ubicación existente
    if (editingStationIndex >= 0) {
        const station = currentStations[editingStationIndex];
        if (station.latitude && station.longitude) {
            const lat = station.latitude;
            const lng = station.longitude;
            locationMap.setView([lat, lng], 15);
            marker = L.marker([lat, lng]).addTo(locationMap);
            selectedLocation = { lat, lng };
        }
    }
}

function loadStationData(station) {
    document.getElementById('station-name').value = station.name;
    document.getElementById('station-type').value = station.type;

    switch (station.type) {
        case 'quiz':
            document.getElementById('quiz-question').value = station.question || '';
            station.answers?.forEach((answer, index) => {
                const input = document.getElementById(`quiz-answer-${index + 1}`);
                if (input) input.value = answer;
            });
            document.getElementById('quiz-correct').value = station.correctAnswer || 0;
            break;
        case 'mission':
            document.getElementById('mission-description').value = station.description || '';
            document.getElementById('mission-hint').value = station.hint || '';
            break;
        case 'qr':
            document.getElementById('qr-code').value = station.code || '';
            document.getElementById('qr-message').value = station.message || '';
            break;
        case 'location':
            document.getElementById('location-latitude').value = station.latitude || '';
            document.getElementById('location-longitude').value = station.longitude || '';
            document.getElementById('location-radius').value = station.radius || 50;
            document.getElementById('location-message').value = station.message || '';
            selectedLocation = station.latitude && station.longitude ? 
                { lat: station.latitude, lng: station.longitude } : null;
            break;
    }
}

function clearStationForm() {
    document.getElementById('station-form').reset();
    selectedLocation = null;
}

function saveStation(e) {
    e.preventDefault();
    
    const name = document.getElementById('station-name').value.trim();
    const type = document.getElementById('station-type').value;

    if (!name) {
        showAlert('El nombre de la estación es requerido', 'error');
        return;
    }

    const station = { name, type };

    switch (type) {
        case 'quiz':
            const question = document.getElementById('quiz-question').value.trim();
            const answers = [
                document.getElementById('quiz-answer-1').value.trim(),
                document.getElementById('quiz-answer-2').value.trim(),
                document.getElementById('quiz-answer-3').value.trim(),
                document.getElementById('quiz-answer-4').value.trim()
            ].filter(answer => answer);

            if (!question || answers.length < 2) {
                showAlert('La pregunta y al menos 2 respuestas son requeridas', 'error');
                return;
            }

            station.question = question;
            station.answers = answers;
            station.correctAnswer = parseInt(document.getElementById('quiz-correct').value);
            break;

        case 'mission':
            const description = document.getElementById('mission-description').value.trim();
            if (!description) {
                showAlert('La descripción de la misión es requerida', 'error');
                return;
            }
            station.description = description;
            station.hint = document.getElementById('mission-hint').value.trim();
            break;

        case 'qr':
            const code = document.getElementById('qr-code').value.trim();
            const message = document.getElementById('qr-message').value.trim();
            if (!code || !message) {
                showAlert('El código QR y el mensaje son requeridos', 'error');
                return;
            }
            station.code = code;
            station.message = message;
            break;

        case 'location':
            if (!selectedLocation) {
                showAlert('Selecciona una ubicación en el mapa', 'error');
                return;
            }
            station.latitude = selectedLocation.lat;
            station.longitude = selectedLocation.lng;
            station.radius = parseInt(document.getElementById('location-radius').value) || 50;
            station.message = document.getElementById('location-message').value.trim();
            break;
    }

    if (editingStationIndex >= 0) {
        currentStations[editingStationIndex] = station;
    } else {
        currentStations.push(station);
    }

    updateStationsList();
    hideStationModal();
    showAlert('Estación guardada exitosamente', 'success');
}

function updateStationsList() {
    const container = document.getElementById('stations-list');
    container.innerHTML = '';

    currentStations.forEach((station, index) => {
        const stationElement = document.createElement('div');
        stationElement.className = 'station-item';
        stationElement.innerHTML = `
            <div class="station-info">
                <h4>${station.name}</h4>
                <p>${getStationDescription(station)}</p>
            </div>
            <div class="station-type">${getStationTypeLabel(station.type)}</div>
            <div class="station-actions">
                <button class="edit-btn" onclick="showStationModal(${index})">✏️</button>
                <button class="delete-btn" onclick="deleteStation(${index})">🗑️</button>
            </div>
        `;
        container.appendChild(stationElement);
    });
}

function getStationDescription(station) {
    switch (station.type) {
        case 'quiz':
            return station.question || 'Pregunta de quiz';
        case 'mission':
            return station.description || 'Misión a completar';
        case 'qr':
            return `Código QR: ${station.code || 'Sin código'}`;
        case 'location':
            return `Ubicación GPS (${station.radius || 50}m de radio)`;
        default:
            return 'Estación personalizada';
    }
}

function getStationTypeLabel(type) {
    const labels = {
        quiz: 'Quiz',
        mission: 'Misión',
        qr: 'Código QR',
        location: 'Ubicación GPS'
    };
    return labels[type] || type;
}

function deleteStation(index) {
    if (confirm('¿Estás seguro de que quieres eliminar esta estación?')) {
        currentStations.splice(index, 1);
        updateStationsList();
        showAlert('Estación eliminada', 'success');
    }
}

// Funciones de lista de aventuras
async function showAdventuresScreen() {
    showScreen('adventures-screen');
    await loadAdventures();
}

async function loadAdventures() {
    try {
        const { data: adventures, error } = await supabase
            .from('aventuras')
            .select('*')
            .order('fecha_creacion', { ascending: false });

        if (error) {
            showAlert('Error al cargar las aventuras', 'error');
            return;
        }

        displayAdventures(adventures);
    } catch (error) {
        showAlert('Error de conexión', 'error');
    }
}

function displayAdventures(adventures) {
    const container = document.getElementById('adventures-list');
    container.innerHTML = '';

    if (adventures.length === 0) {
        container.innerHTML = '<p>No hay aventuras disponibles.</p>';
        return;
    }

    adventures.forEach(adventure => {
        const adventureElement = document.createElement('div');
        adventureElement.className = 'adventure-card';
        adventureElement.innerHTML = `
            <h3>${adventure.nombre}</h3>
            <p>${adventure.descripcion || 'Sin descripción'}</p>
            <div class="adventure-meta">
                <span>${adventure.estaciones?.length || 0} estaciones</span>
                <span>${new Date(adventure.fecha_creacion).toLocaleDateString()}</span>
            </div>
        `;
        adventureElement.addEventListener('click', () => selectAdventure(adventure));
        container.appendChild(adventureElement);
    });
}

function selectAdventure(adventure) {
    gameState = {
        adventure: adventure,
        currentStationIndex: 0,
        score: 0,
        selectedAnswer: null
    };
    startGame();
}

// Funciones de juego
function startGame() {
    showScreen('game-screen');
    updateGameUI();
    loadCurrentStation();
}

function updateGameUI() {
    document.getElementById('game-adventure-name').textContent = gameState.adventure.nombre;
    document.getElementById('game-station-info').textContent = 
        `Estación ${gameState.currentStationIndex + 1}/${gameState.adventure.estaciones.length}`;
    document.getElementById('game-score').textContent = `Puntos: ${gameState.score}`;
}

function loadCurrentStation() {
    const station = gameState.adventure.estaciones[gameState.currentStationIndex];
    const container = document.getElementById('station-content');

    if (!station) {
        // Juego completado
        container.innerHTML = `
            <div class="game-complete">
                <h3>🏆 ¡Aventura Completada!</h3>
                <p>Has completado "${gameState.adventure.nombre}" con éxito.</p>
                <p><strong>Puntuación Final: ${gameState.score} puntos</strong></p>
                <button class="btn btn-primary" onclick="showScreen('adventures-screen')">Otras Aventuras</button>
                <button class="btn btn-secondary" onclick="restartGame()">Jugar de Nuevo</button>
            </div>
        `;
        return;
    }

    container.innerHTML = `<h3>${station.name}</h3>`;

    switch (station.type) {
        case 'quiz':
            loadQuizStation(station);
            break;
        case 'mission':
            loadMissionStation(station);
            break;
        case 'qr':
            loadQRStation(station);
            break;
        case 'location':
            loadLocationStation(station);
            break;
    }
}

function loadQuizStation(station) {
    const container = document.getElementById('station-content');
    gameState.selectedAnswer = null;

    container.innerHTML += `
        <p>${station.question}</p>
        <div class="quiz-answers">
            ${station.answers.map((answer, index) => `
                <div class="quiz-answer" data-index="${index}">
                    ${answer}
                </div>
            `).join('')}
        </div>
        <button class="btn btn-primary" id="confirm-answer-btn" disabled>Confirmar Respuesta</button>
    `;

    // Event listeners para las respuestas
    document.querySelectorAll('.quiz-answer').forEach(answer => {
        answer.addEventListener('click', () => selectQuizAnswer(parseInt(answer.dataset.index)));
    });

    document.getElementById('confirm-answer-btn').addEventListener('click', () => submitQuizAnswer(station));
}

function selectQuizAnswer(index) {
    gameState.selectedAnswer = index;
    
    document.querySelectorAll('.quiz-answer').forEach((answer, i) => {
        answer.classList.toggle('selected', i === index);
    });

    document.getElementById('confirm-answer-btn').disabled = false;
}

function submitQuizAnswer(station) {
    const isCorrect = gameState.selectedAnswer === station.correctAnswer;
    
    document.querySelectorAll('.quiz-answer').forEach((answer, i) => {
        if (i === station.correctAnswer) {
            answer.classList.add('correct');
        } else if (i === gameState.selectedAnswer && !isCorrect) {
            answer.classList.add('incorrect');
        }
    });

    if (isCorrect) {
        gameState.score += 100;
        showAlert('¡Respuesta correcta! +100 puntos', 'success');
    } else {
        showAlert('Respuesta incorrecta. La respuesta correcta era: ' + station.answers[station.correctAnswer], 'error');
    }

    setTimeout(() => {
        nextStation();
    }, 2000);
}

function loadMissionStation(station) {
    const container = document.getElementById('station-content');
    
    container.innerHTML += `
        <p>${station.description}</p>
        ${station.hint ? `<p><em>Pista: ${station.hint}</em></p>` : ''}
        <button class="btn btn-primary" onclick="completeMission()">Misión Completada</button>
    `;
}

function completeMission() {
    gameState.score += 150;
    showAlert('¡Misión completada! +150 puntos', 'success');
    setTimeout(nextStation, 1500);
}

function loadQRStation(station) {
    const container = document.getElementById('station-content');
    
    container.innerHTML += `
        <p>Escanea el código QR: <strong>${station.code}</strong></p>
        <div class="form-group">
            <input type="text" id="qr-input" placeholder="Ingresa el código QR">
            <button class="btn btn-primary" onclick="submitQRCode('${station.code}', '${station.message}')">Verificar</button>
        </div>
    `;
}

function submitQRCode(correctCode, message) {
    const input = document.getElementById('qr-input').value.trim();
    
    if (input === correctCode) {
        gameState.score += 75;
        showAlert(`¡Código correcto! ${message} +75 puntos`, 'success');
        setTimeout(nextStation, 2000);
    } else {
        showAlert('Código incorrecto. Inténtalo de nuevo.', 'error');
    }
}

function loadLocationStation(station) {
    const container = document.getElementById('station-content');
    
    container.innerHTML += `
        <p>Dirígete a la ubicación marcada en el mapa</p>
        <div id="game-map" style="height: 300px; margin: 1rem 0;"></div>
        <button class="btn btn-primary" onclick="checkLocation(${station.latitude}, ${station.longitude}, ${station.radius}, '${station.message}')">Verificar Ubicación</button>
    `;

    // Inicializar mapa de juego
    const gameMap = L.map('game-map').setView([station.latitude, station.longitude], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(gameMap);

    // Marcador de destino
    L.marker([station.latitude, station.longitude]).addTo(gameMap);
    
    // Círculo de radio
    L.circle([station.latitude, station.longitude], {
        radius: station.radius,
        fillColor: '#3388ff',
        fillOpacity: 0.2,
        color: '#3388ff'
    }).addTo(gameMap);
}

function checkLocation(targetLat, targetLng, radius, message) {
    if (!navigator.geolocation) {
        showAlert('La geolocalización no está disponible en tu dispositivo', 'error');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            
            const distance = calculateDistance(userLat, userLng, targetLat, targetLng);
            
            if (distance <= radius) {
                gameState.score += 125;
                showAlert(`¡Ubicación alcanzada! ${message} +125 puntos`, 'success');
                setTimeout(nextStation, 2000);
            } else {
                showAlert(`Estás a ${Math.round(distance)}m del objetivo. Acércate más.`, 'warning');
            }
        },
        (error) => {
            showAlert('No se pudo obtener tu ubicación. Verifica los permisos.', 'error');
        }
    );
}

function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

function nextStation() {
    gameState.currentStationIndex++;
    updateGameUI();
    loadCurrentStation();
}

function restartGame() {
    gameState.currentStationIndex = 0;
    gameState.score = 0;
    gameState.selectedAnswer = null;
    updateGameUI();
    loadCurrentStation();
}

// Funciones de multijugador
function showMultiplayerScreen() {
    showScreen('multiplayer-screen');
}

async function showAdventureSelectModal() {
    if (!currentUser) {
        showAuthScreen('login');
        return;
    }

    try {
        const { data: adventures, error } = await supabase
            .from('aventuras')
            .select('*')
            .eq('creador_id', currentUser.id)
            .order('fecha_creacion', { ascending: false });

        if (error) {
            showAlert('Error al cargar tus aventuras', 'error');
            return;
        }

        if (adventures.length === 0) {
            showAlert('Primero debes crear una aventura', 'warning');
            return;
        }

        displayAdventureSelectList(adventures);
        document.getElementById('adventure-select-modal').classList.remove('hidden');
    } catch (error) {
        showAlert('Error de conexión', 'error');
    }
}

function displayAdventureSelectList(adventures) {
    const container = document.getElementById('adventure-select-list');
    container.innerHTML = '';

    adventures.forEach(adventure => {
        const adventureElement = document.createElement('div');
        adventureElement.className = 'adventure-select-item';
        adventureElement.innerHTML = `
            <h4>${adventure.nombre}</h4>
            <p>${adventure.descripcion || 'Sin descripción'}</p>
            <p><small>${adventure.estaciones?.length || 0} estaciones</small></p>
        `;
        adventureElement.addEventListener('click', () => selectAdventureForRoom(adventure));
        container.appendChild(adventureElement);
    });
}

function selectAdventureForRoom(adventure) {
    document.querySelectorAll('.adventure-select-item').forEach(item => {
        item.classList.remove('selected');
    });
    event.target.closest('.adventure-select-item').classList.add('selected');
    
    setTimeout(() => {
        createRoom(adventure);
        hideAdventureSelectModal();
    }, 300);
}

function hideAdventureSelectModal() {
    document.getElementById('adventure-select-modal').classList.add('hidden');
}

async function createRoom(adventure) {
    try {
        const roomCode = generateRoomCode();
        
        const { data: room, error } = await supabase
            .from('salas_multijugador')
            .insert([{
                codigo_sala: roomCode,
                aventura_id: adventure.id,
                host_id: currentUser.id,
                estado_juego: { started: false, current_station_index: 0 }
            }])
            .select()
            .single();

        if (error) {
            showAlert('Error al crear la sala', 'error');
            return;
        }

        multiplayerState.room = room;
        multiplayerState.playerId = currentUser.id;
        multiplayerState.playerName = currentUser.email;

        // Unirse a la propia sala
        await joinRoomSession(room.codigo_sala, currentUser.id, currentUser.email);
        
        showRoomScreen(adventure);
    } catch (error) {
        showAlert('Error de conexión', 'error');
    }
}

function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

async function joinRoom() {
    const roomCode = document.getElementById('room-code-input').value.trim().toUpperCase();
    
    if (!roomCode) {
        showAlert('Ingresa un código de sala', 'error');
        return;
    }

    try {
        const { data: room, error } = await supabase
            .from('salas_multijugador')
            .select(`
                *,
                aventuras (*)
            `)
            .eq('codigo_sala', roomCode)
            .eq('activa', true)
            .single();

        if (error || !room) {
            showAlert('Sala no encontrada o inactiva', 'error');
            return;
        }

        multiplayerState.room = room;
        
        // Si no está autenticado, pedir nombre
        if (!currentUser) {
            multiplayerState.playerId = generatePlayerId();
            showPlayerNameModal(roomCode);
        } else {
            multiplayerState.playerId = currentUser.id;
            multiplayerState.playerName = currentUser.email;
            await joinRoomSession(roomCode, currentUser.id, currentUser.email);
            showRoomScreen(room.aventuras);
        }
    } catch (error) {
        showAlert('Error de conexión', 'error');
    }
}

function showPlayerNameModal(roomCode) {
    document.getElementById('player-name-modal').classList.remove('hidden');
    document.getElementById('player-name-input').focus();
    
    // Guardar el código de sala para usar después
    document.getElementById('player-name-modal').dataset.roomCode = roomCode;
}

function hidePlayerNameModal() {
    document.getElementById('player-name-modal').classList.add('hidden');
}

async function confirmPlayerName() {
    const playerName = document.getElementById('player-name-input').value.trim();
    const roomCode = document.getElementById('player-name-modal').dataset.roomCode;
    
    if (!playerName) {
        showAlert('Ingresa tu nombre', 'error');
        return;
    }

    multiplayerState.playerName = playerName;
    
    try {
        await joinRoomSession(roomCode, multiplayerState.playerId, playerName);
        hidePlayerNameModal();
        
        // Obtener la aventura de la sala
        const { data: room } = await supabase
            .from('salas_multijugador')
            .select(`
                *,
                aventuras (*)
            `)
            .eq('codigo_sala', roomCode)
            .single();
            
        showRoomScreen(room.aventuras);
    } catch (error) {
        showAlert('Error al unirse a la sala', 'error');
    }
}

async function joinRoomSession(roomCode, playerId, playerName) {
    const { data: session, error } = await supabase
        .from('sesiones_jugadores')
        .insert([{
            sala_id: multiplayerState.room.id,
            jugador_id: playerId,
            nombre_jugador: playerName
        }])
        .select()
        .single();

    if (error) {
        // Si el jugador ya está en la sala, obtener su sesión existente
        const { data: existingSession } = await supabase
            .from('sesiones_jugadores')
            .select('*')
            .eq('sala_id', multiplayerState.room.id)
            .eq('jugador_id', playerId)
            .single();
            
        multiplayerState.session = existingSession;
    } else {
        multiplayerState.session = session;
    }
}

function showRoomScreen(adventure) {
    document.getElementById('room-code-display').textContent = multiplayerState.room.codigo_sala;
    document.getElementById('room-adventure-name').textContent = adventure.nombre;
    document.getElementById('room-adventure-description').textContent = adventure.descripcion || 'Sin descripción';
    
    // Mostrar botón de iniciar solo para el host
    const startBtn = document.getElementById('start-game-btn');
    if (currentUser && currentUser.id === multiplayerState.room.host_id) {
        startBtn.style.display = 'block';
    } else {
        startBtn.style.display = 'none';
    }
    
    showScreen('room-screen');
    loadRoomPlayers();
    
    // Configurar polling para actualizaciones de la sala
    startRoomPolling();
}

async function loadRoomPlayers() {
    try {
        const { data: sessions, error } = await supabase
            .from('sesiones_jugadores')
            .select('*')
            .eq('sala_id', multiplayerState.room.id)
            .order('fecha_union', { ascending: true });

        if (error) {
            console.error('Error al cargar jugadores:', error);
            return;
        }

        displayRoomPlayers(sessions);
        displayLeaderboard(sessions);
    } catch (error) {
        console.error('Error de conexión:', error);
    }
}

function displayRoomPlayers(sessions) {
    const container = document.getElementById('players-list');
    container.innerHTML = '';

    sessions.forEach(session => {
        const playerElement = document.createElement('div');
        playerElement.className = 'player-item';
        
        const isHost = session.jugador_id === multiplayerState.room.host_id;
        
        playerElement.innerHTML = `
            <div>
                <div class="player-name">${session.nombre_jugador}</div>
                <div class="player-status">Estación ${session.estacion_actual + 1} - ${session.puntuacion} puntos</div>
            </div>
            ${isHost ? '<div class="host-badge">Host</div>' : ''}
        `;
        
        container.appendChild(playerElement);
    });
}

function displayLeaderboard(sessions) {
    const container = document.getElementById('leaderboard');
    container.innerHTML = '';

    // Ordenar por puntuación y estación actual
    const sortedSessions = [...sessions].sort((a, b) => {
        if (b.puntuacion !== a.puntuacion) {
            return b.puntuacion - a.puntuacion;
        }
        return b.estacion_actual - a.estacion_actual;
    });

    sortedSessions.forEach((session, index) => {
        const leaderboardElement = document.createElement('div');
        leaderboardElement.className = 'leaderboard-item';
        
        leaderboardElement.innerHTML = `
            <div class="leaderboard-position">#${index + 1}</div>
            <div class="leaderboard-name">${session.nombre_jugador}</div>
            <div class="leaderboard-score">${session.puntuacion} pts</div>
        `;
        
        container.appendChild(leaderboardElement);
    });
}

function startRoomPolling() {
    // Actualizar cada 3 segundos
    setInterval(loadRoomPlayers, 3000);
}

async function startMultiplayerGame() {
    if (!currentUser || currentUser.id !== multiplayerState.room.host_id) {
        showAlert('Solo el host puede iniciar el juego', 'error');
        return;
    }

    try {
        const { error } = await supabase
            .from('salas_multijugador')
            .update({
                estado_juego: { started: true, current_station_index: 0 }
            })
            .eq('id', multiplayerState.room.id);

        if (error) {
            showAlert('Error al iniciar el juego', 'error');
            return;
        }

        // Obtener la aventura y comenzar el juego
        const { data: room } = await supabase
            .from('salas_multijugador')
            .select(`
                *,
                aventuras (*)
            `)
            .eq('id', multiplayerState.room.id)
            .single();

        gameState = {
            adventure: room.aventuras,
            currentStationIndex: 0,
            score: 0,
            selectedAnswer: null,
            isMultiplayer: true
        };

        startGame();
    } catch (error) {
        showAlert('Error de conexión', 'error');
    }
}

async function leaveRoom() {
    if (multiplayerState.session) {
        try {
            await supabase
                .from('sesiones_jugadores')
                .delete()
                .eq('id', multiplayerState.session.id);
        } catch (error) {
            console.error('Error al salir de la sala:', error);
        }
    }

    multiplayerState = {
        room: null,
        session: null,
        playerId: null,
        playerName: null
    };

    showScreen('multiplayer-screen');
}

// Funciones de utilidad
function showAlert(message, type = 'info') {
    // Crear elemento de alerta
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    // Agregar al body
    document.body.appendChild(alert);
    
    // Posicionar la alerta
    alert.style.position = 'fixed';
    alert.style.top = '20px';
    alert.style.right = '20px';
    alert.style.zIndex = '10000';
    alert.style.maxWidth = '300px';
    
    // Remover después de 4 segundos
    setTimeout(() => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    }, 4000);
}

// Hacer funciones globales para uso en HTML
window.showStationModal = showStationModal;
window.deleteStation = deleteStation;
window.completeMission = completeMission;
window.submitQRCode = submitQRCode;
window.checkLocation = checkLocation;

