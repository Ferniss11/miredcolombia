# Hoja de Ruta: Refactorización del Backend a Arquitectura Hexagonal

## 1. Objetivo General

Migrar las funcionalidades clave de la aplicación (`Usuarios/Autenticación`, `Chat/Agentes`, `Directorio/Negocios`) a una **arquitectura hexagonal (Puertos y Adaptadores)**. Este cambio es fundamental para:

*   **Aislar el Dominio:** Proteger nuestra lógica de negocio de los detalles de la infraestructura (Firebase, Genkit, Stripe, etc.).
*   **Mejorar la Testabilidad:** Probar los casos de uso y la lógica de negocio de forma aislada.
*   **Incrementar la Mantenibilidad:** Crear un código más limpio, predecible y fácil de modificar.
*   **Preparar para el Futuro:** Sentar las bases para extraer el backend a un servicio independiente y escalar nuestras capacidades de IA (RAG).

Utilizaremos la refactorización ya realizada en `job-posting` como nuestro modelo a seguir.

## 2. Principios y Patrones Arquitectónicos

### Arquitectura Hexagonal

*   **Núcleo (Dominio y Aplicación):** Contiene la lógica de negocio pura (`entities`, `use cases`). No conoce tecnologías externas.
*   **Puertos (Interfaces):** Contratos definidos en el núcleo que describen cómo se comunica con el exterior (ej. `UserRepository`).
*   **Adaptadores (Infraestructura):** Implementaciones concretas que conectan los puertos con el mundo real (ej. `FirestoreUserRepository`, `GenkitAgentAdapter`).

### Patrón de Agente de IA (Tool-based Agent)

La interacción con la IA seguirá un flujo estricto para mantener la separación de responsabilidades:

`[UI] -> [API Route] -> [Controller] -> [Caso de Uso de App] -> [Adaptador de IA] -> [Flujo de Genkit] <--> [Herramientas]`

*   El **Caso de Uso** orquesta el proceso de negocio.
*   El **Adaptador de IA** (infraestructura) traduce las necesidades del negocio al lenguaje de la IA, siendo el único que conoce Genkit.
*   El **Flujo de Genkit** contiene el `prompt` que instruye al LLM y le da acceso a las `Tools` (otras piezas de infraestructura como la búsqueda en base de datos).

## 3. Estructura de Carpetas Propuesta

La estructura `src/lib/` se organizará por dominios de negocio:

```
src/lib/
├───user/
│   ├───domain/
│   ├───application/
│   └───infrastructure/
│       ├───auth/
│       ├───persistence/
│       └───api/
├───chat/
│   ├───domain/
│   ├───application/
│   └───infrastructure/
│       └───api/
├───directory/
│   ├───domain/
│   ├───application/
│   └───infrastructure/
│       └───api/
├───job-posting/ (Ya refactorizado)
│   └───...
└───platform/
    └───api/
```

---

## **Fase 0: Refactorización del Portal de Empleo (✓ Completada - Piloto)**

**Objetivo:** Servir como proyecto piloto para establecer el patrón de arquitectura hexagonal en la aplicación, refactorizando el flujo completo de ofertas de empleo.

### **Paso 0.1: Definir la Capa de Dominio (`src/lib/job-posting/domain`) (✓ Completado)**

*   **`job-posting.entity.ts`**: Definida la interfaz `JobPosting`. (✓)
*   **`job-posting.repository.ts`**: Definido el puerto `JobPostingRepository` para las operaciones CRUD. (✓)

### **Paso 0.2: Crear los Casos de Uso (`src/lib/job-posting/application`) (✓ Completado)**

*   **`create-job-posting.use-case.ts`**: Creado para manejar la lógica de creación. (✓)
*   **`get-job-postings.use-case.ts`**: Creado para obtener las ofertas. (✓)
*   **`update-job-posting.use-case.ts`**: Creado para manejar actualizaciones. (✓)
*   **`delete-job-posting.use-case.ts`**: Creado para la eliminación. (✓)

