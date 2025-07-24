// Funcionalidad para temporizadores y sistema de pistas en AdventureQuest
// Este archivo maneja los límites de tiempo y las penalizaciones por usar pistas

let gameTimer = {
    interval: null,
    timeLeft: 0,
    isActive: false,
    onTimeUp: null
};

let hintSystem = {
    hintsUsed: 0,
    hintPenalty: 25, // Puntos perdidos por usar una pista
    maxHints: 3 // Máximo de pistas por estación
};

// Iniciar temporizador para una estación
function startStationTimer(timeLimit, onTimeUp) {
    if (!timeLimit || timeLimit <= 0) return;

    gameTimer.timeLeft = timeLimit;
    gameTimer.isActive = true;
    gameTimer.onTimeUp = onTimeUp;

    // Crear elemento del temporizador si no existe
    createTimerDisplay();

    // Actualizar display inicial
    updateTimerDisplay();

    // Iniciar intervalo
    gameTimer.interval = setInterval(() => {
        gameTimer.timeLeft--;
        updateTimerDisplay();

        if (gameTimer.timeLeft <= 0) {
            stopTimer();
            if (gameTimer.onTimeUp) {
                gameTimer.onTimeUp();
            }
        }
    }, 1000);
}

// Detener temporizador
function stopTimer() {
    if (gameTimer.interval) {
        clearInterval(gameTimer.interval);
        gameTimer.interval = null;
    }
    gameTimer.isActive = false;
    
    // Remover display del temporizador
    const timerElement = document.getElementById('game-timer');
    if (timerElement) {
        timerElement.remove();
    }
}

// Crear display del temporizador
function createTimerDisplay() {
    // Remover temporizador existente si lo hay
    const existingTimer = document.getElementById('game-timer');
    if (existingTimer) {
        existingTimer.remove();
    }

    const timerElement = document.createElement('div');
    timerElement.id = 'game-timer';
    timerElement.className = 'game-timer';
    
    // Insertar al inicio del contenido de la estación
    const stationContent = document.getElementById('station-content');
    if (stationContent) {
        stationContent.insertBefore(timerElement, stationContent.firstChild);
    }
}

// Actualizar display del temporizador
function updateTimerDisplay() {
    const timerElement = document.getElementById('game-timer');
    if (!timerElement) return;

    const minutes = Math.floor(gameTimer.timeLeft / 60);
    const seconds = gameTimer.timeLeft % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    timerElement.textContent = `⏱️ Tiempo restante: ${timeString}`;
    
    // Cambiar estilo cuando queda poco tiempo
    if (gameTimer.timeLeft <= 30) {
        timerElement.classList.add('danger');
    } else {
        timerElement.classList.remove('danger');
    }
}

// Manejar cuando se acaba el tiempo
function handleTimeUp() {
    // Penalización por tiempo agotado
    const timePenalty = 50;
    gameState.score = Math.max(0, gameState.score - timePenalty);
    
    showAlert(`⏰ ¡Tiempo agotado! -${timePenalty} puntos`, 'warning');
    
    // Actualizar UI de puntuación
    updateGameUI();
    
    // Continuar a la siguiente estación después de un breve delay
    setTimeout(() => {
        nextStation();
    }, 2000);
}

// Crear sección de pistas
function createHintSection(station) {
    if (!station.hint) return '';

    return `
        <div class="hint-section">
            <button class="hint-button" onclick="showHint('${station.hint}')" 
                    ${hintSystem.hintsUsed >= hintSystem.maxHints ? 'disabled' : ''}>
                💡 Mostrar Pista (-${hintSystem.hintPenalty} puntos)
            </button>
            <div id="hint-text" class="hint-text hidden"></div>
            <p><small>Pistas usadas: ${hintSystem.hintsUsed}/${hintSystem.maxHints}</small></p>
        </div>
    `;
}

// Mostrar pista
function showHint(hintText) {
    if (hintSystem.hintsUsed >= hintSystem.maxHints) {
        showAlert('Ya has usado todas las pistas disponibles', 'warning');
        return;
    }

    // Aplicar penalización
    gameState.score = Math.max(0, gameState.score - hintSystem.hintPenalty);
    hintSystem.hintsUsed++;

    // Mostrar la pista
    const hintElement = document.getElementById('hint-text');
    if (hintElement) {
        hintElement.textContent = hintText;
        hintElement.classList.remove('hidden');
    }

    // Deshabilitar botón si se alcanzó el límite
    const hintButton = document.querySelector('.hint-button');
    if (hintButton && hintSystem.hintsUsed >= hintSystem.maxHints) {
        hintButton.disabled = true;
        hintButton.textContent = '💡 Sin más pistas disponibles';
    }

    // Actualizar contador de pistas
    const hintCounter = document.querySelector('.hint-section small');
    if (hintCounter) {
        hintCounter.textContent = `Pistas usadas: ${hintSystem.hintsUsed}/${hintSystem.maxHints}`;
    }

    // Actualizar UI de puntuación
    updateGameUI();

    showAlert(`Pista revelada. -${hintSystem.hintPenalty} puntos`, 'info');
}

