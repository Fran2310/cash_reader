import { useEffect, useRef, useState } from "react";

export const useVoiceInterface_v2 = () => {
    const recognitionRef = useRef(null);
    const isMounted = useRef(true);
    const restartTimeout = useRef(null);

    // Nueva variable de estado para forzar actualizaciones
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        isMounted.current = true;

        const initializeRecognition = () => {
            if (!("webkitSpeechRecognition" in window)) {
                console.warn("Navegador no compatible");
                return;
            }

            const SpeechRecognition = window.webkitSpeechRecognition;
            const SpeechGrammarList = window.webkitSpeechGrammarList;

            // Configuración de gramáticas (mejorada con alternativas)
            const grammar = `
                #JSGF V1.0;
                grammar comandos;
                public <comando> = tomar foto | tomar fotografía | capturar imagen;
            `;

            const recognition = new SpeechRecognition();
            const grammarList = new SpeechGrammarList();
            grammarList.addFromString(grammar, 1);

            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = "es-ES";
            recognition.grammars = grammarList;

            // Manejo de eventos mejorado
            recognition.onresult = (event) => {
                const result = event.results[event.resultIndex];
                if (result.isFinal) {
                    const transcript = result[0].transcript.trim().toLowerCase();
                    if (transcript.includes("tomar foto")) {
                        console.log("✅ Comando detectado!");
                    }
                }
            };

            recognition.onerror = (event) => {
                console.error("Error:", event.error);
                if (event.error === "no-speech" || event.error === "network") {
                    scheduleRestart();
                }
            };

            recognition.onend = () => {
                if (isMounted.current) {
                    scheduleRestart();
                }
            };

            try {
                recognition.start();
                recognitionRef.current = recognition;
            } catch (error) {
                console.error("Error al iniciar:", error);
                scheduleRestart();
            }
        };

        const scheduleRestart = () => {
            if (restartTimeout.current) clearTimeout(restartTimeout.current);
            restartTimeout.current = setTimeout(() => {
                if (isMounted.current) {
                    setAttempt((prev) => prev + 1); // Forzar reinicio
                }
            }, 1000); // Retardo de 1 segundo para reinicio
        };

        initializeRecognition();

        return () => {
            isMounted.current = false;
            if (restartTimeout.current) clearTimeout(restartTimeout.current);
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
        };
    }, [attempt]); // Reinicia cuando cambia 'attempt'

    return null;
};
