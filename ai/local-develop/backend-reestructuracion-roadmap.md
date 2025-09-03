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

## Fase 4: Contenido y Marketing Automation (Lead Magnets) (PRÓXIMOS PASOS)

**Objetivo:** Transformar la sección de "Guías" en un motor de captación de leads, ofreciendo contenido de alto valor a cambio de datos de contacto.

*   **4.1. Crear la Entidad `Guide` (Backend Hexagonal) (✓):**
    *   **Dominio:** Definir la entidad `Guide` (`guide.entity.ts`) con campos: `id`, `title`, `description`, `coverImageUrl`, `pdfUrl`, `category`, `createdAt`.
    *   **Dominio:** Definir el puerto `GuideRepository` (`guide.repository.ts`).
    *   **Infraestructura:** Implementar `FirestoreGuideRepository` (`firestore-guide.repository.ts`) para la persistencia.
    *   **Aplicación:** Crear los casos de uso necesarios (`create`, `get`, `update`, `delete`).

*   **4.2. Desarrollar el Gestor de Guías (Admin Dashboard):**
    *   **API (✓):** Crear los endpoints de API (`/api/guides`) y el `GuideController` para conectar la UI con los casos de uso del backend. (✓)
    *   **UI:** Crear una nueva página en el dashboard de administrador (`/dashboard/admin/guides`).
    *   **UI:** Implementar un formulario que permita al administrador subir una guía: título, descripción, imagen de portada (a Firebase Storage) y el archivo PDF (a Firebase Storage).

*   **4.3. Implementar la UI Pública de Guías (`/guias`):**
    *   **UI:** La página `/guias` mostrará las guías publicadas en un formato de tarjetas visualmente atractivo (portada, título, descripción).
    *   **UI:** Cada tarjeta tendrá un botón "Descargar Guía". Al hacer clic, se abrirá un modal (`DownloadGuideModal`).
    *   **UI (`DownloadGuideModal`):**
        *   Este modal contendrá un formulario simple: `nombre`, `email` (obligatorio) y `teléfono` (opcional).
        *   Se reutilizará el `CreateOrderUseCase` existente. Al enviar el formulario, se creará un `Customer` (si no existe) y una `Order` con `type: 'lead_magnet'`, `itemName: 'Guía: [Título de la guía]'`, y `amount: 0`.

*   **4.4. Configurar la Secuencia de Email (Automation - Futuro):**
    *   **Infraestructura:** Conectar el `CreateOrderUseCase` (cuando el tipo sea `lead_magnet`) a un servicio de email (ej. Mailchimp, SendGrid) mediante un nuevo `EmailAdapter`.
    *   **Lógica:** Al crear una orden de tipo "guía", se añadirá el email del cliente a una lista de correo específica.
    *   **Marketing:** Configurar en la herramienta de email marketing la secuencia de bienvenida que envía el enlace de descarga del PDF y comienza el flujo de nutrición de leads.

---

## Fase 5: Contenido Audiovisual y Refinamiento Final

**Objetivo:** Integrar los nuevos vídeos y realizar los ajustes finales de la plataforma.

*   **5.1. Integrar Vídeos:**
    *   Reemplazar el vídeo actual del `HeroSection` por el nuevo vídeo de Jennifer.
    *   Añadir el vídeo demo de Valeria en la página `/valeria`.
    *   Añadir el vídeo animado de los packs en la página `/packs`.

*   **5.2. Página de Trámites y Packs (Partner):**
    *   Asegurarse de que la página `/tramites` y `/packs` presenten los servicios en marca blanca.
    *   Verificar que los botones "Solicitar ahora" redirijan correctamente al sistema del partner.

*   **5.3. Tracking y Analítica:**
    *   Implementar Google Analytics 4 y el Píxel de Meta.
    *   Configurar eventos clave: `start_valeria_trial`, `subscribe_valeria_plan`, `download_guide`, `click_partner_pack`.

---

## Tareas Transversales (A considerar en todas las fases)

*   **Notas de IVA y Facturación:** Añadir el texto "Precios sin IVA. Se emite factura automáticamente." en todas las páginas donde se muestren precios de servicios de pago (Valeria, Empleo, Vivienda, Directorio).
*   **Hosting y SSL:** Revisar la configuración actual del hosting para asegurar que puede soportar el aumento de tráfico y que el certificado SSL está correctamente configurado para toda la web.
*   **Widget de Valeria:** Integrar el chat de Valeria de forma global en la web, asegurándose de que no interfiera con otros elementos de la UI.
```