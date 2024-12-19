from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
import pandas as pd
from sklearn.preprocessing import LabelEncoder
import tensorflow as tf
from keras import Sequential
from tensorflow.keras.layers import Dense, Dropout
import matplotlib.pyplot as plt
from tensorflow.keras.callbacks import TensorBoard
import datetime


df_usd = pd.read_csv("backend/src/data/banknote_net.csv")
# Seleccionar características (X) y etiquetas (y)
X = df_usd.iloc[:, 1:-2].values  # Todas las columnas excepto índices y etiquetas
y = df_usd['Denomination'].values  # Etiqueta objetivo

# Normalización de las características
scaler = MinMaxScaler()
X = scaler.fit_transform(X)

# Dividir el dataset en entrenamiento y prueba
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Codificar las etiquetas en valores numéricos
label_encoder = LabelEncoder()
y_train = label_encoder.fit_transform(y_train)
y_test = label_encoder.transform(y_test)

# Para decodificar después, puedes usar: label_encoder.inverse_transform()


# Crear el modelo
model = Sequential([
    Dense(256, activation='relu', input_shape=(X_train.shape[1],)),
    Dropout(0.2),  # Regularización para evitar overfitting
    Dense(256, activation='relu'),
    Dropout(0.2),
    Dense(len(label_encoder.classes_), activation='softmax')  # Salida con tantas neuronas como clases
])

# Compilar el modelo
model.compile(optimizer='adam',
                loss='sparse_categorical_crossentropy',
                metrics=['accuracy'])

# Mostrar la arquitectura del modelo
model.summary()

#GRAFICA
# Directorio donde se guardarán los logs
log_dir = 'logs/fit'

# Crear el callback de TensorBoard
tensorboard_callback = TensorBoard(log_dir=log_dir, histogram_freq=1)


# Entrenar el modelo
#resultado mas balanceado 40 epocas - accuracy: 0.9393 - loss: 0.2246
history = model.fit(X_train, y_train, epochs=40, batch_size=256, validation_split=0.2)

#GRAFICA
# Acceder a las métricas de precisión
accuracy = history.history['accuracy']  # Precision durante el entrenamiento
val_accuracy = history.history['val_accuracy']  # Precision durante la validación

# Graficar precisión
plt.plot(range(1, len(accuracy) + 1), accuracy, label='Precisión de entrenamiento')
plt.plot(range(1, len(val_accuracy) + 1), val_accuracy, label='Precisión de validación')
plt.title('Ajuste de precisión en cada época')
plt.xlabel('Épocas')
plt.ylabel('Precisión')
plt.legend()
plt.show()

# Graficar pérdida
loss = history.history['loss']
val_loss = history.history['val_loss']

plt.plot(range(1, len(loss) + 1), loss, label='Pérdida de entrenamiento')
plt.plot(range(1, len(val_loss) + 1), val_loss, label='Pérdida de validación')
plt.title('Ajuste de la pérdida en cada época')
plt.xlabel('Épocas')
plt.ylabel('Pérdida')
plt.legend()
plt.show()

# Evaluar en el conjunto de prueba
test_loss, test_acc = model.evaluate(X_test, y_test)
print(f"Precisión en prueba: {test_acc:.2f}")

model.save('backend/src/models/currency_recognition_model.keras')
