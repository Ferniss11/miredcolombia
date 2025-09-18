# Hoja de Ruta Técnica: Reestructuración de MiRedColombia (2024-2025)

## 1. Visión Estratégica y Técnica

**Objetivo:** Transformar MiRedColombia en una plataforma centrada en la IA (Valeria), los portales de autogestión (Empleo, Vivienda) y el contenido de valor (Guías), monetizando el ecosistema digital y derivando servicios complejos a una agencia partner bajo un modelo de marca blanca.

**Principios Técnicos:**
*   **Arquitectura Modular:** Separar claramente las funcionalidades de los portales (Empleo, Vivienda, Directorio) y el núcleo de IA (Valeria).
*   **Modelo de Suscripción:** Implementar un sistema de pagos robusto (Stripe) para gestionar los planes de Valeria y las futuras tarifas de publicación.
*   **Experiencia de Usuario (UX) Coherente:** Unificar el diseño y la navegación para reflejar la nueva estructura del menú y los flujos de usuario.
*   **Desarrollo por Fases:** Implementar los cambios de forma incremental para asegurar la estabilidad y permitir ajustes.

---

## Fase 1: Cimientos y Reestructuración de la Interfaz (Core UI) - COMPLETADA
*   **Estimación:** 10 horas
*   **Objetivo:** Establecer la nueva estructura de navegación y las páginas principales.
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

## Fase 2: Desarrollo del Ecosistema de Valeria (Monetización) - COMPLETADA
*   **Estimación:** 22 horas
*   **Objetivo:** Implementar la página de Valeria y el sistema de suscripción.
*   **2.1. Diseñar la Página de Valeria (`/valeria`) (✓):**
    *   Implementar la sección de introducción.
    *   Diseñar las tarjetas de planes (Gratis, Valeria Premium, Valeria PRO) con sus características y precios.
    *   El CTA "Empieza ahora" debe llevar al usuario al flujo de registro o al chat si ya está logueado.

*   **2.2. Integración con Stripe para Suscripciones (✓):**
    *   Configurar productos y precios en Stripe para los planes de Valeria. (✓)
    *   Crear un webhook para recibir actualizaciones de Stripe (`checkout.session.completed`). (✓)
    *   Implementar una `server action` que cree una sesión de Stripe Checkout cuando un usuario elige un plan. (✓)

*   **2.3. Lógica de Acceso por Roles (Valeria) (✓):**
    *   Modificar el `AuthContext` y el `UserController` para manejar un nuevo tipo de rol o claim `valeria_plan: 'free' | 'valeria_premium' | 'valeria_pro'`. (✓)
    *   El webhook de Stripe debe actualizar este claim en Firebase Auth. (✓)
    *   El backend del chat de Valeria (`migration-chat-flow`) debe verificar este claim para dar respuestas básicas o extendidas. (✓)

---

## Fase 2.5: Sistema de Órdenes y Contabilidad - COMPLETADA
*   **Estimación:** 12 horas
*   **Objetivo:** Crear un registro persistente de todas las transacciones (suscripciones y pagos únicos) para la contabilidad y gestión de la plataforma.
*   **Crear Entidades `Customer` y `Order` (✓):**
    *   Definir la entidad `Customer` para almacenar datos de los compradores (registrados o invitados). (✓)
    *   Definir la entidad `Order` para registrar cada transacción, vinculando el cliente, el producto y el ID de pago de Stripe. (✓)
*   **Implementar Repositorios y Casos de Uso (✓):**
    *   Crear `CustomerRepository` y `OrderRepository` en Firestore. (✓)
    *   Implementar un `CreateOrderUseCase` que encapsule la lógica de negocio para crear una nueva orden. (✓)
*   **Integrar en el Flujo de Pago (✓):**
    *   Modificar el webhook de Stripe para que, tras un pago exitoso, se llame al `CreateOrderUseCase` y se guarde un registro de la orden en la base de datos. (✓)

---

