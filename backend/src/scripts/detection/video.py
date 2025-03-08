import cv2 as cv
import os
import numpy as np

def callback(input):
    pass

def segmentar_por_tamaño(roi, umbral_area=1000):
    """
    Segmenta la ROI por tamaño.
    :param roi: Región de interés (imagen recortada).
    :param umbral_area: Área mínima para considerar una región relevante.
    :return: Máscara binaria de la segmentación y la ROI filtrada.
    """
    # Convertir la ROI a escala de grises
    gray = cv.cvtColor(roi, cv.COLOR_BGR2GRAY)

    # Aplicar umbralización para obtener una máscara binaria
    _, mask = cv.threshold(gray, 0, 255, cv.THRESH_OTSU)

    # Encontrar contornos en la máscara
    contornos, _ = cv.findContours(mask, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

    # Filtrar contornos por área
    contornos_filtrados = [cnt for cnt in contornos if cv.contourArea(cnt) > umbral_area]

    # Crear una máscara vacía para dibujar los contornos filtrados
    mask_filtrada = np.zeros_like(mask)

    # Dibujar los contornos filtrados en la máscara
    cv.drawContours(mask_filtrada, contornos_filtrados, -1, 255, thickness=cv.FILLED)

    # Si hay contornos filtrados, seleccionar el más grande
    if len(contornos_filtrados) > 0:
        # Encontrar el contorno más grande
        cnt_principal = max(contornos_filtrados, key=cv.contourArea)

        # Crear una máscara solo para el contorno más grande
        mask_principal = np.zeros_like(mask)
        cv.drawContours(mask_principal, [cnt_principal], -1, 255, thickness=cv.FILLED)

        # Aplicar la máscara a la ROI original
        roi_filtrada = cv.bitwise_and(roi, roi, mask=mask_principal)
    else:
        # Si no hay contornos relevantes, devolver la máscara vacía y la ROI original
        roi_filtrada = roi
        mask_principal = np.zeros_like(mask)

    return mask_principal, roi_filtrada

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

    # Crear ventana para Segmentación
    cv.namedWindow('Segmentacion')

    # Trackbar para el umbral de área

    while True:
        # Cargar la imagen actual
        img_path = os.path.join(carpeta_imagenes, imagenes[indice_imagen])
        img = cv.imread(img_path)

        # Verifica si la imagen se cargó correctamente
        if img is None:
            print(f"Error: No se pudo cargar la imagen {img_path}.")
            break

        # Segmentar la imagen por tamaño
        mask_segmented, img_segmented = segmentar_por_tamaño(img, umbral_area=1000)

        # Mostrar la imagen segmentada
        cv.imshow('Segmentacion', img_segmented)

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
    carpeta_imagenes = 'backend/src/data/img-API/USD/Model_12'
    procesar_imagen(carpeta_imagenes)