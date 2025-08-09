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

## **Fase 0: Refactorización del Portal de Empleo (✓ Completada)**

*   **Objetivo:** Servir como proyecto piloto para establecer el patrón de arquitectura hexagonal en la aplicación, refactorizando el flujo completo de ofertas de empleo.
*   **Pasos:**
    *   Definir la Capa de Dominio (`src/lib/job-posting/domain`) (✓ Completado)
    *   Crear los Casos de Uso (`src/lib/job-posting/application`) (✓ Completado)
    *   Implementar la Infraestructura (`src/lib/job-posting/infrastructure`) (✓ Completado)
    *   Actualizar la UI y Eliminar Código Antiguo (✓ Completado)

---

## **Fase 1: Refactorización del Dominio de Usuario y Autenticación (✓ Completada)**

*   **Objetivo:** Establecer una base sólida para toda la aplicación refactorizando la gestión de perfiles de usuario y la autenticación.
*   **Pasos:**
    *   Definir el Dominio (`src/lib/user/domain`) (✓ Completado)
    *   Crear los Casos de Uso (`src/lib/user/application`) (✓ Completado)
    *   Implementar la Infraestructura (`src/lib/user/infrastructure`) (✓ Completado)
    *   Implementar la Capa de Presentación (API REST) y Actualizar la UI (✓ Completado)
    *   Configuración de Seguridad de Roles (Custom Claims) (✓ Completado)

---

## **Fase 2: Refactorización del Flujo de Chat y Agentes de IA (✓ Completada)**

*   **Objetivo:** Migrar toda la lógica de conversaciones (global y de negocio) a la nueva arquitectura. Esto solucionará los problemas de estado actuales y creará un sistema robusto.
*   **Pasos:**
    *   Definir el Dominio (`src/lib/chat/domain`) (✓ Completado)
    *   Crear los Casos de Uso (`src/lib/chat/application`) (✓ Completado)
    *   Implementar la Infraestructura (`src/lib/chat/infrastructure`) (✓ Completado)
    *   Actualizar la UI y Eliminar Código Antiguo (✓ Completado)
    *   Crear Flujo de Verificación de Usuario y Perfilado desde Chat (Pausado)

---

## **Fase 3: Refactorización del Directorio y Negocios (✓ Completada)**

*   **Objetivo:** Aplicar la arquitectura hexagonal al manejo de perfiles de negocio.
*   **Pasos:**
    *   Definir el Dominio (`src/lib/directory/domain`) (✓ Completado)
    *   Crear los Casos de Uso (`src/lib/directory/application`) (✓ Completado)
    *   Implementar la Infraestructura (`src/lib/directory/infrastructure`) (✓ Completado)
    *   Actualizar la UI y Eliminar Código Antiguo (✓ Completado)

---

## **Fase 4: Refactorización del Dominio del Blog y Contenido (✓ Completada)**

*   **Objetivo:** Migrar toda la lógica del blog y la generación de contenido a la arquitectura hexagonal.
*   **Pasos:**
    *   Definir el Dominio (`src/lib/blog/domain`) (✓ Completado)
    *   Crear los Casos de Uso (`src/lib/blog/application`) (✓ Completado)
    *   Implementar la Infraestructura (`src/lib/blog/infrastructure`) (✓ Completado)
    *   Actualizar la UI y Eliminar Código Antiguo (✓ Completado)

---

## **Fase 5: Evolución del Portal de Empleo y Servicios (✓ Completada)**

*   **Objetivo:** Convertir el portal de empleo en un ecosistema laboral completo.
*   **Pasos:**
    *   Perfiles de Candidato Profesionales (✓ Completado)
    *   Sistema de Aplicación Interno (✓ Completado)
    *   Portal "Ofrezco mis Servicios" (✓ Completado)
    *   Ofertas de Empleo para Invitados ("Guest") (✓ Completado)

---

## **Fase 6: Mejoras de Interfaz, Contenido y SEO (✓ Completada)**

*   **Objetivo:** Refinar la experiencia de usuario en todo el sitio y mejorar el SEO.
*   **Pasos:**
    *   Actualización de Textos y CTA (Call to Action) (✓ Completado)
    *   Dinamismo Visual (✓ Completado)
    *   Optimización SEO del Video (✓ Completado)
    *   Interactividad en la Sección "Paso a Paso" (✓ Completado)
    *   Actualización de Contenido en "Servicios" (✓ Completado)

---

## **Fase 7: Refactorización del Dominio de Plataforma (En Progreso)**
*   **Objetivo:** Migrar la gestión de la configuración global (márgenes de beneficio, configuración del agente global) a su propio dominio hexagonal para mantener la coherencia arquitectónica.
*   **Pasos:**
    *   **Definir el Dominio (`src/lib/platform/domain`):** Crear `platform.entity.ts` y `platform.repository.ts`.
    *   **Crear Casos de Uso (`src/lib/platform/application`):** Crear `get-platform-config.use-case.ts` y `save-platform-config.use-case.ts`.
    *   **Implementar Infraestructura (`src/lib/platform/infrastructure`):** Crear `persistence/firestore-platform.repository.ts` y exponer los casos de uso.
    *   **Refactorizar UI:** Actualizar las páginas (`/dashboard/admin/agent`, `/dashboard/admin/economics`) para que usen la nueva arquitectura.
    *   **Eliminar Código Antiguo:** `src/services/platform.service.ts` y `src/lib/platform-actions.ts`.

---

## **Fase 8: Vectorización y Base de Conocimiento (RAG) (Próximos Pasos)**
*   **Objetivo:** Implementar un sistema de búsqueda vectorial (RAG) para que los agentes de IA puedan consultar una base de conocimiento interna y dar respuestas más precisas y basadas en nuestros propios datos.
*   **Pasos:**
    *   **Configurar Vector Store:** Elegir e implementar una solución de base de datos vectorial (ej. la extensión de Firestore, Pinecone, etc.).
    *   **Crear Flujo de Ingestión:** Desarrollar un proceso para tomar documentos (PDFs, Markdown) y convertirlos en embeddings usando un modelo de IA (ej. `text-embedding-geekco`).
    *   **Crear Herramienta de Búsqueda:** Implementar una nueva `tool` de Genkit (`knowledgeBaseSearch`) que permita al agente de IA buscar en el vector store.
    *   **Actualizar Agente de IA:** Modificar el `prompt` del agente de migración para que utilice la nueva herramienta de búsqueda como su fuente principal de verdad.

---

## **Fase 9: Portal Inmobiliario (Próximos Pasos)**
*   **Objetivo:** Desarrollar un portal completo para la búsqueda de vivienda (alquiler y venta), aplicando la arquitectura hexagonal desde el principio.
*   **Pasos:**
    *   **Definir Dominio Inmobiliario (`src/lib/real-estate/domain`):** Crear `property.entity.ts`, `real-estate.repository.ts`.
    *   **Crear Casos de Uso:** `create-property-listing.use-case.ts`, `search-properties.use-case.ts`, etc.
    *   **Implementar Infraestructura:** `firestore-real-estate.repository.ts`, `api/real-estate.controller.ts` y las rutas de API correspondientes.
    *   **Desarrollar UI Pública:** Crear las páginas `/properties` (listado) y `/properties/[id]` (detalle).
    *   **Desarrollar UI de Gestión:** Permitir a los usuarios (y agencias) publicar y gestionar sus propiedades desde el dashboard.

Este plan nos proporciona una guía clara y estructurada para ejecutar una refactorización exitosa, sentando las bases para una aplicación mucho más robusta, escalable y fácil de mantener.
