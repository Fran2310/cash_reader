import { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import { useSpeechRecognition } from './useSpeechRecognition';

export const useVoiceInterface = ({ callTakePhoto, additionalCommands = [], debug = false }) => {
    const [error, setError] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const commandHistory = useRef([]);

    const mergedCommands = useMemo(() => [{
        keyword: 'tomar foto',
        callback: callTakePhoto,
        description: 'Captura una foto usando la cámara'
    }, ...additionalCommands], [additionalCommands, callTakePhoto]);

    const handleVoiceCommand = useCallback((command) => {
        try {
            const cleanCommand = command.toLowerCase().trim();
            
            // Prevenir comandos duplicados consecutivos
            if (commandHistory.current[0] === cleanCommand) return;
            
            commandHistory.current.unshift(cleanCommand);
            if (commandHistory.current.length > 3) commandHistory.current.pop();

            const matchedCommand = mergedCommands.find(c => 
                cleanCommand.includes(c.keyword.toLowerCase())
            );

            if (debug) {
                console.debug('[Voice] Comando detectado:', cleanCommand);
                if (matchedCommand) console.info(`[Voice] Ejecutando: ${matchedCommand.keyword}`);
            }

            matchedCommand?.callback();
        } catch (e) {
            setError(`Error procesando comando: ${e.message}`);
            console.error('[Voice Error]', e);
        }
    }, [mergedCommands, debug]);

    const { startListening, stopListening } = useSpeechRecognition(handleVoiceCommand);

    useEffect(() => {
        startListening();
        setIsListening(true);

        return () => {
            stopListening();
            setIsListening(false);
        };
    }, [startListening, stopListening]);

    return {
        error,
        isListening,
        commands: mergedCommands,
        resetError: () => setError(null)
    };
};