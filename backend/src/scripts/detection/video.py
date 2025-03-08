import cv2 as cv
import os
import numpy as np

def callback(input):
    pass

def procesar_imagen(carpeta_imagenes):
    # Obtener la lista de imágenes en la carpeta
    imagenes = [img for img in os.listdir(carpeta_imagenes) if img.endswith(('orign.jpg', 'orign.jpeg'))]
    if not imagenes:
        print("Error: No se encontraron imágenes en la carpeta.")
        return

    # Índice de la imagen actual
    indice_imagen = 0

    # Crear ventanas para Canny y Harris Corner Detection
    cv.namedWindow('Canny')
    cv.namedWindow('Harris Corner Detection')

    # Trackbar para el tamaño del kernel del filtro borroso
    cv.createTrackbar('blurKernel', 'Canny', 1, 30, callback)

    # Trackbars para los umbrales de Canny
    cv.createTrackbar('minThres', 'Canny', 0, 500, callback)
    cv.createTrackbar('maxThres', 'Canny', 0, 500, callback)

    # Trackbars para los parámetros de Harris Corner Detection
    cv.createTrackbar('blockSize', 'Harris Corner Detection', 2, 10, callback)  # blockSize (2-10)
    cv.createTrackbar('ksize', 'Harris Corner Detection', 3, 15, callback)      # ksize (3-15, debe ser impar)
    cv.createTrackbar('harrisThres', 'Harris Corner Detection', 1, 100, callback)  # Umbral (1-100)

    while True:
        # Cargar la imagen actual
        img_path = os.path.join(carpeta_imagenes, imagenes[indice_imagen])
        img = cv.imread(img_path)

        # Verifica si la imagen se cargó correctamente
        if img is None:
            print(f"Error: No se pudo cargar la imagen {img_path}.")
            break

        # Obtener los valores de los trackbars para Canny
        minThres = cv.getTrackbarPos('minThres', 'Canny')
        maxThres = cv.getTrackbarPos('maxThres', 'Canny')
        blurKernel = cv.getTrackbarPos('blurKernel', 'Canny')

        # Asegurarse de que el tamaño del kernel sea impar y mayor que 1
        if blurKernel < 1:
            blurKernel = 1
        if blurKernel % 2 == 0:
            blurKernel += 1

        # Aplicar el filtro borroso
        blurredImg = cv.GaussianBlur(img, (blurKernel, blurKernel), 0)

        # Aplicar el filtro de Canny a la imagen borrosa
        cannyEdge = cv.Canny(blurredImg, minThres, maxThres)

        # Mostrar la imagen de Canny en su ventana
        cv.imshow('Canny', cannyEdge)

        # Obtener los valores de los trackbars para Harris Corner Detection
        blockSize = cv.getTrackbarPos('blockSize', 'Harris Corner Detection')
        ksize = cv.getTrackbarPos('ksize', 'Harris Corner Detection')
        harrisThres = cv.getTrackbarPos('harrisThres', 'Harris Corner Detection')

        # Asegurarse de que ksize sea impar y mayor que 1
        if ksize < 3:
            ksize = 3
        if ksize % 2 == 0:
            ksize += 1

        # Convertir la imagen de Canny a formato float32 para Harris Corner Detection
        cannyFloat32 = np.float32(cannyEdge)

        # Aplicar Harris Corner Detection a la imagen de Canny
        dst = cv.cornerHarris(cannyFloat32, blockSize, ksize, 0.04)

        # Dilatar el resultado para resaltar las esquinas
        dst = cv.dilate(dst, None)

        # Umbral para identificar las esquinas
        threshold = harrisThres / 100 * dst.max()  # Normalizar el umbral

        # Obtener las coordenadas de los puntos detectados por Harris
        corner_coords = np.column_stack(np.where(dst > threshold))

        # Invertir las coordenadas (fila, columna) a (x, y) para OpenCV
        corner_coords = corner_coords[:, ::-1]

        # Filtrar los puntos que están demasiado lejos
        if len(corner_coords) > 4:
            # Calcular el rectángulo mínimo que engloba todos los puntos
            rect = cv.minAreaRect(corner_coords)
            box = cv.boxPoints(rect)
            box = np.int64(box)

            # Crear una copia de la imagen original para dibujar el rectángulo
            img_rect = img.copy()

            # Dibujar el rectángulo en la imagen original
            cv.drawContours(img_rect, [box], 0, (0, 255, 0), 2)  # Rectángulo en verde

            # Mostrar la imagen con el rectángulo detectado
            cv.imshow('Harris Corner Detection', img_rect)

        # Mostrar el nombre de la imagen actual
        cv.setWindowTitle('Harris Corner Detection', f'Imagen {indice_imagen + 1}/{len(imagenes)}: {imagenes[indice_imagen]}')

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