### **Paso 0.3: Implementar la Infraestructura (`src/lib/job-posting/infrastructure`) (✓ Completado)**

*   **`persistence/firestore-job-posting.repository.ts`**: Implementa `JobPostingRepository` con Firestore Admin SDK. (✓)
*   **`storage/firebase-storage.adapter.ts`**: Creado para manejar la subida de imágenes a Firebase Storage. (✓)
*   **`nextjs/job-posting.server-actions.ts`**: Implementadas las Server Actions como adaptadores de presentación para la UI, llamando a los casos de uso. (✓)

### **Paso 0.4: Actualizar la UI y Eliminar Código Antiguo (✓ Completado)**

*   **Actualizar `src/app/dashboard/jobs/page.tsx`**: El componente de cliente ahora interactúa con las nuevas Server Actions. (✓)
*   **Eliminación de Código Obsoleto**: El `src/services/job.service.ts` original y otras lógicas monolíticas fueron eliminadas. (✓)

---

## **Fase 1: Refactorización del Dominio de Usuario y Autenticación (✓ Completada)**

**Objetivo:** Establecer una base sólida para toda la aplicación refactorizando la gestión de perfiles de usuario y la autenticación.

### **Paso 1.1: Definir el Dominio (`src/lib/user/domain`) (✓ Completado)**

*   **`user.entity.ts`**: Definir las interfaces `BusinessProfile`, `CandidateProfile` y la entidad principal `User` con el campo `status`. (✓)
*   **`user.repository.ts`**: Definir el puerto `UserRepository` con los métodos CRUD y `softDelete`. (✓)
*   **`auth.repository.ts`**: Definir el puerto `AuthRepository` para abstraer las operaciones de autenticación. (✓)

### **Paso 1.2: Crear los Casos de Uso (`src/lib/user/application`) (✓ Completado)**

*   **`create-user-profile.use-case.ts`**: Orquesta la creación de un nuevo `User`, asignando `status: 'active'`. (✓)
*   **`update-user-profile.use-case.ts`**: Maneja la lógica para actualizar datos básicos (nombre, etc.). (✓)
*   **`update-business-profile.use-case.ts`**: Maneja la lógica para actualizar los datos del perfil de negocio. (✓)
*   **`update-candidate-profile.use-case.ts`**: Maneja la lógica para actualizar el perfil del candidato. (✓)
*   **`get-user-profile.use-case.ts`**: Obtiene un perfil de usuario. (✓)
*   **`get-all-users.use-case.ts`**: Obtiene todos los perfiles de usuario. (✓)
*   **`soft-delete-user.use-case.ts`**: Implementa la lógica de borrado suave. (✓)

### **Paso 1.3: Implementar la Infraestructura (`src/lib/user/infrastructure`) (✓ Completado)**

*   **`persistence/firestore-user.repository.ts`**: Implementa `UserRepository` usando Firestore Admin SDK. (✓)
*   **`auth/firebase-auth.adapter.ts`**: Implementa `AuthRepository` usando el SDK de cliente de Firebase Auth. (✓)
*   **`storage/firebase-storage.adapter.ts`**: Crear una función genérica `uploadFile` para manejar la subida de archivos (ej. CVs). (✓)

### **Paso 1.4: Implementar la Capa de Presentación (API REST) y Actualizar la UI (✓ Completado)**

*   **Objetivo:** Exponer los casos de uso a través de una API REST segura y estandarizada, y conectar la UI a estos nuevos endpoints.

*   **Paso 1.4.1: Crear Utilidades de Respuesta y Controladores Base (✓ Completado)**
    *   **Crear `src/lib/platform/api/api-handler.ts`**:
        *   Una función `apiHandler` que envuelva la lógica de los API Route. Manejará la captura de errores, el parsing del body, y la serialización de la respuesta. (✓)
    *   **Crear `src/lib/platform/api/api-response.ts`**:
        *   Funciones de ayuda estandarizadas para las respuestas HTTP (`ApiResponse.success`, `ApiResponse.error`, `ApiResponse.notFound`, etc.). (✓)
    *   **Crear `src/lib/platform/api/base.controller.ts`**:
        *   Definir una interfaz `BaseController` para estandarizar los métodos que todos los controladores tendrán. (✓)

