import cv2 as cv
import os
import numpy as np

def callback(input):
    pass

def procesar_imagen():
    root = os.getcwd()
    imgPath = os.path.join(root, 'backend/src/data/img-API/VEF/Model_9/5b-vef_01-03-25_01_42_38_orign.jpg')
    img = cv.imread(imgPath)

    # Verifica si la imagen se cargó correctamente
    if img is None:
        print("Error: No se pudo cargar la imagen.")
        return

    # Crear ventanas para Canny y rectángulos detectados
    cv.namedWindow('Canny')
    cv.namedWindow('Detection')

    # Trackbar para el tamaño del kernel del filtro borroso
    cv.createTrackbar('blurKernel', 'Canny', 1, 30, callback)

    # Trackbars para los umbrales de Canny
    cv.createTrackbar('minThres', 'Canny', 0, 500, callback)
    cv.createTrackbar('maxThres', 'Canny', 0, 500, callback)

    # Trackbars para Shi-Tomasi Corner Detection
    cv.createTrackbar('qualityLevel', 'Detection', 0, 100, callback)
    cv.createTrackbar('minDistance', 'Detection', 0, 200, callback)

    while True:
        if cv.waitKey(1) == ord('q'):
            break

        # Obtener los valores de los trackbars
        minThres = cv.getTrackbarPos('minThres', 'Canny')
        maxThres = cv.getTrackbarPos('maxThres', 'Canny')
        blurKernel = cv.getTrackbarPos('blurKernel', 'Canny')

        qualityLevel = cv.getTrackbarPos('qualityLevel', 'Detection')
        minDistance = cv.getTrackbarPos('minDistance', 'Detection')

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

        # Detectar esquinas usando Shi-Tomasi Corner Detection
        corners = cv.goodFeaturesToTrack(cannyEdge, maxCorners=4, qualityLevel=qualityLevel/100+0.01, minDistance=minDistance)

        # Crear una copia de la imagen original para dibujar los rectángulos
        img_rectangulos = img.copy()

        if corners is not None:
            # Convertir las esquinas a coordenadas enteras
            corners = np.int64(corners)

            # Dibujar las esquinas detectadas
            for corner in corners:
                x, y = corner.ravel()
                cv.circle(img_rectangulos, (x, y), 5, (0, 255, 0), -1)  # Dibujar un círculo en cada esquina

            # Si se detectan exactamente 4 esquinas, dibujar el rectángulo
            if len(corners) == 4:
                # Ordenar las esquinas para formar un rectángulo
                corners = corners.reshape(4, 2)
                rect = cv.boundingRect(corners)
                x, y, w, h = rect

                # Dibujar el rectángulo en la imagen
                cv.rectangle(img_rectangulos, (x, y), (x + w, y + h), (0, 0, 255), 2)

        # Mostrar la imagen con los rectángulos detectados
        cv.imshow('Detection', img_rectangulos)

    cv.destroyAllWindows()

if __name__ == '__main__':
    procesar_imagen()