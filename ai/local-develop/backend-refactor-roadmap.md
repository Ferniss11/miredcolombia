# Hoja de Ruta: Refactorización del Backend a Arquitectura Hexagonal

## 1. Objetivo General

Migrar las funcionalidades clave de la aplicación (`Chat/Agentes`, `Directorio/Negocios`, `Usuarios/Autenticación`) a una **arquitectura hexagonal (Puertos y Adaptadores)**. Este cambio es fundamental para:

*   **Aislar el Dominio:** Proteger nuestra lógica de negocio de los detalles de la infraestructura (Firebase, Genkit, Stripe, etc.).
*   **Mejorar la Testabilidad:** Probar los casos de uso y la lógica de negocio de forma aislada.
*   **Incrementar la Mantenibilidad:** Crear un código más limpio, predecible y fácil de modificar.
*   **Preparar para el Futuro:** Sentar las bases para extraer el backend a un servicio independiente y escalar nuestras capacidades de IA (RAG).

Utilizaremos la refactorización ya realizada en `job-posting` como nuestro modelo a seguir.

## 2. Principios y Patrones Arquitectónicos

### Arquitectura Hexagonal

*   **Núcleo (Dominio y Aplicación):** Contiene la lógica de negocio pura (`entities`, `use cases`). No conoce tecnologías externas.
*   **Puertos (Interfaces):** Contratos definidos en el núcleo que describen cómo se comunica con el exterior (ej. `ChatRepository`).
*   **Adaptadores (Infraestructura):** Implementaciones concretas que conectan los puertos con el mundo real (ej. `FirestoreChatRepository`, `GenkitAgentAdapter`).

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
├───chat/
│   ├───domain/
│   ├───application/
│   └───infrastructure/
├───directory/
│   ├───domain/
│   ├───application/
│   └───infrastructure/
├───user/
│   ├───domain/
│   ├───application/
│   └───infrastructure/
├───job-posting/ (Ya refactorizado)
│   └───...
└───platform/
    └───...
