# Hoja de Ruta: Expansión del Portal de Empleo y Servicios

## Objetivo General

Evolucionar el portal de empleo hacia un ecosistema laboral completo, permitiendo a los usuarios crear perfiles de candidato, aplicar a ofertas internamente, recibir alertas personalizadas y ofrecer sus propios servicios como autónomos. Esto aumentará la interacción, el valor para todos los roles de usuario y creará nuevas oportunidades de monetización.

---

## Fase 1: Perfiles de Candidato Profesionales

**Objetivo:** Permitir a los usuarios con rol `User` crear y gestionar un perfil profesional completo que sirva como su CV digital dentro de la plataforma.

*   **Modelado de Datos:**
    *   Extender la interfaz `UserProfile` en `src/lib/types.ts` para incluir un nuevo objeto `candidateProfile`.
    *   Este objeto contendrá campos como: `professionalTitle` (ej. "Ingeniero de Software"), `summary` (un párrafo de presentación), `skills` (un array de strings), `experience` (un array de objetos con `jobTitle`, `company`, `dates`, `description`), `education` (similar a experiencia) y `resumeUrl` para el CV en PDF.

*   **Interfaz de Usuario (Dashboard):**
    *   Crear una nueva página en el dashboard de usuario (`/dashboard/candidate-profile`).
    *   Esta página mostrará el perfil del candidato y contendrá un formulario para editar toda la información.

*   **Lógica de Backend:**
    *   Implementar una `server action` (`updateCandidateProfileAction`) para guardar los datos del formulario en el documento del usuario en Firestore.
    *   Crear la lógica para la subida del CV (archivo PDF) a Firebase Storage, guardando la URL pública en el campo `resumeUrl`.

*   **Resultado Clave:** Los usuarios pueden crear un perfil profesional completo, listo para ser utilizado en el proceso de aplicación.

---

## Fase 2: Sistema de Aplicación Interno

**Objetivo:** Reemplazar los enlaces de aplicación externos por un sistema de aplicación nativo, permitiendo a los usuarios aplicar a las ofertas con un solo clic usando su nuevo perfil.

*   **Modelado de Datos:**
    *   Crear una nueva colección raíz en Firestore llamada `jobApplications`.
    *   Cada documento representará una aplicación y contendrá: `jobPostingId`, `candidateId` (el UID del usuario), `advertiserId` (el UID del dueño de la oferta), `applicationDate`, `status` ('Recibida', 'En revisión', 'Rechazada', 'Contactado') y una copia del `candidateProfile` en el momento de la aplicación.

*   **Interfaz de Usuario (Pública):**
    *   En la página de detalles de la oferta (`/jobs/[id]`), reemplazar el botón "Aplicar" por uno que, si el usuario está logueado y tiene perfil, inicie el proceso de aplicación interno. Si no, se le invitará a crear su perfil.

*   **Interfaz de Usuario (Dashboard Anunciante):**
    *   Crear una nueva página en el dashboard del anunciante (`/dashboard/jobs/[id]/applicants`).
    *   Aquí, el anunciante podrá ver un listado de todos los candidatos que han aplicado a su oferta.
    *   Podrá hacer clic en un candidato para ver la instantánea de su perfil y cambiar el estado de la aplicación.

*   **Resultado Clave:** Un flujo de aplicación sin fricciones para los candidatos y una herramienta de gestión de candidatos (ATS) básica para los anunciantes.

---

## Fase 3: Portal de "Ofrezco mis Servicios"

**Objetivo:** Crear un espacio para que los usuarios (especialmente los recién llegados) puedan ofrecer sus servicios como autónomos o freelancers, generando oportunidades de trabajo rápido y fomentando la economía circular dentro de la comunidad.

*   **Modelado de Datos:**
    *   Crear una nueva colección en Firestore: `serviceListings`.
    *   Cada documento tendrá: `title` (ej. "Servicio de limpieza por horas"), `description`, `category` ("Limpieza", "Cuidado de niños", "Clases particulares", "Desarrollo web", etc.), `userId`, `contactInfo`, `city`, y un campo `isFeatured` para futura monetización.

*   **Interfaz de Usuario (Pública):**
    *   Crear una nueva ruta pública `/services` que mostrará todas las ofertas de servicios en un formato de tarjetas, similar al directorio de negocios.
    *   Implementar una barra de búsqueda y filtros por categoría y ciudad.

*   **Interfaz de Usuario (Dashboard):**
    *   Permitir a los usuarios `User` y `Advertiser` crear y gestionar sus propias ofertas de servicios desde su dashboard (`/dashboard/my-services`).

*   **Resultado Clave:** Un nuevo "tablón de anuncios" que genera valor inmediato para la comunidad y abre una nueva vía de negocio.

---

## Fase 4: Alertas de Empleo Personalizadas

**Objetivo:** Aumentar el engagement y la retención permitiendo que los candidatos reciban notificaciones por correo electrónico sobre nuevas ofertas de empleo que coincidan con sus intereses.

*   **Modelado de Datos:**
    *   Añadir una subcolección `jobAlerts` al documento de cada usuario en Firestore.
    *   Cada documento en esta subcolección representará una alerta guardada, con campos como `keywords`, `location`, `jobType`, y `lastChecked` (timestamp).

*   **Interfaz de Usuario (Pública):**
    *   En la página de listado de empleos (`/jobs`), añadir un botón "Crear Alerta de Empleo" que abra un modal.
    *   En el modal, el usuario (si está logueado) podrá definir los criterios para su alerta (palabras clave, ubicación, etc.) y guardarla.

*   **Lógica de Backend (Cloud Function):**
    *   Implementar una Cloud Function de Firebase que se ejecute periódicamente (ej. cada día).
    *   La función escaneará todas las nuevas ofertas de empleo publicadas desde la última ejecución.
    *   Luego, recorrerá las alertas de empleo de los usuarios y, si hay coincidencias, enviará un correo electrónico al usuario con un resumen de las nuevas ofertas relevantes.
    *   Se necesitará integrar un servicio de envío de correos como SendGrid, Mailgun o el propio sistema de Firebase.

*   **Resultado Clave:** Un sistema proactivo que mantiene a los usuarios conectados con la plataforma y les presenta oportunidades relevantes sin esfuerzo.