// Variabili globali
let currentCoordinates = { lat: null, lng: null, city: null };

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const cityInput = document.getElementById('cityInput');
    const searchBtn = document.getElementById('searchBtn');
    
    // Ricerca al premere Enter
    cityInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchCoordinates();
        }
    });
    
    // Focus automatico sull'input
    cityInput.focus();
});

// Funzione per ottenere la posizione GPS corrente
async function getCurrentLocation() {
    // Verifica se la geolocalizzazione è supportata
    if (!navigator.geolocation) {
        showError('La geolocalizzazione non è supportata dal tuo browser');
        return;
    }
    
    // UI loading state
    setLocationLoadingState(true);
    hideResults();
    hideError();
    
    // Opzioni per la geolocalizzazione
    const options = {
        enableHighAccuracy: true,     // Usa GPS se disponibile
        timeout: 15000,              // Timeout di 15 secondi
        maximumAge: 60000            // Cache per 1 minuto
    };
    
    try {
        // Richiedi la posizione
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, options);
        });
        
        const { latitude, longitude } = position.coords;
        const accuracy = position.coords.accuracy;
        
        // Ottieni il nome della località dalle coordinate (reverse geocoding)
        const locationName = await getReverseGeocode(latitude, longitude);
        
        // Prepara i dati per la visualizzazione
        currentCoordinates = {
            lat: latitude.toFixed(6),
            lng: longitude.toFixed(6),
            city: locationName || 'La tua posizione corrente'
        };
        
        // Mostra i risultati con informazioni aggiuntive sulla precisione
        showLocationResults({
            lat: latitude.toFixed(6),
            lng: longitude.toFixed(6),
            display_name: locationName || 'La tua posizione corrente',
            accuracy: Math.round(accuracy)
        });
        
        showToast(`Posizione trovata con precisione di ${Math.round(accuracy)}m`, 'success');
        
    } catch (error) {
        console.error('Errore geolocalizzazione:', error);
        handleGeolocationError(error);
    } finally {
        setLocationLoadingState(false);
    }
}

// Reverse geocoding: ottiene il nome della località dalle coordinate
async function getReverseGeocode(lat, lng) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'CoordinateWebApp/1.0'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.display_name) {
            // Estrae informazioni utili dall'indirizzo
            const address = data.address || {};
            const parts = [];
            
            // Priorità: città, paese, frazione, stato
            if (address.city) parts.push(address.city);
            else if (address.town) parts.push(address.town);
            else if (address.village) parts.push(address.village);
            else if (address.hamlet) parts.push(address.hamlet);
            
            if (address.province) parts.push(address.province);
            if (address.region) parts.push(address.region);
            
            return parts.length > 0 ? parts.join(', ') : data.display_name.split(',')[0];
        }
        
        return null;
    } catch (error) {
        console.error('Errore reverse geocoding:', error);
        return null;
    }
}

// Gestisce gli errori di geolocalizzazione
function handleGeolocationError(error) {
    let message = '';
    
    switch (error.code) {
        case error.PERMISSION_DENIED:
            message = 'Accesso alla posizione negato. Abilita i permessi di localizzazione nelle impostazioni del browser.';
            break;
        case error.POSITION_UNAVAILABLE:
            message = 'Posizione non disponibile. Assicurati di essere connesso a internet e di avere il GPS attivato.';
            break;
        case error.TIMEOUT:
            message = 'Timeout nella ricerca della posizione. Riprova o controlla la connessione.';
            break;
        default:
            message = 'Errore sconosciuto nella ricerca della posizione.';
            break;
    }
    
    showError(message);
}

// Gestione dello stato di loading per il bottone posizione
function setLocationLoadingState(isLoading) {
    const locationBtn = document.getElementById('locationBtn');
    const locationText = document.getElementById('locationText');
    const locationIcon = document.getElementById('locationIcon');
    const locationSpinner = document.getElementById('locationSpinner');
    
    if (isLoading) {
        locationBtn.disabled = true;
        locationText.textContent = 'Ricerca posizione...';
        locationIcon.style.display = 'none';
        locationSpinner.style.display = 'inline';
    } else {
        locationBtn.disabled = false;
        locationText.textContent = 'La mia posizione';
        locationIcon.style.display = 'inline';
        locationSpinner.style.display = 'none';
    }
}

