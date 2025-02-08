import React, { useMemo, useEffect } from "react";
import PropTypes from 'prop-types';
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

/**
 * Componente de interfaz de voz optimizado para PWAs
 * Características principales:
 * - Gestión de comandos priorizados
 * - Sistema de reintentos automático
 * - Compatibilidad con modo offline
 */
const VoiceInterface = ({ cameraRef, onError, onFeedback }) => {
    // Comandos esenciales con prioridad
    const commands = useMemo(() => [
        {
            pattern: /tomar\s*foto|toma\s*foto/i,
            action: () => {
                if (!cameraRef.current) return;
                cameraRef.current.takePhoto();
                onFeedback("Foto capturada por voz");
            },
            priority: 1
        },
        {
            pattern: /activar\s*luz|prender\s*flash/i,
            action: () => cameraRef.current?.activateFlash(),
            priority: 2
        }
    ], [cameraRef, onFeedback]);

    // Procesamiento eficiente de comandos
    const handleCommand = useCallback((transcript) => {
        const match = commands.sort((a, b) => b.priority - a.priority)
            .find(({ pattern }) => pattern.test(transcript));
        
        match?.action();
    }, [commands]);

    // Configuración adaptativa para PWAs
    const { error, isSupported, startListening } = useSpeechRecognition({
        onCommand: handleCommand,
        debounceTime: navigator.onLine ? 500 : 1000,
        lang: 'es-ES'
    });

    // Sistema de reintentos automático
    useEffect(() => {
        if (error?.includes('permiso')) {
            const timer = setTimeout(() => startListening(), 3000);
            return () => clearTimeout(timer);
        }
    }, [error, startListening]);

    // Sincronización con estado de la PWA
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', startListening);
        }
        return () => {
            navigator.serviceWorker?.removeEventListener('controllerchange', startListening);
        };
    }, [startListening]);

    return null;
};

VoiceInterface.propTypes = {
    cameraRef: PropTypes.shape({
        current: PropTypes.shape({
            takePhoto: PropTypes.func.isRequired,
            activateFlash: PropTypes.func
        })
    }).isRequired,
    onError: PropTypes.func.isRequired,
    onFeedback: PropTypes.func
};

export default VoiceInterface;