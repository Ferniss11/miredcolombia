# Hoja de Ruta: Refactorización del Flujo de Ofertas de Empleo (Job Post) a Arquitectura Hexagonal

## Objetivo

Refactorizar el flujo completo de creación, lectura, actualización y eliminación (CRUD) de ofertas de empleo (`job-post`) utilizando una arquitectura hexagonal (Ports and Adapters). Esto resolverá los problemas actuales de bundling en Next.js, mejorará la separación de preocupaciones, la testabilidad y la mantenibilidad, sentando las bases para futuras refactorizaciones en toda la aplicación.

## Principios de la Arquitectura Hexagonal

*   **Dominio (Core):** Contiene la lógica de negocio pura y las entidades (`JobPosting`). Es el "corazón" de la aplicación y no tiene dependencias de la infraestructura.
*   **Puertos (Interfaces):** Son las interfaces que el dominio expone para interactuar con el mundo exterior (ej. `JobPostingRepository` para persistencia, `JobPostingService` para casos de uso).
*   **Adaptadores (Implementaciones):** Son las implementaciones concretas de los puertos, que conectan el dominio con tecnologías específicas (ej. `FirestoreJobPostingRepository` implementa `JobPostingRepository`, Next.js API Routes actúan como adaptadores de presentación).

## Beneficios Clave para este Proyecto

*   **Desacoplamiento:** El código de negocio no dependerá directamente de Firebase, Next.js o cualquier otra tecnología. Esto permite cambiar fácilmente la base de datos o el framework sin afectar la lógica central.
*   **Testabilidad:** La lógica de negocio puede ser probada de forma aislada, sin necesidad de configurar una base de datos real o un servidor web.
*   **Mantenibilidad:** La estructura clara y la separación de responsabilidades facilitan la comprensión, modificación y extensión del código.
*   **Escalabilidad:** La modularidad inherente a la arquitectura hexagonal facilita la distribución y escalabilidad de los componentes.
*   **Preparación para el Futuro:** Establece un patrón robusto para refactorizar el resto de la aplicación.

## Estructura Propuesta para el Flujo `job-post`

La nueva estructura de carpetas se organizará de la siguiente manera, encapsulando el flujo de `job-posting` dentro de `src/lib/job-posting/`:

```
src/
├───lib/
│   └───job-posting/
│       ├───domain/
│       │   ├───job-posting.entity.ts       // Define la interfaz/clase JobPosting
│       │   └───job-posting.repository.ts   // Interfaz (puerto) para la persistencia
│       ├───application/
│       │   ├───create-job-posting.use-case.ts
│       │   ├───get-job-postings.use-case.ts
│       │   ├───delete-job-posting.use-case.ts
│       │   ├───update-job-posting.use-case.ts
│       │   └───job-posting.service.ts      // Orquesta los casos de uso, si es necesario
│       └───infrastructure/
│           ├───persistence/
│           │   └───firestore-job-posting.repository.ts // Implementa job-posting.repository.ts usando Firebase Admin
│           ├───storage/
│           │   └───firebase-storage.adapter.ts         // Adaptador para subir imágenes a Firebase Storage
│           ├───api/
│           │   └───job-posting.controller.ts           // Maneja las solicitudes HTTP (Next.js API Routes)
│           └───nextjs/
│               └───job-posting.server-actions.ts       // Server Actions para componentes de cliente
├───app/
│   └───dashboard/
│       └───jobs/
│           ├───page.tsx                            // Componente de cliente, interactúa con Server Actions
│           └───[id]/
│               └───edit/
│                   └───page.tsx
├───lib/
│   └───types.ts                                    // Tipos compartidos (JobPostingFormValues, etc.)
```

## Plan de Refactorización Paso a Paso

### Paso 1: Definir la Capa de Dominio (`src/lib/job-posting/domain`)

*   **`job-posting.entity.ts`**: Define la interfaz o clase `JobPosting` con sus propiedades y métodos de negocio (si los hay).
*   **`job-posting.repository.ts`**: Define una interfaz (`interface`) para las operaciones CRUD de `JobPosting` (ej. `save(job: JobPosting): Promise<JobPosting>`, `findById(id: string): Promise<JobPosting | null>`, `findAll(): Promise<JobPosting[]>`, `delete(id: string): Promise<void>`). Este es un **puerto**.

