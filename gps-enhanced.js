// Funcionalidad GPS mejorada para AdventureQuest
// Este archivo mejora el uso del GPS durante el desarrollo del juego

let gpsSystem = {
    watchId: null,
    currentPosition: null,
    isTracking: false,
    accuracy: null,
    lastUpdate: null,
    trackingHistory: [],
    geofences: []
};

// Configuración GPS
const GPS_CONFIG = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 30000,
    minAccuracy: 50, // metros
    updateInterval: 5000 // millisegundos
};

// Inicializar sistema GPS
function initializeGPS() {
    if (!navigator.geolocation) {
        showAlert('Tu dispositivo no soporta geolocalización', 'error');
        return false;
    }

    // Solicitar permisos de ubicación
    requestLocationPermission();
    return true;
}

// Solicitar permisos de ubicación
function requestLocationPermission() {
    navigator.permissions.query({name: 'geolocation'}).then(function(result) {
        if (result.state === 'granted') {
            console.log('Permisos de geolocalización concedidos');
        } else if (result.state === 'prompt') {
            console.log('Se solicitarán permisos de geolocalización');
        } else if (result.state === 'denied') {
            showAlert('Los permisos de ubicación están denegados. Algunas funciones no estarán disponibles.', 'warning');
        }
    }).catch(function(error) {
        console.log('Error al verificar permisos:', error);
    });
}

// Iniciar seguimiento GPS continuo
function startGPSTracking() {
    if (gpsSystem.isTracking) {
        console.log('El seguimiento GPS ya está activo');
        return;
    }

    gpsSystem.watchId = navigator.geolocation.watchPosition(
        handlePositionUpdate,
        handlePositionError,
        {
            enableHighAccuracy: GPS_CONFIG.enableHighAccuracy,
            timeout: GPS_CONFIG.timeout,
            maximumAge: GPS_CONFIG.maximumAge
        }
    );

    gpsSystem.isTracking = true;
    console.log('Seguimiento GPS iniciado');
}

// Detener seguimiento GPS
function stopGPSTracking() {
    if (gpsSystem.watchId !== null) {
        navigator.geolocation.clearWatch(gpsSystem.watchId);
        gpsSystem.watchId = null;
    }
    gpsSystem.isTracking = false;
    console.log('Seguimiento GPS detenido');
}

// Manejar actualización de posición
function handlePositionUpdate(position) {
    const newPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString(),
        speed: position.coords.speed,
        heading: position.coords.heading
    };

    // Filtrar por precisión
    if (newPosition.accuracy > GPS_CONFIG.minAccuracy) {
        console.log(`Posición descartada por baja precisión: ${newPosition.accuracy}m`);
        return;
    }

    gpsSystem.currentPosition = newPosition;
    gpsSystem.accuracy = newPosition.accuracy;
    gpsSystem.lastUpdate = newPosition.timestamp;

    // Agregar al historial
    gpsSystem.trackingHistory.push(newPosition);

    // Mantener solo las últimas 50 posiciones
    if (gpsSystem.trackingHistory.length > 50) {
        gpsSystem.trackingHistory.shift();
    }

    // Verificar geofences
    checkGeofences(newPosition);

    // Actualizar UI si es necesario
    updateGPSDisplay(newPosition);

    console.log(`Posición actualizada: ${newPosition.latitude}, ${newPosition.longitude} (±${newPosition.accuracy}m)`);
}

// Manejar errores de posición
function handlePositionError(error) {
    let message = '';
    switch(error.code) {
        case error.PERMISSION_DENIED:
            message = 'Acceso a la ubicación denegado por el usuario';
            break;
        case error.POSITION_UNAVAILABLE:
            message = 'Información de ubicación no disponible';
            break;
        case error.TIMEOUT:
            message = 'Tiempo de espera agotado al obtener la ubicación';
            break;
        default:
            message = 'Error desconocido al obtener la ubicación';
            break;
    }
    
    console.error('Error GPS:', message);
    showAlert(`Error GPS: ${message}`, 'error');
}

// Obtener posición actual una sola vez
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date().toISOString()
                };
                resolve(pos);
            },
            (error) => {
                reject(error);
            },
            {
                enableHighAccuracy: GPS_CONFIG.enableHighAccuracy,
                timeout: GPS_CONFIG.timeout,
                maximumAge: GPS_CONFIG.maximumAge
            }
        );
    });
}

// Calcular distancia entre dos puntos (fórmula de Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Convertir grados a radianes
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// Verificar si el jugador está dentro de un radio específico
function isWithinRadius(targetLat, targetLon, radius, currentPos = null) {
    const position = currentPos || gpsSystem.currentPosition;
    if (!position) return false;

    const distance = calculateDistance(
        position.latitude, 
        position.longitude, 
        targetLat, 
        targetLon
    );

    return distance <= radius;
}

