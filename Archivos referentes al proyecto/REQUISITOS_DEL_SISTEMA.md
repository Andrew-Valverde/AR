# Requisitos del sistema — AR Lookup

Este documento resume **qué necesita una persona o un equipo** para trabajar el proyecto en su computadora (desarrollo local) y **qué se suele exigir** para llevar una aplicación parecida a producción. Está pensado para un informe o entrega universitaria; no sustituye la documentación técnica detallada del código.

---

## 1. Desarrollo local

### 1.1 Equipo y sistema operativo

- Computadora con recursos razonables para desarrollo web (por ejemplo **8 GB de RAM o más** si se usa Docker para la base de datos).
- **Windows, macOS o Linux**; las instrucciones del repositorio usan terminal y comandos tipo Unix (en Windows suele usarse **PowerShell**, **Git Bash** o **WSL**).

### 1.2 Software obligatorio o muy recomendado

| Herramienta | Para qué sirve en este proyecto |
|-------------|----------------------------------|
| **Git** | Clonar el repositorio y versionar cambios. |
| **Node.js** (versión **LTS**, por ejemplo 20.x) | Ejecutar el frontend (Vite + React) y el backend (Express). Incluye **npm**. |
| **Editor de código** (por ejemplo Visual Studio Code) | Editar archivos y depurar con comodidad. |

### 1.3 Base de datos en local

El backend usa **PostgreSQL** mediante **Prisma**. Tienes dos caminos habituales:

1. **Docker Desktop** (o Docker Engine) + **Docker Compose**  
   - En la raíz del proyecto: `docker compose up -d`  
   - Levanta PostgreSQL en el puerto **5432** con la base `arlab` (según `docker-compose.yml`).

2. **PostgreSQL instalado directamente** en la máquina  
   - Debe escuchar en **localhost:5432** (o ajustas la URL en `.env`).

### 1.4 Variables de entorno (backend)

En la carpeta `backend` debe existir un archivo **`.env`** (puedes partir de **`.env.example`**). Como mínimo:

- **`DATABASE_URL`**: cadena de conexión a PostgreSQL (debe coincidir con tu base local).
- **`GEMINI_API_KEY`**: clave de la API de Google Gemini (necesaria para las funciones de IA del backend).
- **`JWT_KEY`**: secreto para firmar tokens de sesión; en local puede ser una cadena larga inventada, pero **en producción debe ser fuerte y privada**.

Sin estos valores, el backend no puede comportarse igual que en un entorno completo.

### 1.5 Puertos que conviene tener libres

| Servicio | Puerto por defecto |
|----------|--------------------|
| Frontend (Vite) | **5173** (típico de Vite; puede variar si está ocupado). |
| Backend (API) | **3312** (configurable con `PORT` en el entorno). |
| PostgreSQL | **5432** |

El frontend está configurado para enviar peticiones bajo `/api` al backend en `http://localhost:3312` (ver `frontend/vite.config.ts`).

### 1.6 Orden sugerido para arrancar en local

1. Clonar el repositorio e instalar dependencias: `npm install` en `frontend/` y en `backend/`.
2. Levantar PostgreSQL (Docker Compose o instalación local).
3. Crear o copiar `backend/.env` y completar variables.
4. En `backend/`: `npx prisma db push`, `npx prisma generate`, luego `npm run dev`.
5. En `frontend/`: `npm run dev` y abrir la URL que indique la consola (suele ser `http://localhost:5173`).

---

## 2. Puesta en producción (visión general)

“Producción” significa que **usuarios reales** acceden a la aplicación por Internet, con **servidores estables**, **copias de seguridad** y **secretos bien protegidos**. Los requisitos exactos dependen del proveedor (AWS, Azure, Railway, Render, etc.), pero en la práctica casi siempre se necesita lo siguiente.

### 2.1 Cuenta y repositorio

- **Cuenta en GitHub** (u otro servicio Git) con el código subido.
- Permisos para configurar **secretos** del repositorio (por ejemplo claves de AWS o de la base de datos), sin subirlos al historial público.

### 2.2 Integración continua (CI)

En este repositorio hay un ejemplo de flujo en **GitHub Actions** (borrador educativo) que **compila el frontend** y **simula** pasos de despliegue a AWS, sin ejecutar subidas reales. Para un pipeline real harían falta, entre otras cosas:

- Definición del flujo (archivo YAML en `.github/workflows/`).
- **Secretos** en GitHub: credenciales de nube, tokens de despliegue, etc.
- En muchos casos, **autenticación segura** hacia la nube (por ejemplo roles OIDC en lugar de claves de acceso de larga duración, cuando el proveedor lo permite).

### 2.3 Infraestructura típica para una app full stack

| Componente | Qué implica |
|------------|-------------|
| **Frontend estático** | Compilar (`npm run build` en `frontend/`) y servir los archivos desde un **almacenamiento** (por ejemplo bucket S3 + CDN) o desde el mismo servidor del backend. |
| **Backend (Node)** | Máquina o contenedor que ejecute `npm run start` (o equivalente), con **variable `PORT`** acorde al hosting y HTTPS delante (proxy o balanceador). |
| **Base de datos** | Instancia administrada de **PostgreSQL** (RDS, Supabase, Neon, etc.), no la base de Docker de la laptop. |
| **Dominio y HTTPS** | Certificado TLS (Let’s Encrypt, ACM en AWS, etc.). |
| **Variables de entorno en el servidor** | Mismas ideas que en local (`DATABASE_URL`, `GEMINI_API_KEY`, `JWT_KEY`, `PORT`), pero con valores de **producción** y rotación si hay filtración. |

### 2.4 Requisitos “blandos” pero importantes

- **Documentación** breve de cómo desplegar y revertir cambios.
- **Copias de seguridad** de la base de datos y plan de recuperación.
- **Monitoreo básico** (registros de errores, alertas) para saber si el servicio cae.

---

## 3. Resumen

- **Local:** Git, Node.js LTS, npm, PostgreSQL (Docker recomendado), archivo `backend/.env` completo, puertos libres para Vite, API y base de datos.  
- **Producción:** hosting para frontend, backend y PostgreSQL; secretos fuera del código; HTTPS; y, si se usa CI/CD, configuración del flujo más credenciales seguras en el proveedor de Git o de nube.
