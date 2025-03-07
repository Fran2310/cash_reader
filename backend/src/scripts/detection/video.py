import cv2 as cv
import os
import numpy as np

def callback(input):
    pass

def procesar_imagen():
    root = os.getcwd()
    imgPath = os.path.join(root, 'backend/src/data/img-API/VEF/Model_9/5b-vef_02-03-25_030015_orign.jpg')
    img = cv.imread(imgPath)

    # Verifica si la imagen se cargó correctamente
    if img is None:
        print("Error: No se pudo cargar la imagen.")
        return

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
        if cv.waitKey(1) == ord('q'):
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

        # Intercambiar las coordenadas (y, x) -> (x, y)
        corner_coords = corner_coords[:, [1, 0]]

        # Crear una copia de la imagen original para dibujar el contorno
        img_contours = img.copy()

        # Si se detectaron suficientes puntos, calcular el convex hull
        if len(corner_coords) > 2:  # Se necesitan al menos 3 puntos para un convex hull
            # Calcular el convex hull
            hull = cv.convexHull(corner_coords)

            # Dibujar el convex hull en la imagen original
            cv.drawContours(img_contours, [hull], -1, (0, 255, 0), 2)  # Contorno en verde

        # Mostrar la imagen con el contorno detectado
        cv.imshow('Harris Corner Detection', img_contours)

    cv.destroyAllWindows()

if __name__ == '__main__':
    procesar_imagen()