// Agregar geofence (zona geográfica)
function addGeofence(id, latitude, longitude, radius, onEnter, onExit) {
    const geofence = {
        id: id,
        latitude: latitude,
        longitude: longitude,
        radius: radius,
        onEnter: onEnter,
        onExit: onExit,
        isInside: false
    };

    gpsSystem.geofences.push(geofence);
    return geofence;
}

// Remover geofence
function removeGeofence(id) {
    gpsSystem.geofences = gpsSystem.geofences.filter(fence => fence.id !== id);
}

// Verificar geofences
function checkGeofences(position) {
    gpsSystem.geofences.forEach(fence => {
        const isInside = isWithinRadius(fence.latitude, fence.longitude, fence.radius, position);
        
        if (isInside && !fence.isInside) {
            // Entró en la zona
            fence.isInside = true;
            if (fence.onEnter) {
                fence.onEnter(fence, position);
            }
        } else if (!isInside && fence.isInside) {
            // Salió de la zona
            fence.isInside = false;
            if (fence.onExit) {
                fence.onExit(fence, position);
            }
        }
    });
}

// Actualizar display GPS en la UI
function updateGPSDisplay(position) {
    const gpsDisplay = document.getElementById('gps-status');
    if (gpsDisplay) {
        gpsDisplay.innerHTML = `
            <div class="gps-info">
                <span class="gps-coords">📍 ${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}</span>
                <span class="gps-accuracy">±${Math.round(position.accuracy)}m</span>
                <span class="gps-time">${new Date(position.timestamp).toLocaleTimeString()}</span>
            </div>
        `;
    }
}

// Crear display GPS para estaciones de ubicación
function createGPSDisplay() {
    const display = document.createElement('div');
    display.id = 'gps-status';
    display.className = 'gps-status';
    display.innerHTML = `
        <div class="gps-info">
            <span class="gps-coords">📍 Obteniendo ubicación...</span>
            <span class="gps-accuracy">Precisión: --</span>
            <span class="gps-time">--:--:--</span>
        </div>
    `;
    return display;
}

// Mejorar la función de estación de ubicación existente
function enhanceLocationStation(station) {
    const container = document.getElementById('station-content');
    
    let locationHTML = `
        <h3>${station.name}</h3>
        <p>Dirígete a la ubicación marcada en el mapa.</p>
        <div id="location-map" style="height: 300px; margin: 1rem 0;"></div>
        <div id="gps-status" class="gps-status"></div>
        <div id="distance-info" class="distance-info">
            <span>Calculando distancia...</span>
        </div>
        <button class="btn btn-primary" id="check-location-btn" disabled>Verificar Ubicación</button>
    `;

    container.innerHTML = locationHTML;

    // Mostrar medios si existen
    if (station.media) {
        displayStationMedia(station, container);
    }

    // Inicializar mapa
    initializeLocationMap(station);

    // Configurar geofence para la estación
    const geofenceId = `station_${station.name}_${Date.now()}`;
    addGeofence(
        geofenceId,
        station.latitude,
        station.longitude,
        station.radius,
        () => {
            // Al entrar en la zona
            document.getElementById('check-location-btn').disabled = false;
            document.getElementById('distance-info').innerHTML = 
                '<span class="success">✅ ¡Estás en la ubicación correcta!</span>';
            showAlert('¡Has llegado a la ubicación!', 'success');
        },
        () => {
            // Al salir de la zona
            document.getElementById('check-location-btn').disabled = true;
            document.getElementById('distance-info').innerHTML = 
                '<span class="warning">⚠️ Te has alejado de la ubicación</span>';
        }
    );

    // Iniciar seguimiento GPS
    if (!gpsSystem.isTracking) {
        startGPSTracking();
    }

    // Actualizar distancia periódicamente
    const distanceInterval = setInterval(() => {
        updateDistanceDisplay(station);
    }, 2000);

    // Event listener para verificar ubicación
    document.getElementById('check-location-btn').addEventListener('click', () => {
        verifyLocationStation(station, geofenceId, distanceInterval);
    });
}

// Actualizar display de distancia
function updateDistanceDisplay(station) {
    const distanceInfo = document.getElementById('distance-info');
    if (!distanceInfo || !gpsSystem.currentPosition) return;

    const distance = calculateDistance(
        gpsSystem.currentPosition.latitude,
        gpsSystem.currentPosition.longitude,
        station.latitude,
        station.longitude
    );

    const isWithin = distance <= station.radius;
    
    if (isWithin) {
        distanceInfo.innerHTML = '<span class="success">✅ ¡Estás en la ubicación correcta!</span>';
    } else {
        distanceInfo.innerHTML = `<span class="info">📏 Distancia: ${Math.round(distance)}m (necesitas estar a ${station.radius}m)</span>`;
    }
}

