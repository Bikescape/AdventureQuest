// Funcionalidad para exportación de estadísticas de juego en AdventureQuest
// Este archivo maneja la recolección, análisis y exportación de datos de juego

let gameStatistics = {
    sessions: [],
    currentSession: null
};

// Iniciar una nueva sesión de juego
function startGameSession(adventureId, adventureName, playerId, playerName, isMultiplayer = false) {
    const session = {
        id: generateSessionId(),
        adventureId: adventureId,
        adventureName: adventureName,
        playerId: playerId,
        playerName: playerName,
        isMultiplayer: isMultiplayer,
        startTime: new Date().toISOString(),
        endTime: null,
        duration: 0,
        score: 0,
        finalScore: 0,
        stationsCompleted: 0,
        totalStations: 0,
        hintsUsed: 0,
        timeouts: 0,
        stationDetails: [],
        penalties: {
            hints: 0,
            timeouts: 0,
            total: 0
        }
    };

    gameStatistics.currentSession = session;
    return session;
}

// Finalizar sesión de juego
function endGameSession(finalScore = 0) {
    if (!gameStatistics.currentSession) return;

    const session = gameStatistics.currentSession;
    session.endTime = new Date().toISOString();
    session.duration = calculateDuration(session.startTime, session.endTime);
    session.finalScore = finalScore;
    session.score = finalScore;

    // Agregar a historial
    gameStatistics.sessions.push({...session});
    
    // Guardar en localStorage para persistencia
    saveStatisticsToStorage();
    
    // Limpiar sesión actual
    gameStatistics.currentSession = null;

    return session;
}

// Registrar completar una estación
function recordStationCompletion(stationIndex, stationName, stationType, timeSpent, score, hintsUsed = 0, timedOut = false) {
    if (!gameStatistics.currentSession) return;

    const stationData = {
        index: stationIndex,
        name: stationName,
        type: stationType,
        timeSpent: timeSpent,
        score: score,
        hintsUsed: hintsUsed,
        timedOut: timedOut,
        timestamp: new Date().toISOString()
    };

    gameStatistics.currentSession.stationDetails.push(stationData);
    gameStatistics.currentSession.stationsCompleted++;
    gameStatistics.currentSession.hintsUsed += hintsUsed;
    
    if (timedOut) {
        gameStatistics.currentSession.timeouts++;
    }

    // Actualizar penalizaciones
    updateSessionPenalties();
}

// Actualizar penalizaciones de la sesión
function updateSessionPenalties() {
    if (!gameStatistics.currentSession) return;

    const session = gameStatistics.currentSession;
    session.penalties.hints = session.hintsUsed * 25; // 25 puntos por pista
    session.penalties.timeouts = session.timeouts * 50; // 50 puntos por timeout
    session.penalties.total = session.penalties.hints + session.penalties.timeouts;
}

// Generar ID único para sesión
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Calcular duración entre dos fechas
function calculateDuration(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.round((end - start) / 1000); // Duración en segundos
}

// Formatear duración en formato legible
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

// Guardar estadísticas en localStorage
function saveStatisticsToStorage() {
    try {
        localStorage.setItem('adventurequest_statistics', JSON.stringify(gameStatistics));
    } catch (error) {
        console.error('Error al guardar estadísticas:', error);
    }
}

