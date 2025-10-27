# PokeBola con Docker - Sistema de Gestión de Pokémon Favoritos

## Descripción General

Aplicación web completamente dockerizada que permite a los usuarios autenticarse, buscar Pokémon mediante la PokeAPI y gestionar favoritos personalizados. Implementada con tecnologías vanilla sin frameworks, utilizando tres contenedores Docker independientes Jam stack y CI/CD con GitHub Actions.

## Arquitectura del Sistema

### Contenedor Frontend
Servidor web Nginx que sirve archivos estáticos HTML, CSS y JavaScript vanilla. Sin frameworks ni librerías adicionales.

### Contenedor Backend
Servidor HTTP con Node.js puro usando únicamente módulos nativos (http, fs, url, pg). Sin Express ni otras dependencias externas.

### Contenedor Base de Datos
Instancia PostgreSQL para almacenar Pokémon favoritos del usuario logeado, inicializada automáticamente con el script SQL y la tabla favorite.

## Estructura del Proyecto
```
proyecto-pokedex/
│
├── frontend/
│   └── public/
│       ├── css/
│       ├── images/
│       ├── js/
│       ├── index.html
│       └── pokemon.html
│
├── backend/
│   └── src/
│       └── server.js
│
├── db/
│   └── init.sql
│
├── .github/
│   └── workflows/
│       └── pokeBola.yml
│
├── Dockerfile (frontend)
├── Dockerfile (backend)
├── Dockerfile (db)
└── docker-compose.yml
```

## Funcionalidades Principales

### Sistema de Autenticación

**Página de Login (index.html)**
- Credenciales predefinidas en el código JavaScript
- Validación en el frontend con JavaScript vanilla
- Almacenamiento en localStorage para mantener sesión
- Redirección automática a pokemon.html tras login exitoso

### Exploración de Pokémon

**Interfaz Principal (pokemon.html)**
- Barra de búsqueda con JavaScript vanilla
- Consultas asíncronas a PokeAPI usando Fetch API nativo
- Visualización en tarjetas con manipulación del DOM
- Muestra información completa: imagen, tipo, habilidades y estadísticas

### Sistema de Favoritos

- Botón en cada tarjeta de Pokémon para marcar favoritos
- Verifica credenciales del localStorage antes de guardar
- Peticiones al backend vanilla para almacenar en PostgreSQL
- Asocia cada favorito con el usuario autenticado

### Cierre de Sesión

- Botón que elimina credenciales del localStorage
- Redirección automática a la página de login

## Flujo de Trabajo

El usuario ingresa credenciales en index.html → Se validan con JavaScript vanilla → Se guardan en localStorage → Accede a pokemon.html → Busca Pokémon consultando PokeAPI → Marca favoritos que se guardan en PostgreSQL vía backend vanilla → Cierra sesión eliminando datos del localStorage.

## Base de Datos PostgreSQL

### Esquema en init.sql

**Tabla favoritos**: Relaciona usuarios con sus Pokémon favoritos (user_id, pokemon_id, pokemon_name)

La base de datos se inicializa automáticamente al levantar el contenedor ejecutando el script init.sql.

## Docker y Containerización

### Dockerfiles

**Frontend**: Imagen Nginx copiando archivos estáticos
**Backend**: Imagen Node.js sin dependencias npm externas
**Database**: Imagen PostgreSQL oficial con script de inicialización

### Docker Compose

Orquesta los tres servicios, define red interna para comunicación entre contenedores, configura puertos expuestos, establece volúmenes para persistencia de datos y define variables de entorno.

## CI/CD con GitHub Actions

### Workflow (docker-publish.yml)

Automatiza el proceso de construcción y publicación de imágenes Docker:

**Trigger**: Se ejecuta en push a rama main 
**Jobs**: 
- Checkout del código fuente
- Login a Docker Hub con credenciales desde GitHub Secrets
- Build de las tres imágenes Docker (frontend, backend, db)
- Push automático de imágenes a Docker Hub con tags
- Versionado automático de imágenes

**Ventajas**:
- Deployment automático al hacer push
- Imágenes siempre actualizadas en Docker Hub
- Trazabilidad de versiones
- Proceso reproducible y consistente

## Tecnologías Utilizadas

**Frontend**: HTML5, CSS3, JavaScript Vanilla, LocalStorage API, Fetch API
**Backend**: Node.js con módulos nativos sin frameworks
**Base de Datos**: PostgreSQL con SQL estándar
**Infraestructura**: Docker, Docker Compose, GitHub Actions
**Integración**: PokeAPI para datos de Pokémon

## Requisitos Previos

- Docker Engine 
- Docker Compose
- Cuenta en Docker Hub (para CI/CD)
- GitHub repository con Actions habilitado
- Conexión a internet para PokeAPI

## Instalación y Ejecución

### Ejecución Local

1. Clonar el repositorio
2. Ejecutar `docker-compose build` desde el directorio raíz
3. Iniciar con `docker-compose up -d`
4. Acceder a `http://localhost:[puerto-frontend]`

### Deployment Automático

1. Configurar GitHub Secrets con credenciales de Docker Hub
2. Hacer push a la rama main
3. GitHub Actions construye y sube imágenes automáticamente
4. Pull de imágenes desde Docker Hub en servidor de producción
5. Ejecutar `docker-compose up` con imágenes publicadas

## Comandos Útiles

**Ver contenedores**: `docker-compose ps`
**Ver logs**: `docker-compose logs [servicio]`
**Detener**: `docker-compose down`
**Reconstruir**: `docker-compose up --build`
**Limpiar todo**: `docker-compose down -v`

## Configuración de GitHub Actions

### Secrets Necesarios

En el repositorio de GitHub, configurar en Settings > Secrets:
- `DOCKERHUB_USERNAME`: Usuario de Docker Hub
- `DOCKERHUB_TOKEN`: Token de acceso de Docker Hub

El workflow se ejecutará automáticamente en cada push a main, construyendo las tres imágenes y subiéndolas a Docker Hub con tags actualizados.

## Consideraciones de Seguridad

**Advertencia**: Este es un proyecto con fines educativos, para produccion optar por integrar un sistema de verificacion y credenciales robustos, ademas de la reubicacion de los secrets que se encuentran integrados en el codigo, de las conexiones realizadas al servidor y la seguridad para el manejo de tokens para el usuario

## Licencia

Proyecto de código abierto para fines educativos. Datos de Pokémon usados mediante PokeAPI pública.

**Stack Tecnológico**: Jam Stack - (HTML, CSS, Vanilla JavaScript) + Node + PostgreSQL + Docker + GitHub Actions