## Fase 3: Evolución de los Portales (Modelo Freemium a Futuro) - COMPLETADA
*   **Estimación:** 8 horas
*   **Objetivo:** Adaptar los portales de Empleo, Vivienda y Directorio al nuevo modelo de negocio (gratis hasta Dic 2025, de pago después).
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

## Fase 4: Contenido y Marketing Automation (Lead Magnets) - COMPLETADA
*   **Estimación:** 20 horas
*   **Objetivo:** Transformar la sección de "Guías" en un motor de captación de leads, ofreciendo contenido de alto valor a cambio de datos de contacto.
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

## Fase 5: Automatización de Marketing por Email - COMPLETADA
*   **Estimación:** 25 horas
*   **Objetivo:** Nutrir a los leads capturados mediante secuencias de email automatizadas para convertirlos en clientes.
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

## Fase 6: Contenido Audiovisual y Refinamiento Final - EN PROGRESO
*   **Estimación:** 6 horas
*   **Objetivo:** Integrar los nuevos vídeos y realizar los ajustes finales de la plataforma.
*   **6.1. Integrar Vídeos (✓):**
    *   Reemplazar el vídeo actual del `HeroSection` por el nuevo vídeo de Jennifer. (✓)
    *   Añadir el vídeo demo de Valeria en la página `/valeria`. (✓)
    *   Añadir el vídeo animado de los packs en la página `/packs`. (✓)

*   **6.2. Tracking y Analítica (Próximos Pasos):**
    *   Implementar Google Analytics 4 y el Píxel de Meta.
    *   Configurar eventos clave: `start_valeria_trial`, `subscribe_valeria_plan`, `download_guide`, `click_partner_pack`.

---

## Fase 7: Ecosistema de Asistentes IA "Valeria" (Freemium y RAG) - EN PROGRESO
*   **Estimación:** 45 horas
*   **Objetivo:** Transformar a Valeria en un ecosistema de asistentes IA personalizables, simplificando la oferta a un modelo Freemium y sentando las bases para una base de conocimiento vectorial propia (RAG).

*   **7.1. Refactorización de la Oferta y Comunicación (Frontend) (✓ COMPLETADA):**
    *   **Simplificar Planes:** Actualizar la UI en `/valeria` para reflejar un modelo de dos niveles: `Gratis` y `Premium` (€4,99/mes), eliminando el plan PRO. (✓)
    *   **Comunicar Valor:** Rediseñar la página `/valeria` para comparar visualmente los beneficios y justificar el salto a Premium (ej. comparativa de respuestas, visualización de guías bloqueadas). (✓)
    *   **Potenciar Home:** Mover la sección de Valeria justo después del Hero, rediseñarla para ser más impactante y mover los elementos dinámicos (relojes, tips) al footer para dar un toque de elegancia global. (✓)

*   **7.2. Ajuste del Flujo de Suscripción (Backend) (✓ COMPLETADA):**
    *   **(Tarea Manual - Realizada):** Crear el nuevo producto "Suscripción Valeria Premium" en Stripe y obtener su Price ID. (✓)
    *   **(Tarea Manual - Realizada):** Añadir el nuevo Price ID a las variables de entorno (`.env`). (✓)
    *   **Adaptar `payment-actions.ts`:** Asegurar que la acción `createSubscriptionCheckoutSessionAction` utilice la nueva variable de entorno al recibir la petición para el plan premium. (✓)
    *   **Adaptar `AuthContext.tsx`:** Simplificar la lógica de `custom claims` para manejar solo `valeria_plan: 'free'` y `valeria_plan: 'premium'`. (✓)

*   **7.3. Gestión Avanzada de Agentes (Admin Dashboard) (✓ COMPLETADA):**
    *   **Panel Multi-Agente:** Refactorizar `/dashboard/admin/agent` para gestionar configuraciones de agentes separadas en Firestore: `global` (para el plan gratuito) y `valeria_premium`. (✓)
    *   **Adaptador Inteligente:** Actualizar el `GenkitAgentAdapter` para que cargue la configuración (`systemPrompt`, `model`) correcta basándose en el `claim` del usuario. (✓)
    