### Paso 2: Definir la Capa de Aplicación (`src/lib/job-posting/application`)

*   **Casos de Uso (`*.use-case.ts`):** Crea clases o funciones para cada operación de negocio. Por ejemplo:
    *   `CreateJobPostingUseCase`: Recibe los datos de la oferta, valida, y usa el `JobPostingRepository` para persistirla.
    *   `GetJobPostingsUseCase`: Usa el `JobPostingRepository` para obtener las ofertas.
    *   `DeleteJobPostingUseCase`: Usa el `JobPostingRepository` para eliminar una oferta.
    *   `UpdateJobPostingUseCase`: Actualiza una oferta existente.
*   Estos casos de uso recibirán el `JobPostingRepository` como dependencia (Inversión de Dependencias).

### Paso 3: Implementar la Capa de Infraestructura (`src/lib/job-posting/infrastructure`)

*   **Adaptador de Persistencia (`persistence/firestore-job-posting.repository.ts`):**
    *   Crea una clase que `implemente` la interfaz `JobPostingRepository` definida en el dominio.
    *   Dentro de esta clase, utiliza `firebase-admin` para interactuar con Firestore y realizar las operaciones de persistencia.
*   **Adaptador de Almacenamiento (`storage/firebase-storage.adapter.ts`):**
    *   Crea una función o clase para manejar la subida de imágenes a Firebase Storage, desacoplándola del servicio de ofertas.
*   **Adaptadores de Presentación (Integración con Next.js):**
    *   **API Routes (`api/job-posting.controller.ts` que se mapeará a `src/app/api/jobs/route.ts` y `src/app/api/jobs/[id]/route.ts`):**
        *   Estas rutas serán los puntos de entrada HTTP.
        *   Dentro de ellas, se instanciarán los casos de uso de la capa de aplicación y se les pasará el adaptador de persistencia (`FirestoreJobPostingRepository`).
        *   Manejarán la validación de entrada (usando Zod, por ejemplo) y la serialización de la salida.
    *   **Next.js Server Actions (`nextjs/job-posting.server-actions.ts`):**
        *   Crea funciones `use server` que actúen como una interfaz para los componentes de cliente.
        *   Estas funciones llamarán a los casos de uso de la capa de aplicación, asegurando que la lógica de negocio se ejecute en el servidor.

### Paso 4: Actualizar `src/app/dashboard/jobs/page.tsx`

*   Modifica `page.tsx` para que ya no importe directamente `src/services/job.service.ts`.
*   En su lugar, llamará a las nuevas Server Actions definidas en `src/lib/job-posting/infrastructure/nextjs/job-posting.server-actions.ts` para obtener, crear y eliminar ofertas.

### Paso 5: Limpieza y Eliminación de Código Antiguo

*   Una vez que el nuevo flujo esté funcionando, elimina `src/services/job.service.ts` y cualquier importación directa de `firebase-admin` en componentes de cliente.
*   Revisa y elimina cualquier archivo o lógica redundante (ej. `src/lib/job-actions.ts` si es reemplazado).

### Paso 6: Estrategia de Pruebas

*   **Unitarias:** Escribe pruebas unitarias para las entidades del dominio y los casos de uso de la capa de aplicación, mockeando la interfaz del repositorio. Esto garantizará que la lógica de negocio sea correcta.
*   **Integración:** Prueba los adaptadores de infraestructura (ej. `FirestoreJobPostingRepository`) para asegurar que interactúan correctamente con los servicios externos (Firestore).
*   **End-to-End:** Utiliza herramientas como Playwright o Cypress para probar el flujo completo desde la UI hasta la base de datos, pasando por las API Routes/Server Actions.

### Paso 7: Revisión de la Configuración de Webpack (`next.config.ts`)

*   Asegúrate de que `next.config.ts` siga externalizando correctamente `firebase-admin` y otras dependencias de Node.js para evitar que se incluyan en el bundle del cliente. Las modificaciones que hicimos previamente deberían ser suficientes, pero lo confirmaremos.

---

Este plan nos permitirá construir un flujo de `job-post` robusto, desacoplado y fácil de mantener, sirviendo como un excelente modelo para el resto de la aplicación.

¿Listo para comenzar con el Paso 1: Definir la Capa de Dominio?
