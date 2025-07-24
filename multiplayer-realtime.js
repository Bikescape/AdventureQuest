// Funcionalidad adicional para multijugador en tiempo real con Supabase
// Este archivo extiende la funcionalidad multijugador usando Supabase Realtime

let realtimeChannel = null;

// Mejorar la funcionalidad multijugador con tiempo real
function enhanceMultiplayerWithRealtime() {
    // Suscribirse a cambios en tiempo real cuando se está en una sala
    if (multiplayerState.room) {
        subscribeToRoomUpdates();
    }
}

function subscribeToRoomUpdates() {
    if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
    }

    realtimeChannel = supabase
        .channel(`room_${multiplayerState.room.id}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'sesiones_jugadores',
                filter: `sala_id=eq.${multiplayerState.room.id}`
            },
            (payload) => {
                console.log('Cambio en sesiones de jugadores:', payload);
                loadRoomPlayers();
            }
        )
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'salas_multijugador',
                filter: `id=eq.${multiplayerState.room.id}`
            },
            (payload) => {
                console.log('Cambio en sala:', payload);
                handleRoomStateChange(payload.new);
            }
        )
        .subscribe();
}

function handleRoomStateChange(roomData) {
    if (roomData.estado_juego?.started && !gameState.isMultiplayer) {
        // El juego ha comenzado, iniciar para este jugador
        showAlert('¡El juego ha comenzado!', 'success');
        
        // Obtener la aventura y comenzar el juego
        setTimeout(async () => {
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
        }, 1000);
    }
}

// Actualizar progreso del jugador en tiempo real
async function updatePlayerProgress(stationIndex, score, completed = false) {
    if (!multiplayerState.session) return;

    try {
        const { error } = await supabase
            .from('sesiones_jugadores')
            .update({
                estacion_actual: stationIndex,
                puntuacion: score,
                completado: completed
            })
            .eq('id', multiplayerState.session.id);

        if (error) {
            console.error('Error al actualizar progreso:', error);
        }
    } catch (error) {
        console.error('Error de conexión al actualizar progreso:', error);
    }
}

// Modificar las funciones de juego existentes para incluir actualizaciones multijugador
function enhanceGameFunctions() {
    // Guardar las funciones originales
    const originalNextStation = window.nextStation;
    const originalSubmitQuizAnswer = window.submitQuizAnswer;
    const originalCompleteMission = window.completeMission;
    const originalSubmitQRCode = window.submitQRCode;
    const originalCheckLocation = window.checkLocation;

    // Sobrescribir nextStation para actualizar progreso
    window.nextStation = function() {
        originalNextStation();
        
        if (gameState.isMultiplayer) {
            const isCompleted = gameState.currentStationIndex >= gameState.adventure.estaciones.length;
            updatePlayerProgress(gameState.currentStationIndex, gameState.score, isCompleted);
        }
    };

    // Sobrescribir submitQuizAnswer para actualizar progreso
    window.submitQuizAnswer = function(station) {
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

        // Actualizar progreso en multijugador
        if (gameState.isMultiplayer) {
            updatePlayerProgress(gameState.currentStationIndex, gameState.score);
        }

        setTimeout(() => {
            nextStation();
        }, 2000);
    };

    // Sobrescribir completeMission para actualizar progreso
    window.completeMission = function() {
        gameState.score += 150;
        showAlert('¡Misión completada! +150 puntos', 'success');
        
        if (gameState.isMultiplayer) {
            updatePlayerProgress(gameState.currentStationIndex, gameState.score);
        }
        
        setTimeout(nextStation, 1500);
    };

    // Sobrescribir submitQRCode para actualizar progreso
    window.submitQRCode = function(correctCode, message) {
        const input = document.getElementById('qr-input').value.trim();
        
        if (input === correctCode) {
            gameState.score += 75;
            showAlert(`¡Código correcto! ${message} +75 puntos`, 'success');
            
            if (gameState.isMultiplayer) {
                updatePlayerProgress(gameState.currentStationIndex, gameState.score);
            }
            
            setTimeout(nextStation, 2000);
        } else {
            showAlert('Código incorrecto. Inténtalo de nuevo.', 'error');
        }
    };

    // Sobrescribir checkLocation para actualizar progreso
    window.checkLocation = function(targetLat, targetLng, radius, message) {
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
                    
                    if (gameState.isMultiplayer) {
                        updatePlayerProgress(gameState.currentStationIndex, gameState.score);
                    }
                    
                    setTimeout(nextStation, 2000);
                } else {
                    showAlert(`Estás a ${Math.round(distance)}m del objetivo. Acércate más.`, 'warning');
                }
            },
            (error) => {
                showAlert('No se pudo obtener tu ubicación. Verifica los permisos.', 'error');
            }
        );
    };
}

// Mejorar la función showRoomScreen para incluir tiempo real
function enhanceShowRoomScreen() {
    const originalShowRoomScreen = window.showRoomScreen;
    
    window.showRoomScreen = function(adventure) {
        originalShowRoomScreen(adventure);
        enhanceMultiplayerWithRealtime();
    };
}

// Mejorar la función leaveRoom para limpiar suscripciones
function enhanceLeaveRoom() {
    const originalLeaveRoom = window.leaveRoom;
    
    window.leaveRoom = async function() {
        if (realtimeChannel) {
            supabase.removeChannel(realtimeChannel);
            realtimeChannel = null;
        }
        
        await originalLeaveRoom();
    };
}

// Función para enviar mensajes de chat (opcional)
async function sendChatMessage(message) {
    if (!multiplayerState.room || !message.trim()) return;

    try {
        // Insertar mensaje en una tabla de chat (si se implementa)
        const { error } = await supabase
            .from('mensajes_chat')
            .insert([{
                sala_id: multiplayerState.room.id,
                jugador_id: multiplayerState.playerId,
                nombre_jugador: multiplayerState.playerName,
                mensaje: message.trim()
            }]);

        if (error) {
            console.error('Error al enviar mensaje:', error);
        }
    } catch (error) {
        console.error('Error de conexión al enviar mensaje:', error);
    }
}

// Función para mostrar notificaciones de eventos del juego
function showGameNotification(type, playerName, data) {
    let message = '';
    
    switch (type) {
        case 'player_joined':
            message = `${playerName} se unió a la sala`;
            break;
        case 'player_left':
            message = `${playerName} abandonó la sala`;
            break;
        case 'station_completed':
            message = `${playerName} completó una estación`;
            break;
        case 'game_completed':
            message = `${playerName} completó la aventura`;
            break;
    }
    
    if (message) {
        showAlert(message, 'info');
    }
}

// Función para obtener estadísticas de la sala
async function getRoomStats() {
    if (!multiplayerState.room) return null;

    try {
        const { data: sessions, error } = await supabase
            .from('sesiones_jugadores')
            .select('*')
            .eq('sala_id', multiplayerState.room.id);

        if (error) return null;

        const stats = {
            totalPlayers: sessions.length,
            completedPlayers: sessions.filter(s => s.completado).length,
            averageScore: sessions.reduce((sum, s) => sum + s.puntuacion, 0) / sessions.length,
            averageProgress: sessions.reduce((sum, s) => sum + s.estacion_actual, 0) / sessions.length
        };

        return stats;
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return null;
    }
}

// Inicializar mejoras cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    enhanceGameFunctions();
    enhanceShowRoomScreen();
    enhanceLeaveRoom();
});

// Exportar funciones para uso global
window.updatePlayerProgress = updatePlayerProgress;
window.sendChatMessage = sendChatMessage;
window.getRoomStats = getRoomStats;