// Reiniciar sistema de pistas para nueva estación
function resetHintSystem() {
    hintSystem.hintsUsed = 0;
}

// Modificar la función loadQuizStation para incluir temporizador y pistas
function enhanceQuizStation(station) {
    const container = document.getElementById('station-content');
    gameState.selectedAnswer = null;

    let quizHTML = `<h3>${station.name}</h3>`;
    
    // Agregar pistas si están disponibles
    if (station.hint) {
        quizHTML += createHintSection(station);
    }

    quizHTML += `
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

    container.innerHTML = quizHTML;

    // Mostrar medios si existen
    if (station.media) {
        displayStationMedia(station, container);
    }

    // Event listeners para las respuestas
    document.querySelectorAll('.quiz-answer').forEach(answer => {
        answer.addEventListener('click', () => selectQuizAnswer(parseInt(answer.dataset.index)));
    });

    document.getElementById('confirm-answer-btn').addEventListener('click', () => submitQuizAnswer(station));

    // Iniciar temporizador si está configurado
    if (station.timeLimit) {
        startStationTimer(station.timeLimit, handleTimeUp);
    }
}

// Modificar la función loadMissionStation para incluir temporizador y pistas
function enhanceMissionStation(station) {
    const container = document.getElementById('station-content');
    
    let missionHTML = `<h3>${station.name}</h3>`;
    
    // Agregar pistas si están disponibles
    if (station.hint) {
        missionHTML += createHintSection(station);
    }

    missionHTML += `
        <p>${station.description}</p>
        <button class="btn btn-primary" onclick="completeMission()">Misión Completada</button>
    `;

    container.innerHTML = missionHTML;

    // Mostrar medios si existen
    if (station.media) {
        displayStationMedia(station, container);
    }

    // Iniciar temporizador si está configurado
    if (station.timeLimit) {
        startStationTimer(station.timeLimit, handleTimeUp);
    }
}

// Función mejorada para cargar estación actual con temporizadores y pistas
function enhanceLoadCurrentStation() {
    const station = gameState.adventure.estaciones[gameState.currentStationIndex];
    const container = document.getElementById('station-content');

    if (!station) {
        // Juego completado
        stopTimer(); // Asegurar que el temporizador se detenga
        container.innerHTML = `
            <div class="game-complete">
                <h3>🏆 ¡Aventura Completada!</h3>
                <p>Has completado "${gameState.adventure.nombre}" con éxito.</p>
                <p><strong>Puntuación Final: ${gameState.score} puntos</strong></p>
                <p><small>Pistas usadas en total: ${getTotalHintsUsed()}</small></p>
                <button class="btn btn-primary" onclick="showScreen('adventures-screen')">Otras Aventuras</button>
                <button class="btn btn-secondary" onclick="restartGame()">Jugar de Nuevo</button>
            </div>
        `;
        return;
    }

    // Reiniciar sistema de pistas para nueva estación
    resetHintSystem();

    // Cargar estación según su tipo
    switch (station.type) {
        case 'quiz':
            enhanceQuizStation(station);
            break;
        case 'mission':
            enhanceMissionStation(station);
            break;
        case 'qr':
            loadQRStation(station);
            break;
        case 'location':
            loadLocationStation(station);
            break;
    }
}

// Función para obtener el total de pistas usadas en la aventura
function getTotalHintsUsed() {
    // Esta función podría expandirse para rastrear pistas a lo largo de toda la aventura
    return hintSystem.hintsUsed;
}

// Función mejorada para avanzar a la siguiente estación
function enhanceNextStation() {
    stopTimer(); // Detener temporizador de la estación actual
    gameState.currentStationIndex++;
    updateGameUI();
    enhanceLoadCurrentStation();
}

// Función mejorada para reiniciar el juego
function enhanceRestartGame() {
    stopTimer();
    resetHintSystem();
    gameState.currentStationIndex = 0;
    gameState.score = 0;
    gameState.selectedAnswer = null;
    updateGameUI();
    enhanceLoadCurrentStation();
}

// Sobrescribir funciones existentes para usar las versiones mejoradas
function overrideGameFunctions() {
    // Guardar funciones originales
    window.originalLoadCurrentStation = window.loadCurrentStation || function() {};
    window.originalNextStation = window.nextStation || function() {};
    window.originalRestartGame = window.restartGame || function() {};

    // Sobrescribir con versiones mejoradas
    window.loadCurrentStation = enhanceLoadCurrentStation;
    window.nextStation = enhanceNextStation;
    window.restartGame = enhanceRestartGame;
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    overrideGameFunctions();
});

// Exportar funciones para uso global
window.startStationTimer = startStationTimer;
window.stopTimer = stopTimer;
window.showHint = showHint;
window.resetHintSystem = resetHintSystem;
window.handleTimeUp = handleTimeUp;

