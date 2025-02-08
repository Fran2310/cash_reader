import React, { useMemo, useEffect } from "react";
import PropTypes from 'prop-types';
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

/**
 * Interfaz de voz para controlar la cámara mediante comandos
 * @param {Object} props
 * @param {React.MutableRefObject} props.cameraRef - Referencia al componente Camera
 * @param {Function} props.onError - Manejador de errores
 * @param {Function} props.onFeedback - Callback para feedback de usuario
 */
const VoiceInterface = ({ cameraRef, onError, onFeedback }) => {
    // 1. Comandos base con referencia a la cámara
    const baseCommands = useMemo(() => [
        {
            keyword: "tomar foto",
            action: () => {
                if (!cameraRef.current) {
                    onError("Cámara no disponible");
                    return;
                }
                cameraRef.current.takePhoto();
                onFeedback("Foto tomada por voz");
            },
            exactMatch: true,
            minConfidence: 0.8
        },
        {
            keyword: "activar luz",
            action: () => cameraRef.current?.activateFlash(),
            partialMatch: true
        },
        {
            keyword: "apagar luz",
            action: () => cameraRef.current?.deactivateFlash(),
            partialMatch: true
        }
    ], [cameraRef, onError, onFeedback]);

    // 2. Normalización de texto para comandos en español
    const normalizeText = (text) => {
        return text
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos
            .replace(/[^\w\s]/g, ''); // Eliminar caracteres especiales
    };

    // 3. Procesamiento de comandos de voz
    const handleVoiceCommand = (transcript) => {
        const cleanText = normalizeText(transcript);
        
        const command = baseCommands.find(({ keyword, exactMatch }) => {
            const target = normalizeText(keyword);
            return exactMatch ? 
                cleanText === target : 
                cleanText.includes(target);
        });

        if (command) {
            try {
                command.action();
                console.log(`Comando ejecutado: ${command.keyword}`);
            } catch (error) {
                onError(`Error en comando: ${error.message}`);
            }
        }
    };

    // 4. Configuración del reconocimiento de voz
    const { error, isSupported } = useSpeechRecognition({
        onCommand: handleVoiceCommand,
        lang: 'es-ES',
        continuous: true,
        debounceTime: 400
    });

    // 5. Manejo de estados del sistema
    useEffect(() => {
        if (!isSupported) {
            onError("Funcionalidad de voz no soportada");
            return;
        }
        
        if (error) {
            onError(`Error de voz: ${error}`);
        }
    }, [error, isSupported, onError]);

    return null;
};

VoiceInterface.propTypes = {
    cameraRef: PropTypes.shape({
        current: PropTypes.shape({
            takePhoto: PropTypes.func,
            activateFlash: PropTypes.func,
            deactivateFlash: PropTypes.func
        })
    }).isRequired,
    onError: PropTypes.func.isRequired,
    onFeedback: PropTypes.func
};

export default VoiceInterface;