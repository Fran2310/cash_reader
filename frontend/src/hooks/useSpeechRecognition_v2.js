import { useEffect, useRef, useState, useCallback } from "react";

export const useSpeechRecognition_v2 = (onResult) => {
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState(null);
    const recognitionRef = useRef(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError("La API de Speech Recognition no está soportada en este navegador.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "es-ES";
        recognition.interimResults = false;
        recognition.continuous = true; // Se mantiene en escucha continua

        recognition.onstart = () => {
            setIsListening(true);
            console.log("Reconocimiento iniciado");
        };

        recognition.onend = () => {
            setIsListening(false);
            console.log("Reconocimiento finalizado");
            // Nota: No reiniciamos automáticamente para evitar toggles repetitivos.
        };

        recognition.onresult = (event) => {
            const lastResultIndex = event.results.length - 1;
            const transcript = event.results[lastResultIndex][0].transcript.trim();
            console.log("Microphone captured:", transcript);
            onResult && onResult(transcript);
        };

        recognition.onerror = (event) => {
            setError(event.error);
            console.error("Error en SpeechRecognition:", event.error);
        };

        recognitionRef.current = recognition;

        // Cleanup: Detener el reconocimiento al desmontar
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
                recognitionRef.current = null;
            }
        };
    }, [onResult]);

    const start = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Error al iniciar el reconocimiento:", e);
            }
        }
    }, []);

    const stop = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    return { isListening, error, start, stop };
};