*   **Paso 1.4.2: Implementar el Controlador de Usuario (✓ Completado)**
    *   **Crear `src/lib/user/infrastructure/api/user.controller.ts`**:
        *   Crear una clase `UserController` que implemente la `BaseController`. (✓)
        *   Instanciará los Casos de Uso del usuario (ej. `CreateUserProfileUseCase`) y les inyectará las dependencias (`FirestoreUserRepository`). (✓)
        *   Tendrá métodos públicos como `createUser`, `getUser`, `updateBusinessProfile`, etc., que llamarán a los casos de uso. (✓)

*   **Paso 1.4.3: Crear los API Routes (✓ Completado)**
    *   **Crear `src/app/api/users/route.ts`**:
        *   Implementar el método `POST` para el registro y `GET` para obtener todos los usuarios. Llamará al `apiHandler` y a los métodos correspondientes del `userController`. (✓)
    *   **Crear `src/app/api/users/[uid]/route.ts`**:
        *   Implementar los métodos `GET`, `PUT` y `DELETE` para un usuario específico. (✓)
    *   **Crear `src/app/api/users/[uid]/business-profile/route.ts`**:
        *   Implementar el método `PUT` para actualizar el perfil de negocio. (✓)

*   **Paso 1.4.4: Actualizar la Interfaz de Usuario (UI) (✓ Completado)**
    *   **Modificar `src/components/auth/SignUpForm.tsx` y `LoginForm.tsx`**:
        *   Cambiar la lógica para que, en lugar de llamar a las funciones de `signInWithEmail` directamente, hagan una llamada `fetch` al nuevo endpoint `/api/auth/login` o `/api/users`. (✓)
    *   **Modificar `src/context/AuthContext.tsx`**:
        *   Actualizar la función `refreshUserProfile` para que haga un `fetch` a `/api/users/[uid]` para obtener los datos del perfil. (✓)
    *   **Modificar Formularios de Perfil (`.../advertiser/profile/page.tsx`, etc.)**:
        *   Actualizar para que llamen a los endpoints `PUT` de la API para guardar los cambios. (✓)

*   **Paso 1.4.5: Eliminar Código Antiguo (✓ Completado)**
    *   **ELIMINAR:** `src/lib/user-actions.ts` (reemplazado por los nuevos API endpoints). (✓)
    *   **ELIMINAR:** `src/services/user.service.ts` (lógica movida al `FirestoreUserRepository` y a los `UseCases`). (✓)
    *   **ELIMINAR:** `src/lib/firebase/auth.ts` (lógica movida al `FirebaseAuthAdapter` y a los `UseCases/Controllers` de autenticación). (✓)

### **Paso 1.5: Configuración de Seguridad de Roles (Custom Claims) (✓ Completado)**

*   **Objetivo:** Implementar un sistema de roles robusto y seguro utilizando Firebase Custom Claims.
*   **Tareas:**
    *   **Extender el `CreateUserProfileUseCase`:** Después de crear el documento de usuario en Firestore, este caso de uso también debe llamar al Admin SDK de Firebase Auth para establecer el `customClaim` de rol en el objeto de autenticación del usuario (`admin.auth().setCustomUserClaims(uid, { role: newUser.role })`). (✓)
    *   **Crear un `SetUserRoleUseCase`:** Crear un nuevo caso de uso para que un administrador pueda cambiar el rol de otro usuario. Este caso de uso recibirá un `uid` y un `newRole`. (✓)
    *   **Crear endpoint `POST /api/users/{uid}/role`:** Crear una nueva ruta y método en el `UserController` para exponer el `SetUserRoleUseCase`. Este endpoint debe estar protegido y ser accesible **solo por usuarios con rol 'SAdmin'**. (✓)
    *   **Sincronizar Roles de Usuarios Antiguos:** Se implementó una lógica en `AuthContext` para detectar usuarios sin `claim` de rol al iniciar sesión y sincronizarlo desde Firestore de forma segura y única. (✓)

