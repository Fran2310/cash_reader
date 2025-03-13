import { useEffect, useRef } from "react";
import { useSpeechSynthesis } from "./useSpeechSynthesis";

const useNarrator = (text, onNarrationComplete) => {
    const { speak } = useSpeechSynthesis();
    const lastTextRef = useRef(""); // Almacenar el último texto narrado

    useEffect(() => {
        if (text)  { // Quitar lo de Yisus
            lastTextRef.current = text;
            console.log("Narración:", text);

            speak(text, {
                onend: () => {
                    if (onNarrationComplete) {
                        onNarrationComplete();
                    }
                },
            });
        }
    }, [text, speak, onNarrationComplete]);
};

export default useNarrator;