// Mostra i risultati della geolocalizzazione
function showLocationResults(locationData) {
    const resultSection = document.getElementById('resultSection');
    const resultCity = document.getElementById('resultCity');
    const latitude = document.getElementById('latitude');
    const longitude = document.getElementById('longitude');
    
    resultCity.innerHTML = `📍 ${locationData.display_name}`;
    
    // Aggiungi informazioni sulla precisione se disponibili
    if (locationData.accuracy) {
        resultCity.innerHTML += `<br><small style="font-weight: normal; color: #666;">Precisione: ~${locationData.accuracy} metri</small>`;
    }
    
    latitude.textContent = locationData.lat;
    longitude.textContent = locationData.lng;
    
    resultSection.style.display = 'block';
    
    // Smooth scroll verso i risultati
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Funzione principale per la ricerca delle coordinate
async function searchCoordinates() {
    const cityName = document.getElementById('cityInput').value.trim();
    
    if (!cityName) {
        showError('Per favore inserisci il nome di un comune');
        return;
    }
    
    // UI loading state
    setLoadingState(true);
    hideResults();
    hideError();
    
    try {
        const coordinates = await getCoordinates(cityName);
        
        if (coordinates.lat && coordinates.lng) {
            currentCoordinates = {
                lat: coordinates.lat,
                lng: coordinates.lng,
                city: coordinates.display_name
            };
            showResults(coordinates);
        } else {
            showError(`Impossibile trovare le coordinate per "${cityName}". Verifica il nome del comune e riprova.`);
        }
    } catch (error) {
        console.error('Errore nella ricerca:', error);
        showError('Si è verificato un errore durante la ricerca. Riprova tra qualche momento.');
    } finally {
        setLoadingState(false);
    }
}

// Funzione per ottenere le coordinate tramite API Nominatim
async function getCoordinates(cityName) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)},Italia&format=json&limit=1&addressdetails=1`;
    
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'CoordinateWebApp/1.0'
        }
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
        const result = data[0];
        return {
            lat: parseFloat(result.lat).toFixed(6),
            lng: parseFloat(result.lon).toFixed(6),
            display_name: result.display_name
        };
    }
    
    return { lat: null, lng: null };
}

// Gestione dello stato di loading
function setLoadingState(isLoading) {
    const searchBtn = document.getElementById('searchBtn');
    const searchText = document.getElementById('searchText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    if (isLoading) {
        searchBtn.disabled = true;
        searchText.style.display = 'none';
        loadingSpinner.style.display = 'inline';
    } else {
        searchBtn.disabled = false;
        searchText.style.display = 'inline';
        loadingSpinner.style.display = 'none';
    }
}

// Mostra i risultati
function showResults(coordinates) {
    const resultSection = document.getElementById('resultSection');
    const resultCity = document.getElementById('resultCity');
    const latitude = document.getElementById('latitude');
    const longitude = document.getElementById('longitude');
    
    // Estrae solo il nome della città dal display_name completo
    const cityName = extractCityName(coordinates.display_name);
    
    resultCity.textContent = cityName;
    latitude.textContent = coordinates.lat;
    longitude.textContent = coordinates.lng;
    
    resultSection.style.display = 'block';
    
    // Smooth scroll verso i risultati
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Estrae il nome della città dal display_name di Nominatim
function extractCityName(displayName) {
    if (!displayName) return 'Comune trovato';
    
    // Il display_name ha formato: "Città, Provincia, Regione, Italia"
    const parts = displayName.split(',');
    return parts[0].trim();
}

// Nasconde i risultati
function hideResults() {
    document.getElementById('resultSection').style.display = 'none';
}

// Mostra errore
function showError(message) {
    const errorSection = document.getElementById('errorSection');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = message;
    errorSection.style.display = 'block';
    
    // Smooth scroll verso l'errore
    errorSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Nasconde errore
function hideError() {
    document.getElementById('errorSection').style.display = 'none';
}

// Copia singola coordinata negli appunti
async function copyToClipboard(coordinateType) {
    const element = document.getElementById(coordinateType);
    const value = element.textContent;
    
    try {
        await navigator.clipboard.writeText(value);
        showToast(`${coordinateType === 'latitude' ? 'Latitudine' : 'Longitudine'} copiata!`, 'success');
    } catch (err) {
        // Fallback per browser più vecchi
        fallbackCopyTextToClipboard(value);
        showToast(`${coordinateType === 'latitude' ? 'Latitudine' : 'Longitudine'} copiata!`, 'success');
    }
}

// Copia entrambe le coordinate
async function copyBothCoordinates() {
    const lat = document.getElementById('latitude').textContent;
    const lng = document.getElementById('longitude').textContent;
    const coordinates = `${lat}, ${lng}`;
    
    try {
        await navigator.clipboard.writeText(coordinates);
        showToast('Coordinate copiate negli appunti!', 'success');
    } catch (err) {
        // Fallback per browser più vecchi
        fallbackCopyTextToClipboard(coordinates);
        showToast('Coordinate copiate negli appunti!', 'success');
    }
}

// Fallback per la copia negli appunti
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
    } catch (err) {
        console.error('Fallback: Impossibile copiare', err);
    }
    
    document.body.removeChild(textArea);
}

// Apre Google Maps con le coordinate
function openGoogleMaps() {
    if (currentCoordinates.lat && currentCoordinates.lng) {
        const url = `https://www.google.com/maps?q=${currentCoordinates.lat},${currentCoordinates.lng}`;
        window.open(url, '_blank');
    }
}

// Sistema di notifiche toast
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Gestione degli errori globali
window.addEventListener('error', function(e) {
    console.error('Errore globale:', e.error);
    showToast('Si è verificato un errore imprevisto', 'error');
});

// Gestione degli errori nelle Promise
window.addEventListener('unhandledrejection', function(e) {
    console.error('Promise rejettata:', e.reason);
    showToast('Errore di connessione', 'error');
});

// Funzioni di utilità
function formatCoordinate(coord, decimals = 6) {
    return parseFloat(coord).toFixed(decimals);
}

// Validazione input
function isValidCityName(name) {
    return name && name.length > 1 && name.length < 100;
}

// Funzione di debounce per eventuali future implementazioni di suggestions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}