*   **7.4. Laboratorio de Agentes (Admin Playground):**
    *   **Objetivo:** Construir un "banco de pruebas" en el panel de administrador para probar el comportamiento de los diferentes agentes de IA en un entorno controlado.
    *   **UI:** Crear una nueva página (`/dashboard/admin/agent-lab`) que contenga:
        *   Un selector para elegir qué agente probar (`Global`, `Premium`, `Agente de Negocio`).
        *   Un área de chat para interactuar con el agente seleccionado.
        *   Un panel de metadatos que muestre el coste, tokens, y `system prompt` exacto usado en la última respuesta.
        *   (Para Premium y Negocio) Un campo para subir un documento o seleccionar un negocio para añadir contexto a la prueba.
    *   **Backend:** Crear un nuevo `ChatController` o endpoint que reciba el nombre del agente a simular y el contexto adicional, y devuelva no solo la respuesta, sino también los metadatos de depuración.

*   **7.5. Análisis de Documentos en Sesión (Valeria Premium):**
    *   **Objetivo:** Permitir a los usuarios Premium subir un documento (PDF) y conversar con la IA sobre su contenido.
    *   **UI:** Añadir un botón para subir archivos (`<input type="file">`) en la interfaz de chat de `/dashboard/valeria`.
    *   **Backend (API):** Adaptar la ruta `POST /api/chat/sessions/[id]/messages` para que acepte `FormData` (texto y archivo).
    *   **Backend (Lógica):** Instalar `pdf-parse`. En el `ChatController` o en el `PostMessageUseCase`, al recibir un archivo, usar la librería para extraer su contenido a texto plano.
    *   **Backend (Adaptador y Prompt):** Modificar el `GenkitAgentAdapter` para que, si recibe texto de un documento, lo inyecte en un nuevo campo `documentText` del `prompt` del agente `valeria_premium`, dándole a la IA el contexto necesario para responder preguntas sobre ese documento.

*   **7.6. Implementación de Base de Conocimiento (RAG - Research-Augmented Generation):**
    *   **(Tarea Manual): Configuración de Consolas (Google Cloud & Firebase):**
        *   **Activar APIs de Google Cloud:** En la consola de Google Cloud, asegurarse de que las APIs `Cloud Build`, `Cloud Run`, y `Artifact Registry` estén habilitadas para el proyecto.
        *   **Instalar Extensión "Vector Search":** En la consola de Firebase, ir a la sección "Build > Extensions" e instalar la extensión **Vector Search**.
        *   **Configurar Extensión:** Durante la instalación, configurar los siguientes parámetros:
            *   **Cloud Function location:** `europe-west1` (o la región que prefieras).
            *   **Cloud Storage bucket for embeddings:** Apuntar al bucket por defecto de Firebase Storage.
            *   **Collection path:** `knowledge_base` (la colección donde se almacenarán los vectores).
            *   **Vector field path:** `embedding`.
            *   **Vector dimensions:** `768` (correspondiente al modelo `text-embedding-004`).
            *   **Distance measure:** `COSINE`.
    *   **Flujo de Ingestión (Cloud Function):**
        *   Crear una Cloud Function que se active al subir un archivo (PDF, MD) a una carpeta específica en Firebase Storage.
        *   La función leerá el documento, lo dividirá en trozos (chunks), generará un vector (embedding) para cada chunk usando un modelo como `text-embedding-004`, y guardará `{ content, embedding, source }` en la colección `knowledge_base`.
    *   **Herramienta de Búsqueda Vectorial (Genkit):**
        *   Crear una nueva `tool` de Genkit (`knowledgeBaseSearch`) que use el operador `findNeighbors` de Firestore para buscar en la `knowledge_base`.
    *   **Actualizar Agente Premium:** Modificar el `systemPrompt` del agente `valeria_premium` para que priorice el uso de la herramienta `knowledgeBaseSearch` antes de usar su conocimiento general, asegurando respuestas basadas en nuestros documentos.

