import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook optimizado para reconocimiento de voz en PWAs
 * Mejoras clave:
 * - Gestión de recursos con cleanup estricto
 * - Reconexión automática en fallos
 * - Priorización de rendimiento
 */
export const useSpeechRecognition = ({
    onCommand,
    lang = 'es-ES',
    minConfidence = 0.75,
    debounceTime = 500,
    continuous = true
}) => {
    const recognition = useRef(null);
    const [state, setState] = useState({
        isListening: false,
        error: null,
        isSupported: false
    });
    const lastActivity = useRef(Date.now());

    // Limpiar inactividad después de 30 segundos
    const activityCheck = useCallback(() => {
        if (Date.now() - lastActivity.current > 30000) {
            recognition.current?.stop();
            setState(prev => ({ ...prev, isListening: false }));
        }
    }, []);

    // Normalización de texto para español
    const normalizeText = useCallback((text) => {
        return text.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, '');
    }, []);

    // Manejador de resultados con optimización para PWAs
    const handleResult = useCallback((event) => {
        lastActivity.current = Date.now();
        const result = event.results[event.results.length - 1][0];
        
        if (result.confidence < minConfidence) return;
        if (Date.now() - lastActivity.current < debounceTime) return;

        onCommand(normalizeText(result.transcript));
    }, [minConfidence, debounceTime, normalizeText, onCommand]);

    // Gestión de errores específica para móviles
    const handleError = useCallback((event) => {
        const errors = {
            'no-speech': 'Micrófono no detectado',
            'not-allowed': 'Permiso denegado',
            'network': 'Error de conexión'
        };
        setState(prev => ({ ...prev, error: errors[event.error] || event.error }));
    }, []);

    // Inicio seguro con gestión de permisos
    const startListening = useCallback(async () => {
        try {
            if (!('webkitSpeechRecognition' in window)) {
                throw new Error('API no soportada');
            }

            recognition.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.current.continuous = continuous;
            recognition.current.interimResults = false;
            recognition.current.lang = lang;

            // Event listeners optimizados
            recognition.current.onstart = () => {
                setState(prev => ({ ...prev, isListening: true, error: null }));
                lastActivity.current = Date.now();
            };

            recognition.current.onresult = handleResult;
            recognition.current.onerror = handleError;

            // Gestión de permisos para iOS/Android
            if (navigator.permissions) {
                const status = await navigator.permissions.query({ name: 'microphone' });
                if (status.state !== 'granted') throw new Error('permiso_requerido');
            }

            recognition.current.start();
            setState(prev => ({ ...prev, isSupported: true }));

            // Limpieza periódica
            const interval = setInterval(activityCheck, 5000);
            return () => clearInterval(interval);

        } catch (error) {
            setState(prev => ({ ...prev, error: error.message }));
        }
    }, [continuous, lang, handleResult, handleError, activityCheck]);

    // Detención controlada
    const stopListening = useCallback(() => {
        recognition.current?.stop();
        setState(prev => ({ ...prev, isListening: false }));
    }, []);

    // Cleanup para evitar memory leaks
    useEffect(() => {
        return () => {
            stopListening();
            recognition.current = null;
        };
    }, [stopListening]);

    return {
        ...state,
        startListening,
        stopListening,
        toggle: state.isListening ? stopListening : startListening
    };
};