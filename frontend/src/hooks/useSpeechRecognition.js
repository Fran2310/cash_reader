import { useEffect, useRef, useCallback } from "react";

const RETRY_DELAY = 5000;
const MAX_RETRIES = 5;
const COMMAND_DEBOUNCE = 1000;
const MAX_QUEUE_SIZE = 10;

export const useSpeechRecognition = (onCommand) => {
    const recognitionRef = useRef(null);
    const retryCount = useRef(0);
    const lastCommandTime = useRef(0);
    const commandQueue = useRef([]);
    const isProcessing = useRef(false);
    const isActive = useRef(false);

    const handleCommand = useCallback(
        (command) => {
            const now = Date.now();
            if (now - lastCommandTime.current > COMMAND_DEBOUNCE) {
                lastCommandTime.current = now;
                onCommand(command);
            }
        },
        [onCommand]
    );

    const processQueue = useCallback(() => {
        if (!isProcessing.current && commandQueue.current.length > 0) {
            isProcessing.current = true;
            const command = commandQueue.current.shift();
            handleCommand(command);
            setTimeout(() => {
                isProcessing.current = false;
                processQueue();
            }, COMMAND_DEBOUNCE);
        }
    }, [handleCommand]);

    const setupRecognition = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return null;

        const recognition = new SpeechRecognition();
        recognition.lang = "es-ES";
        recognition.interimResults = false;
        recognition.continuous = true;

        recognition.onresult = (event) => {
            try {
                const command = event.results[0][0].transcript.toLowerCase();
                if (commandQueue.current.length < MAX_QUEUE_SIZE) {
                    commandQueue.current.push(command);
                    processQueue();
                }
            } catch (error) {
                console.error("Error procesando resultado:", error);
            }
        };

        recognition.onerror = (event) => {
            if (retryCount.current < MAX_RETRIES) {
                retryCount.current += 1;
                setTimeout(() => isActive.current && recognition.start(), RETRY_DELAY);
            }
        };

        recognition.onend = () => {
            if (isActive.current) {
                setTimeout(() => recognition.start(), 500);
            }
        };

        return recognition;
    }, [processQueue]);

    const startListening = useCallback(() => {
        if (!isActive.current) {
            isActive.current = true;
            recognitionRef.current?.start();
        }
    }, []);

    const stopListening = useCallback(() => {
        if (isActive.current) {
            isActive.current = false;
            recognitionRef.current?.stop();
            commandQueue.current = [];
            retryCount.current = 0;
        }
    }, []);

    useEffect(() => {
        const recognition = setupRecognition();
        if (!recognition) return;

        recognitionRef.current = recognition;
        startListening();

        return () => {
            stopListening();
            recognitionRef.current = null;
        };
    }, [setupRecognition, startListening, stopListening]);

    return { startListening, stopListening };
};