// Plantillas de aventuras predefinidas para AdventureQuest
// Este archivo contiene plantillas que los usuarios pueden usar como base para sus aventuras

const adventureTemplates = [
    {
        id: 'treasure_hunt',
        name: 'Búsqueda del Tesoro Urbana',
        description: 'Una aventura clásica de búsqueda del tesoro por la ciudad',
        category: 'Exploración',
        estimatedTime: '45-60 minutos',
        stations: [
            {
                name: 'Bienvenida al Tesoro',
                type: 'quiz',
                question: '¿Estás listo para comenzar la búsqueda del tesoro?',
                answers: ['¡Sí, estoy listo!', 'Necesito más información', 'Quizás más tarde', 'No estoy seguro'],
                correctAnswer: 0,
                hint: 'La aventura siempre comienza con una actitud positiva',
                timeLimit: 30
            },
            {
                name: 'Primera Pista',
                type: 'mission',
                description: 'Encuentra el lugar donde la gente se reúne para tomar café y lee el cartel en la entrada.',
                hint: 'Busca un lugar con aroma a café y sonido de conversaciones',
                timeLimit: 300
            },
            {
                name: 'Código Secreto',
                type: 'qr',
                code: 'TESORO2024',
                message: '¡Excelente! Has encontrado el código secreto. Continúa hacia el siguiente punto.'
            },
            {
                name: 'Ubicación del Tesoro',
                type: 'location',
                latitude: 40.4168,
                longitude: -3.7038,
                radius: 50,
                message: '¡Felicidades! Has encontrado la ubicación del tesoro. ¡Misión cumplida!'
            }
        ]
    },
    {
        id: 'escape_room',
        name: 'Escape Room Virtual',
        description: 'Resuelve acertijos y escapa de la habitación virtual',
        category: 'Puzzle',
        estimatedTime: '30-45 minutos',
        stations: [
            {
                name: 'La Habitación Cerrada',
                type: 'quiz',
                question: 'Te encuentras en una habitación cerrada. ¿Qué es lo primero que harías?',
                answers: ['Buscar una llave', 'Examinar las paredes', 'Revisar los muebles', 'Gritar por ayuda'],
                correctAnswer: 2,
                hint: 'Los objetos cotidianos a menudo esconden secretos',
                timeLimit: 60
            },
            {
                name: 'El Acertijo del Espejo',
                type: 'mission',
                description: 'Encuentra el mensaje oculto que solo se puede leer en el espejo. Pista: "ODNUM LE ARAP DADREV AL"',
                hint: 'Lee el mensaje al revés para descubrir la verdad',
                timeLimit: 180
            },
            {
                name: 'Combinación Secreta',
                type: 'quiz',
                question: 'Si el año actual es 2024 y necesitas los últimos 3 dígitos en orden inverso, ¿cuál es la combinación?',
                answers: ['420', '024', '240', '402'],
                correctAnswer: 0,
                hint: '2024 → últimos 3 dígitos → orden inverso',
                timeLimit: 120
            },
            {
                name: 'Escape Final',
                type: 'qr',
                code: 'ESCAPE_SUCCESS',
                message: '¡Increíble! Has logrado escapar de la habitación. Tu ingenio te ha salvado.'
            }
        ]
    },
    {
        id: 'city_tour',
        name: 'Tour Histórico de la Ciudad',
        description: 'Descubre la historia y cultura de tu ciudad',
        category: 'Educativo',
        estimatedTime: '60-90 minutos',
        stations: [
            {
                name: 'Plaza Principal',
                type: 'location',
                latitude: 40.4168,
                longitude: -3.7038,
                radius: 100,
                message: 'Bienvenido a la plaza principal, corazón histórico de la ciudad'
            },
            {
                name: 'Historia Local',
                type: 'quiz',
                question: '¿En qué siglo se fundó esta ciudad?',
                answers: ['Siglo XV', 'Siglo XVI', 'Siglo XVII', 'Siglo XVIII'],
                correctAnswer: 1,
                hint: 'Fue durante la época de los grandes descubrimientos',
                timeLimit: 90
            },
            {
                name: 'Monumento Histórico',
                type: 'mission',
                description: 'Encuentra el monumento más antiguo de la zona y lee la inscripción en su base.',
                hint: 'Busca la estructura de piedra más desgastada por el tiempo',
                timeLimit: 600
            },
            {
                name: 'Datos Curiosos',
                type: 'quiz',
                question: '¿Cuál es el edificio más alto de esta área?',
                answers: ['La catedral', 'El ayuntamiento', 'La torre del reloj', 'El banco central'],
                correctAnswer: 0,
                hint: 'Mira hacia arriba y busca las agujas que apuntan al cielo',
                timeLimit: 60
            }
        ]
    },
    {
        id: 'nature_quest',
        name: 'Aventura en la Naturaleza',
        description: 'Explora el entorno natural y aprende sobre la flora y fauna local',
        category: 'Naturaleza',
        estimatedTime: '90-120 minutos',
        stations: [
            {
                name: 'Punto de Inicio',
                type: 'mission',
                description: 'Observa tu entorno y cuenta cuántos tipos diferentes de árboles puedes identificar en un radio de 20 metros.',
                hint: 'Fíjate en las formas de las hojas y la corteza de los árboles',
                timeLimit: 300
            },
            {
                name: 'Flora Local',
                type: 'quiz',
                question: '¿Qué tipo de hoja es más común en esta zona?',
                answers: ['Hoja perenne', 'Hoja caduca', 'Hoja compuesta', 'Hoja suculenta'],
                correctAnswer: 1,
                hint: 'Piensa en qué tipo de hojas cambian de color en otoño',
                timeLimit: 120
            },
            {
                name: 'Sonidos de la Naturaleza',
                type: 'mission',
                description: 'Permanece en silencio durante 2 minutos y anota todos los sonidos naturales que puedas identificar.',
                hint: 'Cierra los ojos para concentrarte mejor en los sonidos',
                timeLimit: 180
            },
            {
                name: 'Mirador Natural',
                type: 'location',
                latitude: 40.4200,
                longitude: -3.7100,
                radius: 75,
                message: '¡Has llegado al mirador! Disfruta de la vista panorámica de la naturaleza.'
            }
        ]
    },
    {
        id: 'mystery_detective',
        name: 'Misterio del Detective',
        description: 'Resuelve un misterio siguiendo pistas como un verdadero detective',
        category: 'Misterio',
        estimatedTime: '45-75 minutos',
        stations: [
            {
                name: 'La Escena del Crimen',
                type: 'mission',
                description: 'Examina cuidadosamente el área. ¿Qué evidencias puedes encontrar? Busca algo que no encaje con el entorno.',
                hint: 'Los detalles más pequeños a menudo son las pistas más importantes',
                timeLimit: 420
            },
            {
                name: 'Interrogatorio',
                type: 'quiz',
                question: 'Un testigo dice que vio a alguien corriendo a las 3:15 PM, pero el incidente ocurrió a las 3:30 PM. ¿Qué significa esto?',
                answers: ['El testigo miente', 'El testigo se confundió de hora', 'Vio al culpable huyendo', 'Vio a alguien no relacionado'],
                correctAnswer: 3,
                hint: 'No siempre la primera explicación es la correcta',
                timeLimit: 180
            },
            {
                name: 'Código del Detective',
                type: 'qr',
                code: 'DETECTIVE_BADGE_2024',
                message: 'Has demostrado tus habilidades detectivescas. El caso está resuelto.'
            },
            {
                name: 'Resolución del Caso',
                type: 'quiz',
                question: '¿Cuál es la clave para ser un buen detective?',
                answers: ['Observación detallada', 'Pensamiento lógico', 'Paciencia', 'Todas las anteriores'],
                correctAnswer: 3,
                hint: 'Un buen detective necesita múltiples habilidades',
                timeLimit: 90
            }
        ]
    }
];

