import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

/**
 * @typedef {Object} VoiceInterfaceConfig
 * @property {Function} callTakePhoto - Función para capturar foto
 * @property {Array<Command>} [additionalCommands=[]] - Comandos personalizados adicionales
 * @property {boolean} [debug=false] - Modo debug para logs detallados
 */

/**
 * @typedef {Object} Command
 * @property {string} keyword - Palabra clave para activar el comando
 * @property {Function} callback - Función a ejecutar
 */

/**
 * Hook personalizado para manejar una interfaz de voz robusta
 * @param {VoiceInterfaceConfig} config - Configuración de la interfaz de voz
 * @returns {{error: string|null, isListening: boolean}} Estado del reconocimiento
 */
export const useVoiceInterface = ({ callTakePhoto, additionalCommands = [], debug = false }) => {
  // Memoiza los comandos para evitar recreación en cada render
  const mergedCommands = useMemo(() => {
    /** @type {Command[]} */
    const defaults = [{
      keyword: 'tomar foto',
      callback: callTakePhoto,
      description: 'Captura una foto usando la cámara'
    }];
    
    return [...defaults, ...additionalCommands];
  }, [additionalCommands, callTakePhoto]); // Solo recalcula si cambian las dependencias

  // Manejo centralizado de errores
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);

  // Handler optimizado con memoización
  const handleVoiceCommand = useCallback((command) => {
    if (debug) console.debug('[Voice] Comando detectado:', command);
    
    try {
      const matchedCommand = mergedCommands.find(c => {
        const cleanCommand = command.toLowerCase().trim();
        return cleanCommand.includes(c.keyword.toLowerCase());
      });

      if (matchedCommand) {
        if (debug) console.info(`[Voice] Ejecutando comando: ${matchedCommand.keyword}`);
        matchedCommand.callback();
      }
    } catch (e) {
      setError(`Error procesando comando: ${e.message}`);
      console.error('[Voice Error]', e);
    }
  }, [mergedCommands, debug]);

  // Estado del reconocimiento de voz
  const { start, stop, isListening: speechState } = useSpeechRecognition({
    onCommand: handleVoiceCommand,
    lang: 'es-ES',
    continuous: true
  });

  // Sincroniza el estado del listening
  useEffect(() => {
    setIsListening(speechState);
  }, [speechState]);

  // Ciclo de vida automático
  useEffect(() => {
    try {
      start();
      return () => stop();
    } catch (e) {
      setError('Error al iniciar reconocimiento de voz');
      console.error('[Voice Init Error]', e);
    }
  }, [start, stop]);

  // Debug: Log de comandos registrados
  useEffect(() => {
    if (debug) {
      console.group('[Voice] Comandos registrados');
      mergedCommands.forEach(c => console.log(`- ${c.keyword}: ${c.description || 'Sin descripción'}`));
      console.groupEnd();
    }
  }, [mergedCommands, debug]);

  return {
    error,
    isListening,
    commands: mergedCommands // Expone comandos para debugging
  };
};