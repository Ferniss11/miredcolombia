# Hoja de Ruta Técnica: Reestructuración de MiRedColombia (2024-2025)

## 1. Visión Estratégica y Técnica

**Objetivo:** Transformar MiRedColombia en una plataforma centrada en la IA (Valeria), los portales de autogestión (Empleo, Vivienda) y el contenido de valor (Guías), monetizando el ecosistema digital y derivando servicios complejos a una agencia partner bajo un modelo de marca blanca.

**Principios Técnicos:**
*   **Arquitectura Modular:** Separar claramente las funcionalidades de los portales (Empleo, Vivienda, Directorio) y el núcleo de IA (Valeria).
*   **Modelo de Suscripción:** Implementar un sistema de pagos robusto (Stripe) para gestionar los planes de Valeria y las futuras tarifas de publicación.
*   **Experiencia de Usuario (UX) Coherente:** Unificar el diseño y la navegación para reflejar la nueva estructura del menú y los flujos de usuario.
*   **Desarrollo por Fases:** Implementar los cambios de forma incremental para asegurar la estabilidad y permitir ajustes.

---

## Fase 1: Cimientos y Reestructuración de la Interfaz (Core UI) (✓ COMPLETADA)

**Objetivo:** Establecer la nueva estructura de navegación y las páginas principales.

*   **1.1. Actualizar Menú Principal (✓):**
    *   Refactorizar `src/components/layout/Header.tsx` para reflejar el nuevo menú: Inicio, Empleo, Vivienda, Trámites, Packs, Valeria, Guías, Directorio.
    *   Eliminar los enlaces obsoletos.

*   **1.2. Rediseñar la Página de Inicio (`/`) (✓):**
    *   Implementar el nuevo `HeroSection` con los textos estratégicos. (✓)
    *   Crear la sección "Cómo te ayudamos" (3 columnas). (✓)
    *   Crear la sección "Packs" que enlace a la página `/packs`. (✓)
    *   Crear la mini-sección de "Valeria" que enlace a la página `/valeria`. (✓)
    *   Eliminar la sección de servicios individuales. (✓)

*   **1.3. Crear Páginas Estructurales (Placeholders) (✓):**
    *   Crear los archivos de página para `/empleo`, `/vivienda`, `/tramites`, `/packs`, `/valeria`, y `/guias` con un diseño básico y el texto de introducción definido en el plan estratégico.

---

## Fase 2: Desarrollo del Ecosistema de Valeria (Monetización) (✓ COMPLETADA)

**Objetivo:** Implementar la página de Valeria y el sistema de suscripción.

*   **2.1. Diseñar la Página de Valeria (`/valeria`) (✓):**
    *   Implementar la sección de introducción.
    *   Diseñar las tarjetas de planes (Gratis, Plan Colombia, Plan España) con sus características y precios.
    *   El CTA "Empieza ahora" debe llevar al usuario al flujo de registro o al chat si ya está logueado.

*   **2.2. Integración con Stripe para Suscripciones (✓):**
    *   Configurar productos y precios en Stripe para los planes de Valeria. (✓)
    *   Crear un webhook para recibir actualizaciones de Stripe (`checkout.session.completed`). (✓)
    *   Implementar una `server action` que cree una sesión de Stripe Checkout cuando un usuario elige un plan. (✓)

*   **2.3. Lógica de Acceso por Roles (Valeria) (✓):**
    *   Modificar el `AuthContext` y el `UserController` para manejar un nuevo tipo de rol o claim `valeria_plan: 'free' | 'colombia' | 'espana'`. (✓)
    *   El webhook de Stripe debe actualizar este claim en Firebase Auth. (✓)
    *   El backend del chat de Valeria (`migration-chat-flow`) debe verificar este claim para dar respuestas básicas o extendidas. (✓)

---

## Fase 2.5: Sistema de Órdenes y Contabilidad (✓ COMPLETADA)

**Objetivo:** Crear un registro persistente de todas las transacciones (suscripciones y pagos únicos) para la contabilidad y gestión de la plataforma.

*   **Crear Entidades `Customer` y `Order` (✓):**
    *   Definir la entidad `Customer` para almacenar datos de los compradores (registrados o invitados). (✓)
    *   Definir la entidad `Order` para registrar cada transacción, vinculando el cliente, el producto y el ID de pago de Stripe. (✓)
*   **Implementar Repositorios y Casos de Uso (✓):**
    *   Crear `CustomerRepository` y `OrderRepository` en Firestore. (✓)
    *   Implementar un `CreateOrderUseCase` que encapsule la lógica de negocio para crear una nueva orden. (✓)
