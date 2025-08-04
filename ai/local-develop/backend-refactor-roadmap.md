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

`[UI] -> [Server Action] -> [Caso de Uso de App] -> [Adaptador de IA] -> [Flujo de Genkit] <--> [Herramientas]`

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
├───chat/
│   ├───domain/
│   ├───application/
│   └───infrastructure/
├───directory/
│   ├───domain/
│   ├───application/
│   └───infrastructure/
├───job-posting/ (Ya refactorizado)
│   └───...
└───platform/
    └───...
```

---

## **Fase 1: Refactorización del Dominio de Usuario y Autenticación (Prioridad Alta)**

**Objetivo:** Establecer una base sólida para toda la aplicación refactorizando la gestión de perfiles de usuario y la autenticación.

### **Paso 1.1: Definir el Dominio (`src/lib/user/domain`) (✓ Completado)**

*   **`user.entity.ts`**:
    *   Definir las interfaces `BusinessProfile` y `CandidateProfile`.
    *   Definir la entidad principal `User` que contiene los perfiles opcionales, el `role`, etc., como lo discutimos.
*   **`user.repository.ts`**:
    *   Definir el puerto `UserRepository` con los métodos CRUD:
        *   `create(user: User): Promise<User>`
        *   `findByUid(uid: string): Promise<User | null>`
        *   `update(uid: string, data: Partial<User>): Promise<User>`
        *   `findPublicProfileByUid(uid: string): Promise<Partial<User> | null>` (para perfiles públicos)
*   **`auth.repository.ts`**:
    *   Definir un puerto `AuthRepository` para abstraer las operaciones de autenticación:
        *   `signInWithGoogle(): Promise<{uid: string, isNewUser: boolean}>`
        *   `signInWithEmail(email: string, pass: string): Promise<string>`
        *   `signUpWithEmail(name: string, email: string, pass: string, role: UserRole): Promise<string>`
        *   `signOut(): Promise<void>`

### **Paso 1.2: Crear los Casos de Uso (`src/lib/user/application`)**

*   **`create-user-profile.use-case.ts`**: Orquesta la creación de un nuevo `User` en nuestra base de datos después de que Auth lo haya creado.
*   **`update-business-profile.use-case.ts`**: Maneja la lógica para actualizar los datos del perfil de negocio.
*   **`update-candidate-profile.use-case.ts`**: Maneja la lógica para actualizar el perfil del candidato, incluida la subida del CV.

### **Paso 1.3: Implementar la Infraestructura (`src/lib/user/infrastructure`)**

*   **`persistence/firestore-user.repository.ts`**:
    *   Implementa la interfaz `UserRepository` usando Firestore. Contendrá toda la lógica de `getDoc`, `setDoc`, `updateDoc`.
*   **`auth/firebase-auth.adapter.ts`**:
    *   Implementa la interfaz `AuthRepository`.
    *   Encapsula todas las llamadas al SDK de Firebase Authentication (`createUserWithEmailAndPassword`, `signInWithPopup`, etc.).
    *   Aquí es donde daremos **prioridad a la autenticación con Google**.
*   **`storage/firebase-storage.adapter.ts`**:
    *   Crear una función genérica `uploadFile` (si no existe ya en `job-posting`) para manejar la subida de CVs para el `CandidateProfile`.
*   **`nextjs/user.server-actions.ts`**:
    *   Nuevas Server Actions que la UI llamará (ej. `updateBusinessProfileAction`).
    *   Estas acciones instanciarán los `UseCase` y les inyectarán las implementaciones de la infraestructura (el `FirestoreUserRepository`).

### **Paso 1.4: Actualizar la UI y Eliminar Código Antiguo**

1.  **Actualizar Flujo de Registro (`src/components/auth/SignUpForm.tsx` y `LoginForm.tsx`)**:
    *   Modificar los formularios para que llamen a las nuevas `server actions` que usan el `AuthRepository` y el `UserRepository`.
2.  **Actualizar Formularios de Perfil**:
    *   `src/app/dashboard/advertiser/profile/page.tsx`
    *   `src/app/dashboard/candidate-profile/page.tsx` para que usen las nuevas `server actions`.
3.  **Actualizar Contexto de Auth (`src/context/AuthContext.tsx`)**:
    *   Modificar el `AuthContext` para que consuma los nuevos casos de uso (a través de server actions) en lugar de llamar directamente a los servicios antiguos.
4.  **Eliminación de Archivos Obsoletos**:
    *   **ELIMINAR:** `src/lib/user-actions.ts`
    *   **ELIMINAR:** `src/services/user.service.ts`

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
*   **`nextjs/chat.server-actions.ts`**: Nuevas Server Actions que la UI llamará, instanciando los `UseCase`.

### **Paso 2.4: Actualizar la UI y Eliminar Código Antiguo**

1.  **Actualizar `src/components/chat/ChatWidget.tsx`**: Modificar para que llame a las nuevas `chat.server-actions.ts`.
2.  **Actualizar Paneles de Conversaciones**: Modificar las páginas (`/dashboard/admin/conversations` y `/dashboard/advertiser/conversations`) para que usen las nuevas actions.
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
*   **`nextjs/directory.server-actions.ts`**: Server Actions para la UI.

### **Paso 3.4: Actualizar la UI y Eliminar Código Antiguo**

1.  Actualizar todas las páginas que gestionan o muestran el directorio.
2.  **ELIMINAR:** `src/lib/directory-actions.ts` y cualquier servicio relacionado obsoleto.

---
Este plan nos proporciona una guía clara y estructurada para ejecutar una refactorización exitosa, sentando las bases para una aplicación mucho más robusta, escalable y fácil de mantener.