// Cargar estadísticas desde localStorage
function loadStatisticsFromStorage() {
    try {
        const stored = localStorage.getItem('adventurequest_statistics');
        if (stored) {
            gameStatistics = JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        gameStatistics = { sessions: [], currentSession: null };
    }
}

// Mostrar modal de estadísticas
function showStatisticsModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'statistics-modal';
    
    const stats = generateStatisticsSummary();
    
    modal.innerHTML = `
        <div class="modal-content statistics-modal-content">
            <div class="modal-header">
                <h3>📊 Estadísticas de Juego</h3>
                <button class="modal-close" onclick="closeStatisticsModal()">✕</button>
            </div>
            <div class="modal-body">
                <div class="statistics-summary">
                    <div class="stat-card">
                        <h4>Total de Partidas</h4>
                        <span class="stat-value">${stats.totalSessions}</span>
                    </div>
                    <div class="stat-card">
                        <h4>Tiempo Total Jugado</h4>
                        <span class="stat-value">${formatDuration(stats.totalPlayTime)}</span>
                    </div>
                    <div class="stat-card">
                        <h4>Puntuación Promedio</h4>
                        <span class="stat-value">${stats.averageScore}</span>
                    </div>
                    <div class="stat-card">
                        <h4>Aventuras Completadas</h4>
                        <span class="stat-value">${stats.completedAdventures}</span>
                    </div>
                </div>
                
                <div class="statistics-details">
                    <h4>Historial de Partidas</h4>
                    <div class="sessions-list">
                        ${generateSessionsList()}
                    </div>
                </div>
                
                <div class="export-options">
                    <h4>Exportar Datos</h4>
                    <div class="export-buttons">
                        <button class="btn btn-primary" onclick="exportStatisticsCSV()">📄 Exportar CSV</button>
                        <button class="btn btn-secondary" onclick="exportStatisticsJSON()">📋 Exportar JSON</button>
                        <button class="btn btn-warning" onclick="clearAllStatistics()">🗑️ Limpiar Datos</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Cerrar modal de estadísticas
function closeStatisticsModal() {
    const modal = document.getElementById('statistics-modal');
    if (modal) {
        modal.remove();
    }
}

// Generar resumen de estadísticas
function generateStatisticsSummary() {
    const sessions = gameStatistics.sessions;
    
    return {
        totalSessions: sessions.length,
        totalPlayTime: sessions.reduce((total, session) => total + session.duration, 0),
        averageScore: sessions.length > 0 ? Math.round(sessions.reduce((total, session) => total + session.finalScore, 0) / sessions.length) : 0,
        completedAdventures: sessions.filter(session => session.endTime !== null).length,
        totalHintsUsed: sessions.reduce((total, session) => total + session.hintsUsed, 0),
        totalTimeouts: sessions.reduce((total, session) => total + session.timeouts, 0)
    };
}

// Generar lista de sesiones
function generateSessionsList() {
    if (gameStatistics.sessions.length === 0) {
        return '<p class="no-sessions">No hay partidas registradas aún.</p>';
    }

    return gameStatistics.sessions
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
        .slice(0, 10) // Mostrar solo las últimas 10
        .map(session => `
            <div class="session-item">
                <div class="session-header">
                    <h5>${session.adventureName}</h5>
                    <span class="session-date">${formatDate(session.startTime)}</span>
                </div>
                <div class="session-details">
                    <span>⏱️ ${formatDuration(session.duration)}</span>
                    <span>🎯 ${session.finalScore} pts</span>
                    <span>📍 ${session.stationsCompleted}/${session.totalStations} estaciones</span>
                    ${session.hintsUsed > 0 ? `<span>💡 ${session.hintsUsed} pistas</span>` : ''}
                    ${session.timeouts > 0 ? `<span>⏰ ${session.timeouts} timeouts</span>` : ''}
                </div>
            </div>
        `).join('');
}

// Formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Exportar estadísticas en formato CSV
function exportStatisticsCSV() {
    const sessions = gameStatistics.sessions;
    if (sessions.length === 0) {
        showAlert('No hay datos para exportar', 'warning');
        return;
    }

    let csv = 'Fecha,Aventura,Jugador,Duración (seg),Puntuación Final,Estaciones Completadas,Total Estaciones,Pistas Usadas,Timeouts,Multijugador\n';
    
    sessions.forEach(session => {
        csv += [
            session.startTime,
            `"${session.adventureName}"`,
            `"${session.playerName}"`,
            session.duration,
            session.finalScore,
            session.stationsCompleted,
            session.totalStations,
            session.hintsUsed,
            session.timeouts,
            session.isMultiplayer ? 'Sí' : 'No'
        ].join(',') + '\n';
    });

    downloadFile(csv, 'adventurequest_estadisticas.csv', 'text/csv');
}

// Exportar estadísticas en formato JSON
function exportStatisticsJSON() {
    if (gameStatistics.sessions.length === 0) {
        showAlert('No hay datos para exportar', 'warning');
        return;
    }

    const exportData = {
        exportDate: new Date().toISOString(),
        summary: generateStatisticsSummary(),
        sessions: gameStatistics.sessions
    };

    const json = JSON.stringify(exportData, null, 2);
    downloadFile(json, 'adventurequest_estadisticas.json', 'application/json');
}

// Descargar archivo
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    showAlert(`Archivo ${filename} descargado exitosamente`, 'success');
}

// Limpiar todas las estadísticas
function clearAllStatistics() {
    if (confirm('¿Estás seguro de que quieres eliminar todas las estadísticas? Esta acción no se puede deshacer.')) {
        gameStatistics = { sessions: [], currentSession: null };
        saveStatisticsToStorage();
        closeStatisticsModal();
        showAlert('Todas las estadísticas han sido eliminadas', 'info');
    }
}

// Agregar estilos CSS para las estadísticas
function addStatisticsStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .statistics-modal-content {
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
        }

        .statistics-summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }

        .stat-card {
            background: linear-gradient(135deg, var(--primary-color), #8b5cf6);
            color: white;
            padding: 1.5rem;
            border-radius: var(--border-radius);
            text-align: center;
            box-shadow: var(--shadow);
        }

        .stat-card h4 {
            margin: 0 0 0.5rem 0;
            font-size: 0.9rem;
            opacity: 0.9;
        }

        .stat-value {
            font-size: 2rem;
            font-weight: bold;
            display: block;
        }

        .statistics-details {
            margin-bottom: 2rem;
        }

        .sessions-list {
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid var(--border);
            border-radius: var(--border-radius);
        }

        .session-item {
            padding: 1rem;
            border-bottom: 1px solid var(--border);
            background: var(--background);
        }

        .session-item:last-child {
            border-bottom: none;
        }

        .session-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }

        .session-header h5 {
            margin: 0;
            color: var(--text-primary);
        }

        .session-date {
            font-size: 0.85rem;
            color: var(--text-secondary);
        }

        .session-details {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            font-size: 0.85rem;
            color: var(--text-secondary);
        }

        .no-sessions {
            text-align: center;
            padding: 2rem;
            color: var(--text-secondary);
            font-style: italic;
        }

        .export-options {
            border-top: 1px solid var(--border);
            padding-top: 1.5rem;
        }

        .export-buttons {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
        }

        @media (max-width: 768px) {
            .statistics-summary {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .export-buttons {
                flex-direction: column;
            }
            
            .session-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.25rem;
            }
            
            .session-details {
                flex-direction: column;
                gap: 0.25rem;
            }
        }
    `;
    document.head.appendChild(style);
}