---

## **Fase 2: Refactorización del Flujo de Chat y Agentes de IA (✓ Completada)**

**Objetivo:** Migrar toda la lógica de conversaciones (global y de negocio) a la nueva arquitectura. Esto solucionará los problemas de estado actuales y creará un sistema robusto.

### **Paso 2.1: Definir el Dominio (`src/lib/chat/domain`) (✓ Completado)**

*   **`chat-message.entity.ts`**: Definir la interfaz `ChatMessage` (`id`, `sessionId`, `role`, `text`, `timestamp`, `usage?`, `authorName?`). (✓)
*   **`chat-session.entity.ts`**: Definir la interfaz `ChatSession` (`id`, `userId?`, `businessId?`, `createdAt`, `totalCost`, `totalTokens`). (✓)
*   **`chat.repository.ts`**: Definir el puerto `ChatRepository` con métodos para crear/leer sesiones y mensajes. (✓)

### **Paso 2.2: Crear los Casos de Uso (`src/lib/chat/application`) (✓ Completado)**

*   **`start-chat-session.use-case.ts`**: Usa el `ChatRepository` para crear una sesión y un mensaje de bienvenida. (✓)
*   **`post-message.use-case.ts`**: Orquesta el flujo: persiste mensaje de usuario, invoca al adaptador de IA, persiste respuesta de IA. (✓)
*   **`get-chat-history.use-case.ts`**: Obtiene el historial a través del `ChatRepository`. (✓)
*   **`get-all-chat-sessions.use-case.ts`**: Obtiene todas las sesiones de chat para el panel de administración. (✓)

### **Paso 2.3: Implementar la Infraestructura (`src/lib/chat/infrastructure`) (✓ Completado)**

*   **`persistence/firestore-chat.repository.ts`**: Implementa `ChatRepository` usando Firestore. (✓)
*   **`ai/genkit-agent.adapter.ts`**:
    *   Implementa una interfaz `AgentAdapter`.
    *   **Es el único lugar que importa y llama a los flujos de Genkit**. Adapta los datos del caso de uso al formato que el flujo de Genkit necesita. (✓)
*   **`api/chat.controller.ts`**: Crear un `ChatController` que implemente la `BaseController` para manejar las peticiones HTTP del chat. (✓)
*   **`api/routes.ts`**: Crear los API Routes correspondientes (`POST /api/chat/sessions`, `POST /api/chat/sessions/[id]/messages`) que utilizarán el `ChatController` y el `apiHandler`. (✓)

### **Paso 2.4: Actualizar la UI y Eliminar Código Antiguo (✓ Completado)**

*   **Objetivo:** Conectar todos los componentes de frontend a los nuevos endpoints de la API de chat y luego eliminar las antiguas `Server Actions`.
*   **Pasos:**
    *   **Actualizar `ChatWidget.tsx`**: Modificar el widget de chat para que llame a `fetch` a los endpoints `/api/chat/sessions` (para iniciar y reanudar) y `/api/chat/sessions/[id]/messages` (para enviar mensajes). (✓)
    *   **Actualizar Paneles de Conversaciones**: Modificar las páginas (`/dashboard/admin/conversations` y `/dashboard/advertiser/conversations`) para que usen los nuevos endpoints de la API. (✓)
    *   **Actualizar Paneles de Configuración de Agentes**: Modificar las páginas (`/dashboard/admin/agent` y `/dashboard/advertiser/agent`) para usar endpoints de API en lugar de `server actions`. (✓)
    *   **Eliminación de Archivos Obsoletos**:
        *   ELIMINAR: `src/lib/chat-actions.ts` (✓)
        *   ELIMINAR: `src/lib/business-chat-actions.ts` (✓)
        *   ELIMINAR: `src/services/chat.service.ts` (✓)
        *   ELIMINAR: `src/lib/agent-actions.ts` (✓)
        *   ELIMINAR: `src/services/agent.service.ts` (✓)

