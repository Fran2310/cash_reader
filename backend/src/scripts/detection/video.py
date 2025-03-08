import cv2 as cv
import numpy as np
import os

def callback(input):
    pass

def segmentar_por_contraste(img, umbral_contraste=100, umbral_area=1000):
    """
    Segmenta la imagen basada en el contraste.
    :param img: Imagen de entrada.
    :param umbral_contraste: Umbral para resaltar regiones de alto contraste.
    :param umbral_area: Área mínima para considerar una región relevante.
    :return: Máscara binaria y la imagen segmentada.
    """
    # Convertir la imagen a escala de grises
    gray = cv.cvtColor(img, cv.COLOR_BGR2GRAY)

    # Aplicar un filtro de suavizado para reducir el ruido
    blurred = cv.GaussianBlur(gray, (9, 9), 0)

    # Calcular el gradiente (contraste) usando Sobel
    grad_x = cv.Sobel(blurred, cv.CV_64F, 1, 0, ksize=3)
    grad_y = cv.Sobel(blurred, cv.CV_64F, 0, 1, ksize=3)
    grad = np.sqrt(grad_x**2 + grad_y**2)
    grad = np.uint8(255 * (grad / np.max(grad)))  # Normalizar a 0-255

    # Aplicar un umbral al gradiente para resaltar regiones de alto contraste
    _, mask = cv.threshold(grad, umbral_contraste, 255, cv.THRESH_BINARY)

    # Encontrar contornos en la máscara
    contornos, _ = cv.findContours(mask, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

    # Filtrar contornos por área
    contornos_filtrados = [cnt for cnt in contornos if cv.contourArea(cnt) > umbral_area]

    # Crear una máscara vacía para dibujar los contornos filtrados
    mask_filtrada = np.zeros_like(mask)

    # Dibujar los contornos filtrados en la máscara
    cv.drawContours(mask_filtrada, contornos_filtrados, -1, 255, thickness=cv.FILLED)

    # Aplicar la máscara a la imagen original
    img_segmentada = cv.bitwise_and(img, img, mask=mask_filtrada)

    return mask_filtrada, img_segmentada

def procesar_imagen(carpeta_imagenes):
    """
    Procesa las imágenes en la carpeta especificada.
    :param carpeta_imagenes: Ruta de la carpeta que contiene las imágenes.
    """
    # Obtener la lista de imágenes en la carpeta
    imagenes = [img for img in os.listdir(carpeta_imagenes) if img.endswith(('orign.jpg', 'orign.jpeg'))]
    if not imagenes:
        print("Error: No se encontraron imágenes en la carpeta.")
        return

    # Índice de la imagen actual
    indice_imagen = 0

    # Crear ventana para Segmentacion
    cv.namedWindow('Segmentacion')

    # Trackbars para ajustar los parámetros de contraste
    cv.createTrackbar('Umbral Contraste', 'Segmentacion', 100, 255, callback)  # Umbral de contraste (0-255)
    cv.createTrackbar('Umbral Area', 'Segmentacion', 1000, 5000, callback)  # Umbral de área (100-5000)

    while True:
        # Cargar la imagen actual
        img_path = os.path.join(carpeta_imagenes, imagenes[indice_imagen])
        img = cv.imread(img_path)

        # Verifica si la imagen se cargó correctamente
        if img is None:
            print(f"Error: No se pudo cargar la imagen {img_path}.")
            break

        # Obtener los valores de los trackbars
        umbral_contraste = cv.getTrackbarPos('Umbral Contraste', 'Segmentacion')
        umbral_area = cv.getTrackbarPos('Umbral Area', 'Segmentacion')

        # Segmentar la imagen por contraste
        mask, img_segmentada = segmentar_por_contraste(img, umbral_contraste, umbral_area)

        # Mostrar la imagen segmentada
        cv.imshow('Segmentacion', img_segmentada)

        # Mostrar el nombre de la imagen actual
        cv.setWindowTitle('Segmentacion', f'Imagen {indice_imagen + 1}/{len(imagenes)}: {imagenes[indice_imagen]}')

        # Esperar a que el usuario presione una tecla
        key = cv.waitKey(1)

        # Navegación entre imágenes
        if key == ord('a'):  # Tecla 'a' para retroceder
            indice_imagen = (indice_imagen - 1) % len(imagenes)
        elif key == ord('d'):  # Tecla 'd' para avanzar
            indice_imagen = (indice_imagen + 1) % len(imagenes)
        elif key == ord('q'):  # Tecla 'q' para salir
            break

    cv.destroyAllWindows()

if __name__ == '__main__':
    # Especifica la carpeta que contiene las imágenes
    carpeta_imagenes = 'backend/src/data/img-API/VEF/Model_9'
    procesar_imagen(carpeta_imagenes)