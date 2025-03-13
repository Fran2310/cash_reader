import { useEffect } from "react";

const useFixedWindowSize = (width = 800, height = 600) => {
    useEffect(() => {
        const isMobile = window.innerWidth <= 768; // Define el ancho máximo para móviles

        if (!isMobile) {
            // Establece el tamaño de la ventana
            window.resizeTo(width, height);

            // Centra la ventana en la pantalla
            const left = (window.screen.width - width) / 2;
            const top = (window.screen.height - height) / 2;
            window.moveTo(left, top);

            // Deshabilita el redimensionamiento
            const handleResize = () => {
                window.resizeTo(width, height);
            };
            window.addEventListener("resize", handleResize);

            // Limpia el event listener al desmontar el componente
            return () => {
                window.removeEventListener("resize", handleResize);
            };
        }
    }, [width, height]);
};

export default useFixedWindowSize;