### **Paso 2.5: Crear Flujo de Verificación de Usuario y Perfilado desde Chat (Pausado)**

*   **Objetivo:** Hacer el chat más robusto y seguro, convirtiendo a los usuarios anónimos en usuarios registrados de la plataforma.
*   **Estado:** En pausa. Se retomará después de completar la Fase 4 del directorio de negocios.

---

## **Fase 3: Refactorización del Directorio y Negocios (✓ Completada)**

**Objetivo:** Aplicar la arquitectura hexagonal al manejo de perfiles de negocio.

### **Paso 3.1: Definir el Dominio (`src/lib/directory/domain`) (✓ Completado)**

*   **`business.entity.ts`**: Definir la interfaz `Business` (basada en la `PlaceDetails` actual y enriquecida con datos de la API de Google). (✓)
*   **`directory.repository.ts`**: Definir la interfaz `DirectoryRepository` con métodos para guardar, encontrar, eliminar y actualizar negocios. (✓)

### **Paso 3.2: Crear los Casos de Uso (`src/lib/directory/application`) (✓ Completado)**

*   **Objetivo:** Encapsular toda la lógica de negocio del directorio en clases o funciones aisladas y reutilizables.
*   **Tareas:**
    *   Crear `get-business-details.use-case.ts`: Orquesta la obtención de detalles desde la base de datos y la caché/API externa. (✓)
    *   Crear `add-business.use-case.ts`: Lógica para añadir un nuevo negocio (llamado por un admin). (✓)
    *   Crear `link-business-to-user.use-case.ts`: Lógica para el proceso de reclamación de un negocio por un anunciante. (✓)
    *   Crear `approve-business-verification.use-case.ts`: Lógica para que un admin apruebe o rechace una reclamación. (✓)
    *   Crear `delete-business.use-case.ts`: Lógica para eliminar un negocio del directorio. (✓)

### **Paso 3.3: Implementar la Infraestructura (`src/lib/directory/infrastructure`) (✓ Completado)**

*   **Objetivo:** Crear los "enchufes" que conectan la lógica de negocio con el mundo real (base de datos, APIs externas, etc.).
*   **Tareas:**
    *   **`persistence/firestore-directory.repository.ts`**: Implementa `DirectoryRepository` usando Firestore Admin SDK. (✓)
    *   **`search/google-places.adapter.ts`**: Encapsula las llamadas a la API de Google Places para obtener datos enriquecidos. (✓)
    *   **`cache/firestore-cache.adapter.ts`**: Implementa una estrategia de caché en Firestore para reducir las llamadas a la API de Google. (✓)
    *   **`api/directory.controller.ts`**: Crear un `DirectoryController` para manejar las peticiones HTTP del directorio. (✓)
    *   **`api/routes.ts`**: Crear los API Routes correspondientes que utilizarán el `DirectoryController` y el `apiHandler`. (✓)

### **Paso 3.4: Actualizar la UI y Eliminar Código Antiguo (✓ Completado)**

*   **Objetivo:** Conectar toda la interfaz de usuario que interactúa con el directorio a la nueva API y eliminar la lógica antigua.
*   **Tareas:**
    1.  Actualizar `/dashboard/admin/directory/page.tsx` para usar los nuevos endpoints de la API. (✓)
    2.  Actualizar `/dashboard/advertiser/profile/page.tsx` para el proceso de vinculación. (✓)
    3.  Actualizar `/directory/[slug]/page.tsx` y `/directory/page.tsx` para usar la nueva acción `getPublicBusinessDetailsAction`. (✓)
    4.  **ELIMINAR:** `src/lib/directory-actions.ts` una vez que todas las dependencias se hayan migrado. (✓)

---

## **Fase 4: Refactorización del Dominio del Blog y Contenido (✓ Completada)**

**Objetivo:** Migrar toda la lógica del blog y la generación de contenido a la arquitectura hexagonal, desacoplando la lógica de negocio de Firebase y los flujos de IA.

