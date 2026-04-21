# Manual de usuario — AR Lookup

## 1. Qué es AR Lookup

**AR Lookup** es una aplicación web para:

- **Análisis de escenas en imagen**: sube o captura una foto y obtiene una “comprobación AR” con tarjetas flotantes (título, detalle y tono informativo) sobre la imagen.
- **Chat con asistente de IA**: conversación persistente orientada a operación industrial y realidad aumentada, con historial asociado a tu cuenta.

La interfaz está dividida en dos modos, seleccionables desde la cinta superior (ribbon).

---

## 2. Requisitos

| Elemento | Detalle |
|----------|---------|
| Navegador | Navegador moderno con JavaScript habilitado. |
| Cámara (opcional) | Solo si usas “Use camera”; el sitio puede pedir permiso de cámara. |
| Servidor | El **frontend** (Vite) suele ejecutarse en desarrollo; el **backend** debe estar en marcha para registro, inicio de sesión, análisis por IA y chat. El frontend reenvía las rutas `/api` al backend (por defecto `http://localhost:3312`). |
| Base de datos | PostgreSQL configurado según el proyecto (ver README del repositorio). |

Si solo abres el frontend sin backend, el inicio de sesión y las llamadas a `/api` fallarán.

---

## 3. Primera vez: cuenta y acceso

### 3.1 Pantalla de inicio

Al abrir la aplicación verás **AR Lookup** con una de dos opciones:

- **Sign in** (iniciar sesión): correo electrónico y contraseña.
- **Register** (registrarse): nombre, apellidos, nombre de usuario, correo y contraseña.

Puedes alternar entre ambas con los enlaces al pie del formulario (“Don’t have an account? Register” / “Already have an account? Sign in”).

### 3.2 Tras autenticarse

- Verás tu **nombre completo** en la esquina superior derecha de la cinta.
- La sesión se guarda en el almacenamiento de la pestaña del navegador (**sessionStorage**): si cierras la pestaña o el navegador, normalmente tendrás que volver a iniciar sesión.

---

## 4. Cinta de navegación (ribbon)

En la parte superior:

| Control | Función |
|---------|---------|
| **Image AR analysis** | Modo de trabajo con imagen y comprobación AR. |
| **AI chat** | Modo de conversación con el asistente. |
| **Sign out** | Cierra sesión en el servidor (si hay token) y borra la sesión local; vuelves a la pantalla de acceso. |

---

## 5. Modo “Image AR analysis”

### 5.1 Preparar una imagen

Tienes tres formas de tener una imagen en el lienzo central:

1. **Choose image** — selecciona un archivo de imagen de tu equipo o dispositivo.
2. **Use camera** — intenta abrir la cámara (vista previa en un cuadro de diálogo). Cuando la vista esté lista, pulsa **Capture photo**. Si el navegador no permite la cámara en vivo, puede recurrir a la captura nativa del dispositivo.
3. **Guided demos** (solo usuario `demo`) — ver sección 5.4.

Mientras no haya imagen, verás el mensaje “No image yet” y pistas para añadir foto o usar la cámara.

### 5.2 Ejecutar la comprobación AR

1. Asegúrate de que la imagen aparece en el lienzo.
2. Pulsa **Start AR check**.

**Comportamiento:**

- **Imagen propia (archivo o cámara)** — la aplicación envía la imagen al servidor (`/api/analyzer/scan`). El motor de IA analiza la escena y devuelve **exactamente cuatro** tarjetas de tipo “insight” con posiciones sugeridas sobre la imagen. Los textos del análisis automático se generan en **español**.
- **Demostración guiada** (usuario `demo` con ejemplo ya elegido) — no es necesario volver a subir: al pulsar **Start AR check** se activan directamente las superposiciones del ejemplo seleccionado.

Durante el análisis remoto verás el estado **Analyzing...** en el botón principal.

### 5.3 Superposiciones (overlays)

Cuando la comprobación está activa:

- Aparece un efecto visual de escaneo y **varias tarjetas** sobre la imagen (título, detalle y tono: informativo, éxito o advertencia).
- **Clear overlays** o **Dismiss all** ocultan las tarjetas y el escaneo sin borrar la imagen.