// Mostrar modal de selección de plantillas
function showTemplateModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'template-modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Seleccionar Plantilla de Aventura</h3>
                <button class="modal-close" onclick="closeTemplateModal()">✕</button>
            </div>
            <div class="modal-body">
                <p>Elige una plantilla como base para tu aventura. Podrás personalizarla después.</p>
                <div id="templates-list" class="templates-list">
                    ${adventureTemplates.map(template => `
                        <div class="template-item" onclick="selectTemplate('${template.id}')">
                            <h4>${template.name}</h4>
                            <p>${template.description}</p>
                            <div class="template-meta">
                                <span class="template-category">${template.category}</span>
                                <span class="template-time">${template.estimatedTime}</span>
                                <span class="template-stations">${template.stations.length} estaciones</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="template-actions">
                    <button class="btn btn-secondary" onclick="closeTemplateModal()">Cancelar</button>
                    <button class="btn btn-primary" onclick="createBlankAdventure()">Crear Aventura en Blanco</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Cerrar modal de plantillas
function closeTemplateModal() {
    const modal = document.getElementById('template-modal');
    if (modal) {
        modal.remove();
    }
}

// Seleccionar una plantilla
function selectTemplate(templateId) {
    const template = adventureTemplates.find(t => t.id === templateId);
    if (!template) return;

    // Cargar la plantilla en el editor
    loadTemplateIntoEditor(template);
    
    // Cerrar modal
    closeTemplateModal();
    
    // Mostrar pantalla de creación
    showCreateScreen();
    
    showAlert(`Plantilla "${template.name}" cargada. Puedes personalizarla ahora.`, 'success');
}

// Cargar plantilla en el editor
function loadTemplateIntoEditor(template) {
    // Limpiar estado actual
    currentAdventure = null;
    currentStations = [...template.stations]; // Clonar las estaciones
    
    // Llenar campos básicos
    document.getElementById('adventure-name').value = template.name;
    document.getElementById('adventure-description').value = template.description;
    
    // Actualizar lista de estaciones
    updateStationsList();
}

// Crear aventura en blanco
function createBlankAdventure() {
    closeTemplateModal();
    showCreateScreen();
}

// Modificar la función showCreateScreen para mostrar opción de plantillas
function enhanceCreateScreen() {
    // Mostrar modal de plantillas primero
    showTemplateModal();
}

// Agregar estilos CSS para las plantillas
function addTemplateStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .templates-list {
            display: grid;
            gap: 1rem;
            max-height: 400px;
            overflow-y: auto;
            margin: 1rem 0;
        }

        .template-item {
            padding: 1.5rem;
            border: 2px solid var(--border);
            border-radius: var(--border-radius);
            cursor: pointer;
            transition: var(--transition);
            background: var(--background);
        }

        .template-item:hover {
            border-color: var(--primary-color);
            background: rgba(99, 102, 241, 0.05);
            transform: translateY(-2px);
        }

        .template-item h4 {
            color: var(--text-primary);
            margin-bottom: 0.5rem;
            font-size: 1.1rem;
        }

        .template-item p {
            color: var(--text-secondary);
            margin-bottom: 1rem;
            line-height: 1.5;
        }

        .template-meta {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            font-size: 0.85rem;
        }

        .template-category {
            background: var(--primary-color);
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 12px;
            font-weight: 600;
        }

        .template-time {
            background: var(--warning-color);
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 12px;
            font-weight: 600;
        }

        .template-stations {
            background: var(--success-color);
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 12px;
            font-weight: 600;
        }

        .template-actions {
            display: flex;
            justify-content: space-between;
            margin-top: 1.5rem;
            padding-top: 1rem;
            border-top: 1px solid var(--border);
        }

        @media (max-width: 768px) {
            .template-meta {
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .template-actions {
                flex-direction: column;
                gap: 1rem;
            }
        }
    `;
    document.head.appendChild(style);
}

// Función para obtener plantillas por categoría
function getTemplatesByCategory(category) {
    return adventureTemplates.filter(template => template.category === category);
}

// Función para buscar plantillas
function searchTemplates(query) {
    const lowerQuery = query.toLowerCase();
    return adventureTemplates.filter(template => 
        template.name.toLowerCase().includes(lowerQuery) ||
        template.description.toLowerCase().includes(lowerQuery) ||
        template.category.toLowerCase().includes(lowerQuery)
    );
}

// Función para agregar una nueva plantilla personalizada
function addCustomTemplate(template) {
    // Validar plantilla
    if (!template.name || !template.description || !template.stations || template.stations.length === 0) {
        showAlert('La plantilla debe tener nombre, descripción y al menos una estación', 'error');
        return false;
    }

    // Generar ID único
    template.id = 'custom_' + Date.now();
    template.category = template.category || 'Personalizada';

    // Agregar a la lista
    adventureTemplates.push(template);
    
    showAlert('Plantilla personalizada agregada exitosamente', 'success');
    return true;
}

// Función para exportar plantilla desde aventura actual
function exportCurrentAsTemplate() {
    if (!currentAdventure || currentStations.length === 0) {
        showAlert('Primero debes crear una aventura para exportarla como plantilla', 'warning');
        return;
    }

    const templateName = prompt('Nombre para la plantilla:');
    if (!templateName) return;

    const templateDescription = prompt('Descripción de la plantilla:');
    if (!templateDescription) return;

    const template = {
        name: templateName,
        description: templateDescription,
        category: 'Personalizada',
        estimatedTime: 'Variable',
        stations: [...currentStations] // Clonar estaciones
    };

    if (addCustomTemplate(template)) {
        showAlert('Tu aventura ha sido guardada como plantilla', 'success');
    }
}

// Inicializar funcionalidad de plantillas
function initializeTemplates() {
    addTemplateStyles();
    
    // Modificar el botón de crear aventura para mostrar plantillas
    const createBtn = document.getElementById('create-adventure-btn');
    if (createBtn) {
        createBtn.onclick = enhanceCreateScreen;
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    initializeTemplates();
});

// Exportar funciones para uso global
window.showTemplateModal = showTemplateModal;
window.closeTemplateModal = closeTemplateModal;
window.selectTemplate = selectTemplate;
window.createBlankAdventure = createBlankAdventure;
window.exportCurrentAsTemplate = exportCurrentAsTemplate;
window.getTemplatesByCategory = getTemplatesByCategory;
window.searchTemplates = searchTemplates;