// Verificar estación de ubicación
function verifyLocationStation(station, geofenceId, distanceInterval) {
    if (!gpsSystem.currentPosition) {
        showAlert('No se puede obtener tu ubicación actual', 'error');
        return;
    }

    const isWithin = isWithinRadius(station.latitude, station.longitude, station.radius);
    
    if (isWithin) {
        // Éxito
        clearInterval(distanceInterval);
        removeGeofence(geofenceId);
        
        showAlert(station.message || '¡Ubicación verificada!', 'success');
        
        // Registrar completar estación
        if (typeof recordStationCompletion === 'function') {
            recordStationCompletion(
                gameState.currentStationIndex,
                station.name,
                'location',
                0, // tiempo no aplicable para ubicación
                100 // puntos por completar
            );
        }

        // Continuar a la siguiente estación
        setTimeout(() => {
            nextStation();
        }, 2000);
    } else {
        showAlert('No estás lo suficientemente cerca de la ubicación objetivo', 'warning');
    }
}

// Inicializar mapa de ubicación
function initializeLocationMap(station) {
    // Esta función se integraría con Leaflet para mostrar el mapa
    // Por ahora, crear un placeholder
    const mapContainer = document.getElementById('location-map');
    if (mapContainer) {
        mapContainer.innerHTML = `
            <div class="map-placeholder">
                <p>📍 Ubicación objetivo:</p>
                <p><strong>Latitud:</strong> ${station.latitude}</p>
                <p><strong>Longitud:</strong> ${station.longitude}</p>
                <p><strong>Radio:</strong> ${station.radius}m</p>
                <p><em>El mapa se mostraría aquí con Leaflet</em></p>
            </div>
        `;
    }
}

// Agregar estilos CSS para GPS
function addGPSStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .gps-status {
            background: var(--background);
            border: 1px solid var(--border);
            border-radius: var(--border-radius);
            padding: 1rem;
            margin: 1rem 0;
        }

        .gps-info {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            font-size: 0.9rem;
        }

        .gps-coords {
            font-family: monospace;
            color: var(--text-primary);
            font-weight: 600;
        }

        .gps-accuracy {
            color: var(--text-secondary);
        }

        .gps-time {
            color: var(--text-secondary);
            font-size: 0.8rem;
        }

        .distance-info {
            background: var(--background);
            border: 1px solid var(--border);
            border-radius: var(--border-radius);
            padding: 1rem;
            margin: 1rem 0;
            text-align: center;
        }

        .distance-info .success {
            color: var(--success-color);
            font-weight: 600;
        }

        .distance-info .warning {
            color: var(--warning-color);
            font-weight: 600;
        }

        .distance-info .info {
            color: var(--text-primary);
        }

        .map-placeholder {
            background: #f0f0f0;
            border: 2px dashed #ccc;
            border-radius: var(--border-radius);
            padding: 2rem;
            text-align: center;
            color: #666;
        }

        @media (max-width: 768px) {
            .gps-info {
                font-size: 0.8rem;
            }
            
            .gps-coords {
                word-break: break-all;
            }
        }
    `;
    document.head.appendChild(style);
}

// Integrar con el sistema de juego existente
function integrateGPSWithGame() {
    // Sobrescribir la función de carga de estación de ubicación
    const originalLoadLocationStation = window.loadLocationStation || function() {};
    
    window.loadLocationStation = function(station) {
        enhanceLocationStation(station);
    };

    // Detener GPS cuando el juego termine
    const originalEndGame = window.endGame || function() {};
    window.endGame = function() {
        stopGPSTracking();
        gpsSystem.geofences = [];
        return originalEndGame.apply(this, arguments);
    };
}

// Inicializar sistema GPS mejorado
function initializeEnhancedGPS() {
    if (initializeGPS()) {
        addGPSStyles();
        integrateGPSWithGame();
        console.log('Sistema GPS mejorado inicializado');
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    initializeEnhancedGPS();
});

// Exportar funciones para uso global
window.startGPSTracking = startGPSTracking;
window.stopGPSTracking = stopGPSTracking;
window.getCurrentPosition = getCurrentPosition;
window.calculateDistance = calculateDistance;
window.isWithinRadius = isWithinRadius;
window.addGeofence = addGeofence;
window.removeGeofence = removeGeofence;