// Integrar con el sistema de juego existente
function integrateWithGameSystem() {
    // Sobrescribir funciones del juego para registrar estadísticas
    const originalStartGame = window.startGame || function() {};
    const originalEndGame = window.endGame || function() {};
    const originalCompleteStation = window.completeStation || function() {};

    window.startGame = function(adventure, playerId, playerName, isMultiplayer = false) {
        startGameSession(adventure.id, adventure.nombre, playerId, playerName, isMultiplayer);
        if (gameStatistics.currentSession) {
            gameStatistics.currentSession.totalStations = adventure.estaciones.length;
        }
        return originalStartGame.apply(this, arguments);
    };

    window.endGame = function(finalScore) {
        endGameSession(finalScore);
        return originalEndGame.apply(this, arguments);
    };
}

// Agregar botón de estadísticas al menú principal
function addStatisticsButton() {
    // Buscar un lugar apropiado para agregar el botón
    const authButtons = document.querySelector('.auth-buttons');
    if (authButtons) {
        const statsButton = document.createElement('button');
        statsButton.className = 'btn btn-outline';
        statsButton.textContent = '📊 Estadísticas';
        statsButton.onclick = showStatisticsModal;
        authButtons.appendChild(statsButton);
    }
}

// Inicializar funcionalidad de estadísticas
function initializeStatistics() {
    loadStatisticsFromStorage();
    addStatisticsStyles();
    integrateWithGameSystem();
    addStatisticsButton();
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    initializeStatistics();
});

// Exportar funciones para uso global
window.showStatisticsModal = showStatisticsModal;
window.closeStatisticsModal = closeStatisticsModal;
window.exportStatisticsCSV = exportStatisticsCSV;
window.exportStatisticsJSON = exportStatisticsJSON;
window.clearAllStatistics = clearAllStatistics;
window.startGameSession = startGameSession;
window.endGameSession = endGameSession;
window.recordStationCompletion = recordStationCompletion;