*   **Integrar en el Flujo de Pago (✓):**
    *   Modificar el webhook de Stripe para que, tras un pago exitoso, se llame al `CreateOrderUseCase` y se guarde un registro de la orden en la base de datos. (✓)

---

## Fase 3: Evolución de los Portales (Modelo Freemium a Futuro) (✓ COMPLETADA)

**Objetivo:** Adaptar los portales de Empleo, Vivienda y Directorio al nuevo modelo de negocio (gratis hasta Dic 2025, de pago después).

*   **3.1. Portal de Empleo (`/empleo`) (✓):**
    *   Actualizar la página con los nuevos textos de introducción y CTAs para Empresas y Trabajadores. (✓)
    *   Añadir una nota visual clara en el formulario de publicación de ofertas: "Publicación gratuita hasta Diciembre de 2025". (✓)

*   **3.2. Portal de Vivienda (`/vivienda`) (✓):**
    *   Actualizar la página de introducción. (✓)
    *   Añadir nota en el formulario de publicación: "Publicación gratuita hasta Diciembre de 2025". (✓)

*   **3.3. Directorio de Negocios (`/directorio`) (✓):**
    *   Actualizar la página de introducción. (✓)
    *   Añadir nota en el formulario de registro de negocio: "Perfil básico gratuito hasta Diciembre de 2025". (✓)

*   **3.4. Backend para Futuros Pagos (✓):**
    *   Modificar los modelos de datos de `JobPosting`, `Property` y `Business` para incluir un campo `subscriptionId` y `planExpiresAt`. (✓)
    *   Esto preparará el sistema para la lógica de pago que se activará en 2026. (✓)

---

## Fase 4: Contenido y Marketing Automation (Lead Magnets) (✓ COMPLETADA)

**Objetivo:** Transformar la sección de "Guías" en un motor de captación de leads, ofreciendo contenido de alto valor a cambio de datos de contacto.

*   **4.1. Crear la Entidad `Guide` (Backend Hexagonal) (✓):**
    *   **Dominio:** Definir la entidad `Guide` (`guide.entity.ts`) con campos: `id`, `title`, `description`, `coverImageUrl`, `pdfUrl`, `category`, `createdAt`. (✓)
    *   **Dominio:** Definir el puerto `GuideRepository` (`guide.repository.ts`). (✓)
    *   **Infraestructura:** Implementar `FirestoreGuideRepository` (`firestore-guide.repository.ts`) para la persistencia. (✓)
    *   **Aplicación:** Crear los casos de uso necesarios (`create`, `get`, `update`, `delete`). (✓)

*   **4.2. Desarrollar el Gestor de Guías (Admin Dashboard) (✓):**
    *   **API (✓):** Crear los endpoints de API (`/api/guides`) y el `GuideController` para conectar la UI con los casos de uso del backend. (✓)
    *   **UI (✓):** Crear una nueva página en el dashboard de administrador (`/dashboard/admin/guides`). (✓)
    *   **UI (✓):** Implementar un formulario que permita al administrador subir una guía: título, descripción, imagen de portada (a Firebase Storage) y el archivo PDF (a Firebase Storage). (✓)

*   **4.3. Implementar la UI Pública de Guías (`/guias` y `/blog/[slug]`) (✓):**
    *   **UI (✓):** La página `/guias` muestra las guías publicadas en un formato de tarjetas visualmente atractivo. (✓)
    *   **UI (✓):** Cada tarjeta de guía tiene un botón "Descargar Guía" que abre un modal (`DownloadGuideModal`). (✓)
    *   **UI (`DownloadGuideModal`) (✓):**
        *   Contiene un formulario simple para capturar leads. (✓)
        *   Reutiliza el `CreateOrderUseCase` para crear un `Customer` y una `Order` de tipo `lead_magnet`. (✓)
    *   **UI (Enriquecimiento del Blog) (✓):**
        *   La página `/blog/[slug]` ahora incluye una barra lateral `sticky` con una `LeadMagnetCard` para capturar leads de forma contextual. (✓)
        *   La página del blog también muestra `RelatedPosts` para mejorar la retención. (✓)

---

## Fase 5: Automatización de Marketing por Email (✓ COMPLETADA)

**Objetivo:** Nutrir a los leads capturados mediante secuencias de email automatizadas para convertirlos en clientes.

