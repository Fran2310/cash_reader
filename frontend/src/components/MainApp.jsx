import React, { useRef, useState } from "react";
import Camera from "./Camera";
import VoiceInterface from "./VoiceInterface";

const MainApp = () => {
    const cameraRef = useRef(null);
    const [statusMessage, setStatusMessage] = useState("");

    return (
        <div className="app-root">
            <Camera ref={cameraRef} />
            
            <VoiceInterface 
                cameraRef={cameraRef}
                onError={(msg) => setStatusMessage(`Error: ${msg}`)}
                onFeedback={(msg) => setStatusMessage(msg)}
            />

            <div className="status-bar">
                {statusMessage}
            </div>
        </div>
    );
};