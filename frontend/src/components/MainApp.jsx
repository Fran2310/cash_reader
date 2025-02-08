import React, { useRef, useState, useEffect } from "react";
import Camera from "./Camera";
import VoiceInterface from "./VoiceInterface";
import "./MainApp.css";

/**
 * Componente principal con optimizaciones para PWAs
 * - Gestión de estado offline
 * - UI adaptativa para controles de voz
 * - Sistema de notificaciones integrado
 */
const MainApp = () => {
    const cameraRef = useRef(null);
    const [status, setStatus] = useState("Iniciando...");
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // Sistema de estado de conexión
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Handler de errores unificado
    const handleError = (message) => {
        setStatus(`Error: ${message}`);
        if (message.includes('permiso')) {
            navigator.vibrate?.(200); // Feedback táctil
        }
    };

    return (
        <div className={`pwa-container ${!isOnline ? 'offline' : ''}`}>
            <Camera ref={cameraRef} />
            
            <VoiceInterface 
                cameraRef={cameraRef}
                onError={handleError}
                onFeedback={setStatus}
            />

            <div className="status-overlay">
                <div className="mic-status" aria-live="polite">
                    {status}
                </div>
                {!isOnline && (
                    <div className="offline-banner">
                        Modo offline activado
                    </div>
                )}
            </div>
        </div>
    );
};

export default MainApp;