*   **5.1. Definir Entidades de Email (Dominio) (✓):**
    *   Crear `email-sequence.entity.ts`: Define una secuencia (ej. "Bienvenida Guía Empadronamiento"). Tendrá un `name`, un `triggerEvent` (`on_guide_download`, `on_user_signup`), y una lista de `EmailStep`.
    *   Cada `EmailStep` tendrá: `delay` (ej. 1 hora, 2 días), `subject`, `body` (en Markdown/HTML), y una `templateId` (opcional, para plantillas de SendGrid).

*   **5.2. Casos de Uso e Infraestructura (Backend) (✓):**
    *   **Repositorio:** Crear `EmailSequenceRepository` (puerto) y su implementación en Firestore (`firestore-email-sequence.repository.ts`).
    *   **Casos de Uso:** `CreateEmailSequence`, `AddStepToSequence`, `GetSequenceByTrigger`.
    *   **API:** Crear un `EmailSequenceController` y los endpoints `/api/email/sequences` para que el admin pueda gestionar las secuencias.

*   **5.3. Desarrollar el Gestor de Secuencias (Admin Dashboard) (✓):**
    *   **UI:** Crear una nueva página en el dashboard (`/dashboard/admin/email-sequences`).
    *   **UI (MVP):** Un formulario simple, no un canvas. El admin podrá:
        *   Crear una nueva secuencia y asignarle un disparador (ej. "Descarga de Guía").
        *   Para esa secuencia, podrá añadir "Pasos". Cada paso será un formulario para definir el `retraso`, el `asunto` y el `cuerpo del email`. Los pasos se mostrarán como una lista ordenada.

*   **5.4. Integración con Trigger de Email de Firebase (✓):**
    *   **Adaptador:** Crear un `FirebaseEmailAdapter` que, al crear una orden de tipo `lead_magnet`, no solo guarde al `Customer`, sino que también añada un documento a una colección `mail` de Firestore.
    *   **Extensión de Firebase:** La extensión "Trigger Email" de Firebase se configura para escuchar nuevos documentos en la colección `mail`.
    *   **Lógica:** Cuando se crea la `Order`, el `CreateOrderUseCase` también buscará la secuencia de email asociada al `trigger` "Descarga de Guía". Luego, creará los documentos necesarios en la colección `mail` para cada paso de la secuencia, utilizando la función `delivery.schedule` de la extensión para programar los envíos futuros según el `delay` de cada paso.

*   **5.5. Generador de Secuencias con IA (Bonus) (✓):**
    *   Crear un nuevo flujo de Genkit (`generate-email-sequence.flow.ts`) capaz de generar una secuencia de emails completa (nombre, trigger, pasos, asuntos, cuerpos) a partir de un objetivo.
    *   Añadir un nuevo modal en la UI del gestor de secuencias para que el admin pueda dar contexto a la IA (ej. "quiero una secuencia de 3 emails para dar la bienvenida a los que descarguen la guía de empadronamiento").
    *   Al recibir la respuesta de la IA, pre-rellenar el formulario de creación de secuencias para que el admin pueda revisar y guardar.

---

## Fase 6: Contenido Audiovisual y Refinamiento Final

**Objetivo:** Integrar los nuevos vídeos y realizar los ajustes finales de la plataforma.

*   **6.1. Integrar Vídeos:**
    *   Reemplazar el vídeo actual del `HeroSection` por el nuevo vídeo de Jennifer.
    *   Añadir el vídeo demo de Valeria en la página `/valeria`.
    *   Añadir el vídeo animado de los packs en la página `/packs`.

*   **6.2. Página de Trámites y Packs (Partner):**
    *   Asegurarse de que la página `/tramites` y `/packs` presenten los servicios en marca blanca.
    *   Verificar que los botones "Solicitar ahora" redirijan correctamente al sistema del partner.

*   **6.3. Tracking y Analítica:**
    *   Implementar Google Analytics 4 y el Píxel de Meta.
    *   Configurar eventos clave: `start_valeria_trial`, `subscribe_valeria_plan`, `download_guide`, `click_partner_pack`.

---

## Tareas Transversales (A considerar en todas las fases)

*   **Notas de IVA y Facturación:** Añadir el texto "Precios sin IVA. Se emite factura automáticamente." en todas las páginas donde se muestren precios de servicios de pago (Valeria, Empleo, Vivienda, Directorio).
*   **Hosting y SSL:** Revisar la configuración actual del hosting para asegurar que puede soportar el aumento de tráfico y que el certificado SSL está correctamente configurado para toda la web.
*   **Widget de Valeria:** Integrar el chat de Valeria de forma global en la web, asegurándose de que no interfiera con otros elementos de la UI.