### **Paso 4.1: Definir el Dominio (`src/lib/blog/domain`) (✓ Completado)**

*   **`blog-post.entity.ts`**: Definir la interfaz `BlogPost` con todas sus propiedades (título, contenido, estado, etc.). (✓)
*   **`blog.repository.ts`**: Definir el puerto `BlogPostRepository` con los métodos CRUD (`create`, `findById`, `findAll`, `update`, `delete`). (✓)

### **Paso 4.2: Crear los Casos de Uso (`src/lib/blog/application`) (✓ Completado)**

*   **`create-blog-post.use-case.ts`**: Orquesta la creación, incluyendo la lógica para generar un `slug` a partir del título. (✓)
*   **`get-blog-post.use-case.ts`**: Obtiene una publicación por ID o slug. (✓)
*   **`get-all-blog-posts.use-case.ts`**: Obtiene todas las publicaciones, con posible filtrado por estado. (✓)
*   **`update-blog-post.use-case.ts`**: Maneja la actualización de una publicación. (✓)
*   **`delete-blog-post.use-case.ts`**: Maneja la eliminación de una publicación. (✓)

### **Paso 4.3: Implementar la Infraestructura (`src/lib/blog/infrastructure`) (✓ Completado)**

*   **`persistence/firestore-blog.repository.ts`**: Implementa `BlogPostRepository` usando Firestore Admin SDK. (✓)
*   **`api/blog.controller.ts`**: Crear un `BlogController` para manejar las peticiones HTTP (crear, editar, publicar). (✓)
*   **`api/routes.ts`**: Crear los API Routes (`/api/blog`, `/api/blog/[id]`) que usarán el `BlogController`. (✓)
*   **Actualizar `Server Actions`**: Modificar `src/lib/blog-actions.ts` para que, en lugar de contener lógica propia, llamen a los nuevos endpoints de la API del blog, pasando las cookies de sesión para la autenticación. (✓)

### **Paso 4.4: Actualizar la UI y Eliminar Código Antiguo (✓ Completado)**

*   **Modificar `AdminContentSuitePage`**: Asegurarse de que llame a la nueva acción/endpoint para guardar el artículo generado. (✓)
*   **Modificar `AdminBlogManagementPage`**: Actualizar para que liste, edite y elimine publicaciones a través del nuevo sistema. (✓)
*   **ELIMINAR:** `src/services/blog.service.ts` (✓)
*   **ELIMINAR:** `src/app/api/posts/route.ts` (reemplazado por la nueva API del blog). (✓)

---

## **Fase 5: Evolución del Portal de Empleo y Servicios**

**Objetivo:** Convertir el portal de empleo en un ecosistema laboral completo, añadiendo perfiles de candidato, un sistema de aplicación interno y un portal de servicios para autónomos.

### **Paso 5.1: Perfiles de Candidato Profesionales**

*   **Dominio (`user.entity.ts`):** Extender `UserProfile` con un objeto `candidateProfile` que incluya: `professionalTitle`, `summary`, `skills: string[]`, `resumeUrl`, `experience: object[]`, `education: object[]`.
*   **UI (`/dashboard/candidate-profile`):** Crear una nueva página en el dashboard del usuario para que pueda crear y editar su perfil profesional completo, incluyendo la subida de su CV en PDF.
*   **Infraestructura (`api/users/[uid]/candidate-profile`):** Crear un nuevo endpoint `PUT` para manejar la actualización de estos datos y la subida del CV a Firebase Storage.

### **Paso 5.2: Sistema de Aplicación Interno**

