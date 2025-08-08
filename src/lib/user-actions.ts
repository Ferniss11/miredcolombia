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

## **Fase 1: Refactorización del Dominio de Usuario y Autenticación (Prioridad Alta)**

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

### **Paso 1.4: Implementar la Capa de Presentación (API REST) y Actualizar la UI**

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

*   **Paso 1.4.5: Eliminar Código Antiguo**
    *   **ELIMINAR:** `src/lib/user-actions.ts` (reemplazado por los nuevos API endpoints).
    *   **ELIMINAR:** `src/services/user.service.ts` (lógica movida al `FirestoreUserRepository` y a los `UseCases`).
    *   **ELIMINAR:** `src/lib/firebase/auth.ts` (lógica movida al `FirebaseAuthAdapter` y a los `UseCases/Controllers` de autenticación).

### **Paso 1.5: Configuración de Seguridad de Roles (Custom Claims)**

*   **Objetivo:** Implementar un sistema de roles robusto y seguro utilizando Firebase Custom Claims.
*   **Tareas:**
    *   **Extender el `CreateUserProfileUseCase`:** Después de crear el documento de usuario en Firestore, este caso de uso también debe llamar al Admin SDK de Firebase Auth para establecer el `customClaim` de rol en el objeto de autenticación del usuario (`admin.auth().setCustomUserClaims(uid, { role: newUser.role })`).
    *   **Crear un `SetUserRoleUseCase`:** Crear un nuevo caso de uso para que un administrador pueda cambiar el rol de otro usuario. Este caso de uso recibirá un `uid` y un `newRole`.
    *   **Crear endpoint `POST /api/users/{uid}/role`:** Crear una nueva ruta y método en el `UserController` para exponer el `SetUserRoleUseCase`. Este endpoint debe estar protegido y ser accesible **solo por usuarios con rol 'Admin'**.

---

## **Fase 2: Refactorización del Flujo de Chat y Agentes de IA**

**Objetivo:** Migrar toda la lógica de conversaciones (global y de negocio) a la nueva arquitectura. Esto solucionará los problemas de estado actuales y creará un sistema robusto.

### **Paso 2.1: Definir el Dominio (`src/lib/chat/domain`)**

*   **`chat-message.entity.ts`**: Definir la interfaz `ChatMessage` (`id`, `sessionId`, `role`, `text`, `timestamp`, `usage?`, `authorName?`).
*   **`chat-session.entity.ts`**: Definir la interfaz `ChatSession` (`id`, `userId?`, `businessId?`, `createdAt`, `totalCost`, `totalTokens`).
*   **`chat.repository.ts`**: Definir el puerto `ChatRepository` con métodos para crear/leer sesiones y mensajes.

### **Paso 2.2: Crear los Casos de Uso (`src/lib/chat/application`)**

*   **`start-chat-session.use-case.ts`**: Usa el `ChatRepository` para crear una sesión y un mensaje de bienvenida.
*   **`post-message.use-case.ts`**: Orquesta el flujo: persiste mensaje de usuario, invoca al adaptador de IA, persiste respuesta de IA.
*   **`get-chat-history.use-case.ts`**: Obtiene el historial a través del `ChatRepository`.

### **Paso 2.3: Implementar la Infraestructura (`src/lib/chat/infrastructure`)**

*   **`persistence/firestore-chat.repository.ts`**: Implementa `ChatRepository` usando Firestore.
*   **`ai/genkit-agent.adapter.ts`**:
    *   Implementa una interfaz `AgentAdapter`.
    *   **Es el único lugar que importa y llama a los flujos de Genkit**. Adapta los datos del caso de uso al formato que el flujo de Genkit necesita.
*   **`api/chat.controller.ts`**: Crear un `ChatController` que implemente la `BaseController` para manejar las peticiones HTTP del chat.
*   **`api/routes.ts`**: Crear los API Routes correspondientes (`POST /api/chat/sessions`, `POST /api/chat/sessions/[id]/messages`) que utilizarán el `ChatController` y el `apiHandler`.

### **Paso 2.4: Actualizar la UI y Eliminar Código Antiguo**

1.  **Actualizar `src/components/chat/ChatWidget.tsx`**: Modificar para que llame a los nuevos endpoints de la API REST del chat mediante `fetch`.
2.  **Actualizar Paneles de Conversaciones**: Modificar las páginas (`/dashboard/admin/conversations` y `/dashboard/advertiser/conversations`) para que usen los nuevos endpoints.
3.  **Eliminación de Archivos Obsoletos**:
    *   **ELIMINAR:** `src/lib/chat-actions.ts`
    *   **ELIMINAR:** `src/lib/business-chat-actions.ts`
    *   **ELIMINAR:** `src/services/chat.service.ts`

---

## **Fase 3: Refactorización del Directorio y Negocios**

**Objetivo:** Aplicar la arquitectura hexagonal al manejo de perfiles de negocio.

### **Paso 3.1: Definir el Dominio (`src/lib/directory/domain`)**

*   **`business.entity.ts`**: Definir la interfaz `Business` (basada en la `PlaceDetails` actual).
*   **`directory.repository.ts`**: Definir la interfaz `DirectoryRepository` con métodos para guardar, encontrar, eliminar y actualizar negocios.

### **Paso 3.2: Crear los Casos de Uso (`src/lib/directory/application`)**

*   `add-business.use-case.ts`, `link-business-to-user.use-case.ts`, `approve-business.use-case.ts`, etc.

### **Paso 3.3: Implementar la Infraestructura (`src/lib/directory/infrastructure`)**

*   **`persistence/firestore-directory.repository.ts`**: Implementa `DirectoryRepository`.
*   **`search/google-places.adapter.ts`**: Encapsula la llamada a la herramienta `googlePlacesSearch` o la API de Google Maps.
*   **`api/directory.controller.ts`**: Crear un `DirectoryController` para manejar las peticiones HTTP del directorio.
*   **`api/routes.ts`**: Crear los API Routes correspondientes que utilizarán el `DirectoryController` y el `apiHandler`.

### **Paso 3.4: Actualizar la UI y Eliminar Código Antiguo**

1.  Actualizar todas las páginas que gestionan o muestran el directorio para que usen los nuevos endpoints de la API REST.
2.  **ELIMINAR:** `src/lib/directory-actions.ts` y cualquier servicio relacionado obsoleto.

---
Este plan nos proporciona una guía clara y estructurada para ejecutar una refactorización exitosa, sentando las bases para una aplicación mucho más robusta, escalable y fácil de mantener.