Si el análisis en servidor falla, verás un mensaje de error en la barra inferior pidiendo que lo intentes de nuevo.

### 5.4 Usuario `demo` y demos guiados

Si inicias sesión con un usuario cuyo **nombre de usuario** es exactamente **`demo`** (sin distinguir mayúsculas/minúsculas al comparar en la app), aparece la sección **Guided demos**:

- Carga escenas predefinidas desde `demo-examples.json` (imágenes de ejemplo en `public`).
- Al elegir una tarjeta de demo, se carga la imagen y sus “insights” asociados.
- Tras **Start AR check**, se muestran esas superposiciones sin nueva llamada de análisis.

Sirve para **formación o presentaciones** sin consumir análisis en servidor en cada clic (salvo que uses imagen propia).

---

## 6. Modo “AI chat”

### 6.1 Qué hace

- Muestra el **historial de chat** de tu usuario al entrar (si no hay mensajes, un saludo por defecto del asistente).
- Puedes escribir en el cuadro de texto y enviar con **Send** o con **Enter** (sin Mayús). **Mayús+Enter** permite salto de línea.
- Mientras carga el historial verás “Loading history...”; al enviar, “Thinking...”.

### 6.2 Contexto del asistente

El asistente está orientado a **operación industrial y escenas AR** (objetos, seguridad, mantenimiento, contexto operativo). Responde en el **mismo idioma** en que escribas.

Si en el sistema existe una **base de conocimiento** administrada, el backend puede inyectarla como contexto en las respuestas (tema y contenido por entradas).

### 6.3 Persistencia

Los mensajes se guardan en el servidor vinculados a tu cuenta. La próxima vez que entres al modo chat, se recuperará el historial.

> **Nota:** La interfaz actual no incluye botones para borrar el historial desde la pantalla; el API del backend sí puede permitir borrado de historial para integraciones futuras.

---

## 7. Cerrar sesión

Pulsa **Sign out** en la cinta. Se invalida la sesión en el servidor cuando es posible y se limpian los datos de autenticación locales.

---

## 8. Resolución de problemas

| Síntoma | Posible causa | Qué hacer |
|---------|----------------|-----------|
| No carga el login o errores al enviar formulario | Backend no arrancado o URL incorrecta | Comprueba que el backend esté en marcha y que el proxy del frontend apunte al puerto correcto. |
| “Could not analyze the image” | Fallo de red, servidor o IA | Reintenta; revisa que exista `GEMINI_API_KEY` en el servidor y que la base de datos esté accesible. |
| Cámara sin vista previa | Permisos o navegador | Permite cámara para el sitio; prueba otro navegador o usa **Choose image**. |
| Chat: “Could not load chat history” | Sin token, red o error del servidor | Vuelve a iniciar sesión; comprueba conexión y backend. |
| Demos guiados no aparecen | Usuario no es `demo` o falta `demo-examples.json` | Usa el usuario `demo` o revisa la carpeta `frontend/public` y la consola de red. |

---

## 9. Privacidad y datos (resumen)

- **Credenciales y token** se guardan en **sessionStorage** del navegador (ámbito de la pestaña).
- Las **imágenes** enviadas al análisis se procesan en el servidor; el sistema puede **cachear** resultados por huella digital de la imagen en base de datos para no repetir el mismo análisis.
- El **chat** queda registrado en base de datos asociado a tu usuario.

Para detalles técnicos de despliegue y variables de entorno, consulta el **README.md** del repositorio.

---

## 10. Glosario breve

| Término | Significado en esta app |
|---------|-------------------------|
| **AR check** | Activación de superposiciones tipo “etiquetas flotantes” sobre la imagen. |
| **Insight** | Tarjeta con título, texto de detalle y tono (info / éxito / advertencia). |
| **Ribbon** | Barra superior con marca, pestañas de modo y cierre de sesión. |

---

*Documento generado a partir del comportamiento del código del proyecto AR Lookup. Si la aplicación se actualiza, conviene revisar este manual frente a la versión desplegada.*
