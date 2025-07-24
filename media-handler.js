// Funcionalidad para manejo de archivos multimedia en AdventureQuest
// Este archivo maneja la carga, vista previa y almacenamiento de imágenes y audio

let currentStationMedia = {
    image: null,
    audio: null,
    imageUrl: null,
    audioUrl: null
};

// Configurar event listeners para los campos de medios
function setupMediaEventListeners() {
    const imageInput = document.getElementById('station-image');
    const audioInput = document.getElementById('station-audio');

    if (imageInput) {
        imageInput.addEventListener('change', handleImageUpload);
    }

    if (audioInput) {
        audioInput.addEventListener('change', handleAudioUpload);
    }
}

// Manejar la carga de imagen
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
        showAlert('Por favor selecciona un archivo de imagen válido', 'error');
        return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showAlert('La imagen debe ser menor a 5MB', 'error');
        return;
    }

    currentStationMedia.image = file;

    // Mostrar vista previa
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('image-preview');
        const img = document.getElementById('preview-img');
        
        img.src = e.target.result;
        preview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

// Manejar la carga de audio
function handleAudioUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('audio/')) {
        showAlert('Por favor selecciona un archivo de audio válido', 'error');
        return;
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showAlert('El archivo de audio debe ser menor a 10MB', 'error');
        return;
    }

    currentStationMedia.audio = file;

    // Mostrar vista previa
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('audio-preview');
        const audio = document.getElementById('preview-audio');
        
        audio.src = e.target.result;
        preview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

// Remover imagen
function removeImage() {
    currentStationMedia.image = null;
    currentStationMedia.imageUrl = null;
    document.getElementById('station-image').value = '';
    document.getElementById('image-preview').classList.add('hidden');
}

// Remover audio
function removeAudio() {
    currentStationMedia.audio = null;
    currentStationMedia.audioUrl = null;
    document.getElementById('station-audio').value = '';
    document.getElementById('audio-preview').classList.add('hidden');
}

// Subir archivos a Supabase Storage
async function uploadMediaFiles() {
    const uploadedMedia = {
        image: null,
        audio: null
    };

    try {
        // Subir imagen si existe
        if (currentStationMedia.image) {
            const imageFileName = `${Date.now()}_${currentStationMedia.image.name}`;
            const { data: imageData, error: imageError } = await supabase.storage
                .from('adventure-media')
                .upload(`images/${imageFileName}`, currentStationMedia.image);

            if (imageError) {
                console.error('Error al subir imagen:', imageError);
                showAlert('Error al subir la imagen', 'error');
            } else {
                // Obtener URL pública
                const { data: imageUrl } = supabase.storage
                    .from('adventure-media')
                    .getPublicUrl(`images/${imageFileName}`);
                
                uploadedMedia.image = imageUrl.publicUrl;
            }
        }

        // Subir audio si existe
        if (currentStationMedia.audio) {
            const audioFileName = `${Date.now()}_${currentStationMedia.audio.name}`;
            const { data: audioData, error: audioError } = await supabase.storage
                .from('adventure-media')
                .upload(`audio/${audioFileName}`, currentStationMedia.audio);

            if (audioError) {
                console.error('Error al subir audio:', audioError);
                showAlert('Error al subir el audio', 'error');
            } else {
                // Obtener URL pública
                const { data: audioUrl } = supabase.storage
                    .from('adventure-media')
                    .getPublicUrl(`audio/${audioFileName}`);
                
                uploadedMedia.audio = audioUrl.publicUrl;
            }
        }

        return uploadedMedia;
    } catch (error) {
        console.error('Error en uploadMediaFiles:', error);
        showAlert('Error al subir archivos multimedia', 'error');
        return { image: null, audio: null };
    }
}

// Cargar medios existentes en el modal de edición
function loadExistingMedia(station) {
    // Limpiar estado actual
    clearMediaFields();

    if (station.media) {
        // Cargar imagen existente
        if (station.media.image) {
            currentStationMedia.imageUrl = station.media.image;
            const preview = document.getElementById('image-preview');
            const img = document.getElementById('preview-img');
            
            img.src = station.media.image;
            preview.classList.remove('hidden');
        }

        // Cargar audio existente
        if (station.media.audio) {
            currentStationMedia.audioUrl = station.media.audio;
            const preview = document.getElementById('audio-preview');
            const audio = document.getElementById('preview-audio');
            
            audio.src = station.media.audio;
            preview.classList.remove('hidden');
        }
    }
}

