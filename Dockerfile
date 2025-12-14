# Usar una imagen base ligera de Python 3.11
FROM python:3.11-slim

# Establecer el directorioo de trabajo dentro del contenedor

WORKDIR /app

# Instalar dependencias del sistema solo si usas librerías que lo requieran (como Pillow)
# Puedes comentar esta línea si no usas procesamiento de imágenes
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

# Copiar el archivo de requisitos primero (mejora el caché de Docker)
COPY backend/requirements.txt .

# Instalar las dependencias de Python
RUN pip install --no-cache-dir --disable-pip-version-check -r requirements.txt

# Copiar todo el contenido de la carpeta backend/ a la raíz del contenedor (/app)
COPY backend/ .

# Exponer el puerto (informativo, Railway lo ignora pero es buena práctica)
EXPOSE 8000

# Ejecutar el script principal que ya maneja la variable PORT correctamente
CMD ["python", "main.py"]