*   **7.7. Síntesis de Voz (Text-to-Speech):**
    *   **Objetivo:** Permitir que las respuestas de Valeria puedan ser escuchadas además de leídas.
    *   **Backend (Genkit Flow):** Crear un nuevo flujo `textToSpeechFlow` que reciba un texto y devuelva una URL de datos de audio (`data:audio/wav;base64,...`).
        *   Este flujo usará el modelo `gemini-2.5-flash-preview-tts`.
        *   Instalar y usar la librería `wav` para convertir el audio PCM de Gemini a formato WAV.
    *   **API:** Crear un nuevo endpoint, por ejemplo `POST /api/audio/tts`, que exponga este flujo.
    *   **UI:** En el `ChatWidget`, añadir un botón de "Play" junto a cada mensaje de la IA. Al hacer clic, se llamará al nuevo endpoint y se reproducirá el audio resultante en un elemento `<audio>`.

*   **7.8. Reconocimiento de Voz (Speech-to-Text):**
    *   **Objetivo:** Permitir a los usuarios hablarle a Valeria en lugar de escribir.
    *   **UI:** Añadir un botón de "Grabar" en la barra de entrada del `ChatWidget`.
        *   Al pulsarlo, usar la API `MediaRecorder` del navegador para grabar el audio del micrófono del usuario.
        *   Al detener la grabación, se obtiene un `Blob` de audio.
    *   **Backend (Genkit Flow):** El flujo `migrationChat` debe ser adaptado para aceptar opcionalmente un `audioDataUri` además del `currentMessage`.
        *   Si se recibe audio, Genkit lo transcribirá automáticamente a texto antes de procesar el prompt.
    *   **API y Controller:** Modificar la ruta `POST /api/chat/sessions/[id]/messages` y el `ChatController` para que acepten `FormData` con un campo de texto y un campo de audio opcional.

---

## Fase 8: Ecosistema de Partners y Servicios Avanzados - PLANIFICACIÓN
*   **Estimación:** 30 horas
*   **Objetivo:** Convertir las secciones "Packs" y "Trámites" en un mercado dinámico, permitiendo a profesionales verificados (partners) ofrecer sus servicios directamente a través de la plataforma.
*   **8.1. Definir Rol y Entidades de Partner:**
    *   Crear un nuevo rol de usuario: `'Partner'`.
    *   Definir la entidad `PartnerProfile` en el dominio, con campos como `specialization`, `bio`, `servicesOffered`, `consultationPrice`, etc.
    *   Modificar las entidades `Pack` y `Tramite` para que puedan ser vinculadas a un `partnerId`.

*   **8.2. Desarrollar el Dashboard de Partner:**
    *   Crear la ruta `/dashboard/partner` con acceso restringido para este rol.
    *   Implementar un formulario para que los partners puedan editar su perfil público.
    *   Crear una interfaz para que los partners puedan ver y gestionar los `Leads` (consultas) recibidos.

*   **8.3. Implementar el Flujo de Leads:**
    *   Asegurarse de que la página `/tramites` y `/packs` presenten los servicios en marca blanca.
    *   Verificar que los botones "Solicitar ahora" redirijan correctamente al sistema del partner.
    *   Reemplazar los botones de "Solicitar ahora" por un formulario de contacto modal.
    *   Al enviar el formulario, se creará una entidad `Lead` en la base de datos y se notificará por email al partner correspondiente.

*   **8.4. Flujo de Aprobación de Partners (Admin):**
    *   Crear una sección en el dashboard de administrador para ver y aprobar las solicitudes de nuevos partners.
    *   Asegurar que solo los partners aprobados aparezcan públicamente.

---

## Tareas Transversales (A considerar en todas las fases)

*   **Notas de IVA y Facturación:** Añadir el texto "Precios sin IVA. Se emite factura automáticamente." en todas las páginas donde se muestren precios de servicios de pago (Valeria, Empleo, Vivienda, Directorio).
*   **Hosting y SSL:** Revisar la configuración actual del hosting para asegurar que puede soportar el aumento de tráfico y que el certificado SSL está correctamente configurado para toda la web.
*   **Widget de Valeria:** Integrar el chat de Valeria de forma global en la web, asegurándose de que no interfiera con otros elementos de la UI.