// Limpiar campos de medios
function clearMediaFields() {
    currentStationMedia = {
        image: null,
        audio: null,
        imageUrl: null,
        audioUrl: null
    };

    document.getElementById('station-image').value = '';
    document.getElementById('station-audio').value = '';
    document.getElementById('image-preview').classList.add('hidden');
    document.getElementById('audio-preview').classList.add('hidden');
}

// Mostrar medios en la interfaz de juego
function displayStationMedia(station, container) {
    if (!station.media) return;

    let mediaHTML = '';

    // Mostrar imagen
    if (station.media.image) {
        mediaHTML += `
            <div class="station-media">
                <img src="${station.media.image}" alt="Imagen de la estación" loading="lazy">
            </div>
        `;
    }

    // Mostrar audio
    if (station.media.audio) {
        mediaHTML += `
            <div class="station-media">
                <audio controls preload="metadata">
                    <source src="${station.media.audio}" type="audio/mpeg">
                    <source src="${station.media.audio}" type="audio/wav">
                    <source src="${station.media.audio}" type="audio/ogg">
                    Tu navegador no soporta el elemento de audio.
                </audio>
            </div>
        `;
    }

    if (mediaHTML) {
        container.innerHTML = mediaHTML + container.innerHTML;
    }
}

// Eliminar archivos de medios de Supabase Storage
async function deleteMediaFiles(mediaUrls) {
    if (!mediaUrls) return;

    try {
        const deletePromises = [];

        // Eliminar imagen
        if (mediaUrls.image) {
            const imagePath = extractPathFromUrl(mediaUrls.image);
            if (imagePath) {
                deletePromises.push(
                    supabase.storage
                        .from('adventure-media')
                        .remove([imagePath])
                );
            }
        }

        // Eliminar audio
        if (mediaUrls.audio) {
            const audioPath = extractPathFromUrl(mediaUrls.audio);
            if (audioPath) {
                deletePromises.push(
                    supabase.storage
                        .from('adventure-media')
                        .remove([audioPath])
                );
            }
        }

        await Promise.all(deletePromises);
    } catch (error) {
        console.error('Error al eliminar archivos de medios:', error);
    }
}

// Extraer la ruta del archivo de una URL de Supabase Storage
function extractPathFromUrl(url) {
    try {
        const urlParts = url.split('/storage/v1/object/public/adventure-media/');
        return urlParts.length > 1 ? urlParts[1] : null;
    } catch (error) {
        console.error('Error al extraer ruta de URL:', error);
        return null;
    }
}

// Validar archivos de medios antes de la subida
function validateMediaFiles() {
    const errors = [];

    if (currentStationMedia.image) {
        if (!currentStationMedia.image.type.startsWith('image/')) {
            errors.push('El archivo de imagen no es válido');
        }
        if (currentStationMedia.image.size > 5 * 1024 * 1024) {
            errors.push('La imagen debe ser menor a 5MB');
        }
    }

    if (currentStationMedia.audio) {
        if (!currentStationMedia.audio.type.startsWith('audio/')) {
            errors.push('El archivo de audio no es válido');
        }
        if (currentStationMedia.audio.size > 10 * 1024 * 1024) {
            errors.push('El audio debe ser menor a 10MB');
        }
    }

    return errors;
}

// Obtener información de medios para guardar en la estación
function getMediaForStation() {
    const media = {};

    // Usar URLs existentes si no hay archivos nuevos
    if (currentStationMedia.imageUrl && !currentStationMedia.image) {
        media.image = currentStationMedia.imageUrl;
    }

    if (currentStationMedia.audioUrl && !currentStationMedia.audio) {
        media.audio = currentStationMedia.audioUrl;
    }

    return Object.keys(media).length > 0 ? media : null;
}

// Inicializar funcionalidad de medios cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    setupMediaEventListeners();
});

// Exportar funciones para uso global
window.removeImage = removeImage;
window.removeAudio = removeAudio;
window.uploadMediaFiles = uploadMediaFiles;
window.loadExistingMedia = loadExistingMedia;
window.clearMediaFields = clearMediaFields;
window.displayStationMedia = displayStationMedia;
window.deleteMediaFiles = deleteMediaFiles;
window.validateMediaFiles = validateMediaFiles;
window.getMediaForStation = getMediaForStation;

