# My Python App

Este proyecto es una aplicación de Python que se ejecuta en un contenedor Docker. A continuación se detallan los archivos y su propósito:

## Estructura del Proyecto

```
my-python-app
├── src
│   ├── main.py          # Punto de entrada de la aplicación
│   └── __init__.py      # Indica que src es un paquete de Python
├── requirements.txt      # Lista de dependencias del proyecto
├── Dockerfile            # Instrucciones para construir la imagen de Docker
├── .dockerignore         # Archivos y directorios a ignorar en Docker
├── setup.py              # Configuración para empaquetar la aplicación
└── README.md             # Documentación del proyecto
```

## Instalación

Para instalar las dependencias del proyecto, ejecuta el siguiente comando:

```
pip install -r requirements.txt
```

## Ejecución

Para ejecutar la aplicación, utiliza el siguiente comando:

```
python src/main.py
```

## Docker

Para construir la imagen de Docker, asegúrate de estar en el directorio raíz del proyecto y ejecuta:

```
docker build -t my-python-app .
```

## Notas

- Asegúrate de tener Docker instalado y en funcionamiento.
- Puedes personalizar el `Dockerfile` y el archivo `.dockerignore` según tus necesidades.