```

---

## **Fase 1: Refactorización del Flujo de Chat y Agentes de IA**

**Objetivo:** Migrar toda la lógica de conversaciones (global y de negocio) a la nueva arquitectura. Esto solucionará los problemas de estado actuales y creará un sistema robusto.

### **Paso 1.1: Definir el Dominio (`src/lib/chat/domain`)**

*   **`chat-message.entity.ts`**:
    *   Definir la interfaz `ChatMessage` con sus propiedades (`id`, `sessionId`, `role`, `text`, `timestamp`, `usage?`, `authorName?`).
*   **`chat-session.entity.ts`**:
    *   Definir la interfaz `ChatSession` (`id`, `userId?`, `businessId?`, `createdAt`, `totalCost`, `totalTokens`).
*   **`chat.repository.ts`**:
    *   Definir el puerto `ChatRepository` con los métodos:
        *   `createSession(data: Omit<ChatSession, 'id'>): Promise<ChatSession>`
        *   `findSessionById(id: string): Promise<ChatSession | null>`
        *   `addMessage(sessionId: string, message: Omit<ChatMessage, 'id' | 'sessionId'>): Promise<ChatMessage>`
        *   `getMessagesBySessionId(sessionId: string): Promise<ChatMessage[]>`
        *   `findSessionsByBusinessId(businessId: string): Promise<ChatSession[]>`
        *   `findAllSessions(): Promise<ChatSession[]>`

### **Paso 1.2: Crear los Casos de Uso (`src/lib/chat/application`)**

*   **`start-chat-session.use-case.ts`**:
    *   Recibe los datos del usuario (`userName`, `phone`, `businessId?`).
    *   Usa el `ChatRepository` para crear una nueva sesión.
    *   Crea un mensaje de bienvenida inicial y lo persiste usando el repositorio.
    *   Devuelve la nueva sesión y el mensaje de bienvenida.
*   **`post-message.use-case.ts`**:
    *   Recibe `sessionId`, `messageText` y el historial actual.
    *   **Punto Clave:** NO contiene lógica de IA. Su trabajo es orquestar.
    *   Persiste el mensaje del usuario usando el `ChatRepository`.
    *   Invoca al **Adaptador de IA** (`GenkitAgentAdapter`) para obtener la respuesta del modelo.
    *   Persiste la respuesta de la IA usando el `ChatRepository`.
    *   Devuelve la respuesta de la IA.
*   **`get-chat-history.use-case.ts`**:
    *   Recibe `sessionId` y devuelve los mensajes a través del `ChatRepository`.

### **Paso 1.3: Implementar la Infraestructura (`src/lib/chat/infrastructure`)**

*   **`persistence/firestore-chat.repository.ts`**:
    *   Implementa la interfaz `ChatRepository`.
    *   Contiene toda la lógica de Firestore para crear/leer/actualizar sesiones y mensajes.
*   **`ai/genkit-agent.adapter.ts`**:
    *   Implementa una interfaz `AgentAdapter` (que definiremos).
    *   Su método `getResponse` recibe el historial y el mensaje actual.
    *   **Es el único lugar que importa y llama a los flujos de Genkit** (`migrationChatFlow`, `businessChatFlow`).
    *   Adapta los datos del caso de uso al formato que el flujo de Genkit necesita.
*   **`nextjs/chat.server-actions.ts`**:
    *   Las nuevas Server Actions que la UI llamará.
    *   Instancian los `UseCase` y les inyectan las implementaciones de la infraestructura (el `FirestoreChatRepository` y el `GenkitAgentAdapter`).
    *   Ejemplo: `startChatSessionAction` llamará a `StartChatSessionUseCase`.

### **Paso 1.4: Actualizar la UI y Eliminar Código Antiguo**

1.  **Actualizar `src/components/chat/ChatWidget.tsx`**:
    *   Modificar el componente para que llame a las nuevas `chat.server-actions.ts`.
2.  **Actualizar Paneles de Admin/Anunciante**:
    *   Modificar las páginas de conversaciones (`/dashboard/admin/conversations` y `/dashboard/advertiser/conversations`) para que usen las nuevas server actions para obtener y enviar mensajes.
3.  **Eliminación de Archivos Obsoletos**:
    *   **ELIMINAR:** `src/lib/chat-actions.ts`
    *   **ELIMINAR:** `src/lib/business-chat-actions.ts`
    *   **ELIMINAR:** `src/services/chat.service.ts`
    *   Revisar y eliminar cualquier otro servicio o acción que haya quedado redundante.

---

## **Fase 2: Refactorización del Directorio y Negocios**

**Objetivo:** Aplicar la arquitectura hexagonal al manejo de perfiles de negocio.

### **Paso 2.1: Definir el Dominio (`src/lib/directory/domain`)**

*   **`business.entity.ts`**:
    *   Definir la interfaz `Business` (basada en la `PlaceDetails` actual) con sus propiedades (`id`, `displayName`, `category`, `ownerUid`, `verificationStatus`, etc.).
*   **`directory.repository.ts`**:
    *   Definir la interfaz `DirectoryRepository` con métodos:
        *   `save(business: Business): Promise<Business>`
        *   `findById(id: string): Promise<Business | null>`
        *   `findAll(onlyPublic: boolean): Promise<Business[]>`
        *   `delete(id: string): Promise<void>`
        *   `update(id: string, data: Partial<Business>): Promise<Business>`

### **Paso 2.2: Crear los Casos de Uso (`src/lib/directory/application`)**

*   **`add-business.use-case.ts`**: Orquesta la adición de un nuevo negocio.
*   **`link-business-to-user.use-case.ts`**: Maneja la lógica de vincular un negocio de Google a un perfil de anunciante.
*   **`approve-business.use-case.ts`**: Lógica para que un admin apruebe una solicitud de vinculación.

### **Paso 2.3: Implementar la Infraestructura (`src/lib/directory/infrastructure`)**

*   **`persistence/firestore-directory.repository.ts`**:
    *   Implementa `DirectoryRepository` usando Firestore.
*   **`search/google-places.adapter.ts`**:
    *   Un adaptador que encapsula la llamada a la herramienta de Genkit `googlePlacesSearch` o directamente a la API de Google Maps.
*   **`nextjs/directory.server-actions.ts`**:
    *   Server Actions para que la UI (panel de admin, perfil de anunciante) interactúe con los casos de uso.

### **Paso 2.4: Actualizar la UI y Eliminar Código Antiguo**

1.  **Actualizar Páginas del Directorio**:
    *   `src/app/dashboard/admin/directory/page.tsx`
    *   `src/app/dashboard/advertiser/profile/page.tsx`
    *   Páginas públicas del directorio (`/directory` y `/directory/[slug]`)
2.  **Eliminación de Archivos Obsoletos**:
    *   **ELIMINAR:** `src/lib/directory-actions.ts`
    *   Cualquier función de servicio relacionada que quede obsoleta.

---

## **Fase 3: Refactorización de Usuarios y Autenticación**

**Objetivo:** Centralizar la gestión de perfiles de usuario.

### **Paso 3.1: Definir el Dominio (`src/lib/user/domain`)**

*   **`user.entity.ts`**:
    *   Definir la interfaz `User` con todas sus propiedades (`uid`, `name`, `email`, `role`, `businessProfile?`, `candidateProfile?`).
*   **`user.repository.ts`**:
    *   Definir el puerto `UserRepository` con métodos:
        *   `create(user: User): Promise<User>`
        *   `findByUid(uid: string): Promise<User | null>`
        *   `update(uid: string, data: Partial<User>): Promise<User>`

### **Paso 3.2: Crear los Casos de Uso (`src/lib/user/application`)**

*   **`create-user-profile.use-case.ts`**
*   **`update-business-profile.use-case.ts`**
*   **`update-candidate-profile.use-case.ts`**

### **Paso 3.3: Implementar la Infraestructura (`src/lib/user/infrastructure`)**

*   **`persistence/firestore-user.repository.ts`**:
    *   Implementa `UserRepository`.
*   **`auth/firebase-auth.adapter.ts`**:
    *   Un adaptador que se comunica con Firebase Auth para operaciones como crear usuario con email, etc. Esto aísla el resto del sistema del SDK de cliente de Firebase.
*   **`nextjs/user.server-actions.ts`**:
    *   Nuevas Server Actions para actualizar perfiles.

### **Paso 3.4: Actualizar la UI y Eliminar Código Antiguo**

1.  **Actualizar Formularios de Perfil**:
    *   `src/app/dashboard/advertiser/profile/page.tsx`
    *   `src/app/dashboard/candidate-profile/page.tsx`
2.  **Actualizar Flujo de Registro**:
    *   `src/components/auth/SignUpForm.tsx` para usar los nuevos casos de uso.
3.  **Eliminación de Archivos Obsoletos**:
    *   **ELIMINAR:** `src/lib/user-actions.ts`
    *   **ELIMINAR:** `src/services/user.service.ts`

---
Este plan nos proporciona una guía clara y estructurada para ejecutar una refactorización exitosa, sentando las bases para una aplicación mucho más robusta, escalable y fácil de mantener.