*   **Dominio:** Crear una nueva entidad `JobApplication` (`id`, `jobId`, `candidateId`, `advertiserId`, `applicationDate`, `status`, `profileSnapshot`). Crear su repositorio y casos de uso.
*   **Infraestructura:** Crear los endpoints `/api/jobs/[id]/apply` (POST) para que los candidatos apliquen y `/api/jobs/[id]/applicants` (GET) para que los anunciantes vean a los candidatos.
*   **UI (Pública):** En `/jobs/[id]`, cambiar el botón "Aplicar" para que inicie este flujo si el usuario está logueado.
*   **UI (Dashboard Anunciante):** Crear la página `/dashboard/jobs/[id]/applicants` para que el anunciante vea el listado de candidatos, pueda revisar sus perfiles y cambiar el estado de la aplicación.

### **Paso 5.3: Portal "Ofrezco mis Servicios"**

*   **Dominio:** Crear una nueva entidad `ServiceListing` (`id`, `userId`, `title`, `description`, `category`, `city`, etc.). Crear su repositorio y casos de uso.
*   **Infraestructura:** Crear los endpoints `/api/services` para el CRUD de los anuncios de servicios.
*   **UI (Pública):** Crear la página `/services` que muestre los anuncios en un formato de tarjetas con filtros y buscador.
*   **UI (Dashboard):** Permitir a cualquier usuario (`User` o `Advertiser`) crear y gestionar sus anuncios de servicios desde una nueva sección en su panel.

### **Paso 5.4: Ofertas de Empleo para Invitados ("Guest")**

*   **Concepto:** Permitir que usuarios no registrados publiquen una oferta de empleo.
*   **Flujo:**
    1.  Un formulario público permite al invitado rellenar los datos de la oferta.
    2.  Al enviar, se crea una cuenta de usuario temporal o se le asigna un rol `Guest`.
    3.  La oferta de empleo se guarda con un estado `pending_payment` o `pending_review`.
    4.  Se podría enviar un enlace mágico al email del invitado para que pueda gestionar/pagar su publicación.
    5.  Una vez revisada o pagada, la oferta pasa a estado `ACTIVE`.
*   **Reto:** Gestión de la autenticación y autorización para estos usuarios temporales.

---

## **Fase 6: Mejoras de Interfaz, Contenido y SEO**

**Objetivo:** Refinar la experiencia de usuario en todo el sitio, mejorar el posicionamiento en buscadores y actualizar el contenido visual y textual para ser más dinámico y atractivo.

### **Paso 6.1: Actualización de Textos y CTA (Call to Action)**

*   **Sección de Empleo:** Cambiar el título principal a "Oportunidades de Empleo y Trabajo". Quitar "oportunidades" del subtítulo. Añadir un CTA claro para que los candidatos suban su CV.
*   **Header Público:** Renombrar los enlaces del menú de navegación. `Directorio` -> `Negocios`, `Empleo` -> `Empleo`, etc.

### **Paso 6.2: Dinamismo Visual**

*   **Fondos de Sección:** Aplicar degradados sutiles o imágenes de fondo de baja opacidad en las secciones del Home para romper la monotonía de los colores sólidos y crear un ambiente más profesional y dinámico.

### **Paso 6.3: Optimización SEO del Video**

*   **Sección "Quiénes Somos":** Modificar el componente para que, en lugar de abrir un modal, el video de Jennifer se inserte y se pueda reproducir directamente en la página. Esto permite que los bots de Google lo indexen como contenido multimedia, mejorando el SEO.

### **Paso 6.4: Interactividad en la Sección "Paso a Paso"**

*   **Componente `StepsSection`:** Convertir cada "globo" de paso en un botón interactivo. Al hacer clic, se abrirá un modal (`Dialog`) que contendrá información mucho más detallada sobre esa etapa del proceso migratorio, incluyendo listas de verificación, consejos y enlaces (CTAs) a servicios relevantes.

### **Paso 6.5: Actualización de Contenido en "Servicios"**

*   **Componente `ServicesSection`:** Localizar la tarjeta de servicio "Búsqueda de Vivienda" y reemplazar su contenido (icono, título, descripción, etc.) por el nuevo servicio: "Homologación de licencias de conducción".

---

Este plan nos proporciona una guía clara y estructurada para ejecutar una refactorización exitosa, sentando las bases para una aplicación mucho más robusta, escalable y fácil de mantener.
