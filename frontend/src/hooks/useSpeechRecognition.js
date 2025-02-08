import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook personalizado para reconocimiento de voz con soporte multi-navegador
 * @param {Object} options - Configuración del reconocimiento
 * @param {string} [options.lang='es-ES'] - Idioma para el reconocimiento
 * @param {number} [options.minConfidence=0.7] - Confianza mínima (0-1) para aceptar resultados
 * @param {number} [options.debounceTime=300] - Tiempo mínimo (ms) entre comandos procesados
 * @param {boolean} [options.continuous=true] - Mantener el reconocimiento activo continuamente
 * @param {function} [options.onCommand] - Callback para comandos reconocidos
 */
export const useSpeechRecognition = (options = {}) => {
    // Destructuración de opciones con valores por defecto
    const {
        lang = 'es-ES',
        minConfidence = 0.7,
        debounceTime = 300,
        continuous = true,
        onCommand
    } = options;

    // Referencias persistentes para mantener estado entre renders
    const recognitionRef = useRef(null);
    const lastProcessedRef = useRef(0);

    // Estado principal del hook
    const [state, setState] = useState({
        isListening: false,  // Si el reconocimiento está activo
        error: null,         // Último error ocurrido
        isSupported: false   // Soporte del navegador
    });

    /**
     * Maneja errores de forma centralizada
     * @param {string|Error} error - Error a registrar
     */
    const handleError = useCallback((error) => {
        console.error('Error en reconocimiento de voz:', error);
        setState(prev => ({
            ...prev,
            error: typeof error === 'string' ? error : error.message,
            isListening: false
        }));
    }, []);

    /**
     * Procesa los resultados del reconocimiento con validaciones
     * @param {SpeechRecognitionEvent} event - Evento de resultados
     * @returns {string|null} Transcript limpio o null si no pasa validaciones
     */
    const processResult = useCallback((event) => {
        if (!event.results) return null;
        
        // Calcular tiempo desde último procesamiento
        const now = Date.now();
        if (now - lastProcessedRef.current < debounceTime) return null;
        
        // Obtener último resultado del array
        const results = Array.from(event.results);
        const lastResult = results[results.length - 1][0];
        
        // Validar confianza mínima
        if (lastResult.confidence < minConfidence) return null;
        
        // Limpiar y normalizar el transcript
        const transcript = lastResult.transcript
            .toLowerCase()
            .trim()
            .replace(/[^\w\sáéíóúñ]/gi, '');  // Eliminar caracteres especiales

        lastProcessedRef.current = now;
        return transcript;
    }, [debounceTime, minConfidence]);

    // Efecto principal: Configuración inicial del reconocimiento
    useEffect(() => {
        // Detectar implementación del navegador
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            handleError('API de reconocimiento de voz no soportada');
            return;
        }

        // Crear instancia de reconocimiento
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        // Configuración básica
        recognition.lang = lang;
        recognition.continuous = continuous;
        recognition.interimResults = false;  // Ignorar resultados parciales
        recognition.maxAlternatives = 1;     // Solo el mejor resultado

        // Manejadores de eventos
        recognition.onstart = () => {
            setState(prev => ({ ...prev, isListening: true }));
            console.log('Reconocimiento de voz iniciado');
        };
        
        recognition.onend = () => {
            setState(prev => ({ ...prev, isListening: false }));
            console.log('Reconocimiento de voz detenido');
        };

        recognition.onresult = (event) => {
            const transcript = processResult(event);
            if (transcript && onCommand) {
                console.log('Comando válido detectado:', transcript);
                onCommand(transcript);
            }
        };

        recognition.onerror = (event) => {
            // Manejar errores específicos
            const errorMap = {
                'no-speech': 'No se detectó voz',
                'audio-capture': 'Error de acceso al micrófono',
                'not-allowed': 'Permiso denegado'
            };
            handleError(errorMap[event.error] || event.error);
        };

        // Marcar como soportado si llegamos aquí
        setState(prev => ({ ...prev, isSupported: true }));

        // Limpieza al desmontar
        return () => {
            recognition.abort();
            recognitionRef.current = null;
        };
    }, [lang, continuous, handleError, processResult, onCommand]);

    /**
     * Verifica los permisos del micrófono
     * @returns {Promise<boolean>} True si los permisos están otorgados
     */
    const checkPermissions = useCallback(async () => {
        try {
            // API de Permissions solo disponible en navegadores modernos
            if (!navigator.permissions) {
                console.warn('API de permisos no soportada');
                return true;  // Asumir permisos si no hay API
            }

            const permission = await navigator.permissions.query({ name: 'microphone' });
            
            if (permission.state === 'denied') {
                handleError('Acceso al micrófono denegado por el usuario');
                return false;
            }
            
            return true;
        } catch (error) {
            handleError('Error al verificar permisos: ' + error.message);
            return false;
        }
    }, [handleError]);

    /**
     * Inicia el reconocimiento de voz con validación de permisos
     */
    const startListening = useCallback(async () => {
        if (state.isListening || !recognitionRef.current) return;

        try {
            const hasPermission = await checkPermissions();
            if (!hasPermission) return;

            recognitionRef.current.start();
        } catch (error) {
            // Manejar errores de inicio (ej: ya está corriendo)
            handleError(error);
        }
    }, [state.isListening, checkPermissions, handleError]);

    /**
     * Detiene el reconocimiento de voz
     */
    const stopListening = useCallback(() => {
        if (recognitionRef.current && state.isListening) {
            try {
                recognitionRef.current.stop();
            } catch (error) {
                handleError(error);
            }
        }
    }, [state.isListening]);

    // Limpieza global al desmontar el componente
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    // API pública del hook
    return {
        /** Inicia el reconocimiento */
        startListening,
        /** Detiene el reconocimiento */
        stopListening,
        /** Alterna entre estados de escucha */
        toggleListening: () => state.isListening ? stopListening() : startListening(),
        /** Estado actual de escucha */
        isListening: state.isListening,
        /** Último error ocurrido */
        error: state.error,
        /** Soporte del navegador */
        isSupported: state.isSupported,
        /** Idiomas soportados (ejemplo) */
        supportedLanguages: ['es-ES', 'en-US', 'fr-FR', 'de-DE']
    };
};