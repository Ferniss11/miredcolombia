# Hoja de Ruta Técnica: Reestructuración de MiRedColombia (2024-2025)

## 1. Visión Estratégica y Técnica

**Objetivo:** Transformar MiRedColombia en una plataforma centrada en la IA (Valeria), los portales de autogestión (Empleo, Vivienda) y el contenido de valor (Guías), monetizando el ecosistema digital y derivando servicios complejos a una agencia partner bajo un modelo de marca blanca.

**Principios Técnicos:**
*   **Arquitectura Modular:** Separar claramente las funcionalidades de los portales (Empleo, Vivienda, Directorio) y el núcleo de IA (Valeria).
*   **Modelo de Suscripción:** Implementar un sistema de pagos robusto (Stripe) para gestionar los planes de Valeria y las futuras tarifas de publicación.
*   **Experiencia de Usuario (UX) Coherente:** Unificar el diseño y la navegación para reflejar la nueva estructura del menú y los flujos de usuario.
*   **Desarrollo por Fases:** Implementar los cambios de forma incremental para asegurar la estabilidad y permitir ajustes.

---

## Fase 1: Cimientos y Reestructuración de la Interfaz (Core UI)

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

## Fase 2: Desarrollo del Ecosistema de Valeria (Monetización)

**Objetivo:** Implementar la página de Valeria y el sistema de suscripción.

*   **2.1. Diseñar la Página de Valeria (`/valeria`):**
    *   Implementar la sección de introducción.
    *   Diseñar las tarjetas de planes (Gratis, Plan Colombia, Plan España) con sus características y precios.
    *   El CTA "Empieza ahora" debe llevar al usuario al flujo de registro o al chat si ya está logueado.

*   **2.2. Integración con Stripe para Suscripciones:**
    *   Configurar productos y precios en Stripe para los planes de Valeria.
    *   Crear un webhook para recibir actualizaciones de Stripe (ej. `subscription.created`, `subscription.updated`).
    *   Implementar una `server action` que cree una sesión de Stripe Checkout cuando un usuario elige un plan.

*   **2.3. Lógica de Acceso por Roles (Valeria):**
    *   Modificar el `AuthContext` y el `UserController` para manejar un nuevo tipo de rol o claim `valeria_plan: 'free' | 'colombia' | 'espana'`.
    *   El webhook de Stripe debe actualizar este claim en Firebase Auth.
    *   El backend del chat de Valeria (`migration-chat-flow`) debe verificar este claim para dar respuestas básicas o extendidas.

---

## Fase 3: Evolución de los Portales (Modelo Freemium a Futuro)

**Objetivo:** Adaptar los portales de Empleo, Vivienda y Directorio al nuevo modelo de negocio (gratis hasta Dic 2025, de pago después).

*   **3.1. Portal de Empleo (`/empleo`):**
    *   Actualizar la página con los nuevos textos de introducción y CTAs para Empresas y Trabajadores.
    *   Añadir una nota visual clara en el formulario de publicación de ofertas: "Publicación gratuita hasta Diciembre de 2025".

*   **3.2. Portal de Vivienda (`/vivienda`):**
    *   Actualizar la página de introducción.
    *   Añadir nota en el formulario de publicación: "Publicación gratuita hasta Diciembre de 2025".

*   **3.3. Directorio de Negocios (`/directorio`):**
    *   Actualizar la página de introducción.
    *   Añadir nota en el formulario de registro de negocio: "Perfil básico gratuito hasta Diciembre de 2025".

*   **3.4. Backend para Futuros Pagos:**
    *   Modificar los modelos de datos de `JobPosting`, `Property` y `Business` para incluir un campo `subscriptionId` y `plan_expires_at`.
    *   Esto preparará el sistema para la lógica de pago que se activará en 2026.

---

## Fase 4: Contenido y Marketing Automation

**Objetivo:** Transformar el blog en un motor de captación de leads y nutrir a los usuarios a través de email.

*   **4.1. Migración de Blog a Guías:**
    *   Renombrar la ruta `/blog` a `/guias`.
    *   Actualizar la UI para que se presente como una colección de guías descargables en lugar de un blog tradicional.

*   **4.2. Implementar Lead Magnets:**
    *   En cada página de guía (`/guias/[slug]`), añadir un CTA prominente: "Descarga la guía completa en PDF".
    *   Crear un formulario modal que pida el email del usuario para enviar la guía.

*   **4.3. Configurar Secuencia de Email (Automation):**
    *   Conectar el formulario de guías a una herramienta de email marketing (ej. Mailchimp, SendGrid).
    *   Configurar la secuencia de bienvenida y nutrición descrita en el plan estratégico.

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
