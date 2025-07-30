
# Hoja de Ruta: Desarrollo del Portal de Empleo Público

## Objetivo General

Construir la cara pública del portal de empleo, permitiendo a los visitantes del sitio web ver y aplicar a las ofertas de trabajo publicadas por Administradores y Anunciantes. Esto incluye una nueva sección en la página de inicio, una página de listado de ofertas y una página de detalles para cada oferta.

---

## Fase 1: Exponer los Datos de Empleo de Forma Pública (✓ Completada)

El backend y la lógica de negocio ya existen gracias a la arquitectura hexagonal. Ahora necesitamos crear una capa de acceso pública y segura.

### Tarea 1.1: Crear Server Actions Públicas (✓)

*   **Archivo:** `src/lib/job-posting/infrastructure/nextjs/job-posting.server-actions.ts`
*   **Acciones:**
    1.  Crear una nueva función `getPublicJobPostingsAction`. (✓)
    2.  Esta función llamará al `GetJobPostingsUseCase` existente. (✓)
    3.  **Lógica Clave:** Filtrará los resultados para devolver solo las ofertas con `status: 'ACTIVE'`. Esto asegura que los borradores o las ofertas cubiertas no sean visibles públicamente. (✓)
    4.  Crear una nueva función `getPublicJobPostingByIdAction(id: string)`. (✓)
    5.  Llamará al `findById` del repositorio y devolverá la oferta solo si su estado es `ACTIVE`. (✓)

---

## Fase 2: Construir la Interfaz de Usuario Pública (✓ Completada)

Con los datos accesibles, podemos construir las páginas que los usuarios verán.

### Tarea 2.1: Página de Detalles de la Oferta (`/jobs/[id]`) (✓)

*   **Ruta:** `src/app/jobs/[id]/page.tsx`
*   **Componente:** `JobDetailsPage`
*   **Funcionalidad:**
    *   Será un Server Component que recibe el `id` de la oferta desde los `params`. (✓)
    *   Llamará a `getPublicJobPostingByIdAction(id)` para obtener los datos de la oferta. (✓)
    *   Si no se encuentra la oferta, mostrará una página de "No Encontrado" (`notFound()`). (✓)
    *   **Diseño:**
        *   Header con el título del puesto, nombre de la empresa, ubicación y tipo de contrato. (✓)
        *   Mostrará el logo de la empresa y la imagen principal de la oferta si existen. (✓)
        *   Cuerpo principal con la descripción completa del puesto (renderizando el Markdown). (✓)
        *   Una barra lateral o tarjeta con información clave: salario (si está disponible), habilidades requeridas, tipo de jornada. (✓)
        *   Un botón claro de "Aplicar Ahora" que redirija a `applicationUrl` o abra un `mailto:` a `applicationEmail`. (✓)

### Tarea 2.2: Página de Listado de Ofertas (`/jobs`) (✓)

*   **Ruta:** `src/app/jobs/page.tsx`
*   **Componente:** `JobsPublicPage`
*   **Funcionalidad:**
    *   Será un Server Component que llama a `getPublicJobPostingsAction()` para obtener todas las ofertas activas. (✓)
    *   **Diseño:**
        *   Un header con un título principal y una barra de búsqueda (funcionalidad de búsqueda a implementar en una fase posterior). (✓)
        *   Un área de filtros en una barra lateral (por tipo de contrato, ubicación, etc. - a implementar después). (✓)
        *   El listado principal mostrará cada oferta en una `Card` individual. (✓)
        *   Cada `Card` mostrará: logo de la empresa, título del puesto, nombre de la empresa, ubicación y salario (resumido). (✓)
        *   Cada `Card` será un `Link` que llevará a la página de detalles `/jobs/[id]`. (✓)

### Tarea 2.3: Sección de Empleos en la Página de Inicio (✓)

*   **Archivo:** `src/components/home/JobsSection.tsx` (crear este componente) (✓)
*   **Integración:** `src/components/home/HomePageClient.tsx` (✓)
*   **Funcionalidad:**
    *   La página principal (`src/app/page.tsx`) llamará a `getPublicJobPostingsAction()` y pasará las 3-4 ofertas más recientes como `props` a `HomePageClient`. (✓)
    *   `HomePageClient` pasará estas ofertas al nuevo componente `JobsSection`. (✓)
    *   **Diseño de `JobsSection`:**
        *   Un título claro como "Últimas Ofertas de Empleo". (✓)
        *   Mostrará 3 o 4 ofertas en formato de `Card`, similar al de la página `/jobs` pero quizás un poco más compacto. (✓)
        *   Incluirá un botón visible de "Ver Todas las Ofertas" que enlace a la página `/jobs`. (✓)

---

## Fase 3: Integración y Refinamiento

### Tarea 3.1: Actualizar la Navegación

*   **Archivo:** `src/components/layout/Header.tsx`
*   **Acción:** Añadir un nuevo enlace "Empleo" en la barra de navegación principal que apunte a `/jobs`.

### Tarea 3.2: SEO y Metadatos

*   **Archivos:** `src/app/jobs/page.tsx` y `src/app/jobs/[id]/page.tsx`
*   **Acción:** Implementar las funciones `generateMetadata` en ambas páginas para asegurar que cada página de oferta y el listado general tengan títulos y descripciones SEO-friendly. Para la página de detalles, el título debe incluir el nombre del puesto y la empresa.

---

## Ideas para Futuras Extensiones del Servicio

Una vez completado el portal básico, podemos expandir la funcionalidad para crear un ecosistema de empleo mucho más completo:

1.  **Perfiles de Candidatos (Buscadores de Empleo):**
    *   Permitir que los usuarios (`role: 'User'`) creen un perfil profesional.
    *   Podrían subir su CV, añadir experiencia laboral, habilidades y un resumen profesional.
    *   Las empresas podrían buscar en esta base de datos de candidatos (potencialmente como una función Premium).

2.  **Sistema de Aplicación Interno:**
    *   En lugar de redirigir a un enlace externo, los usuarios podrían aplicar directamente desde la plataforma con su perfil.
    *   Esto permitiría a los anunciantes gestionar las candidaturas directamente desde su dashboard.

3.  **Alertas de Empleo:**
    *   Los usuarios podrían guardar búsquedas y configurar alertas por correo electrónico para recibir notificaciones cuando se publiquen nuevas ofertas que coincidan con sus criterios.

4.  **Portal de "Ofrezco mis Servicios" (Para Guests/Usuarios):**
    *   Crear una sección similar a un tablón de anuncios donde los usuarios puedan publicar sus servicios como *freelancers* o trabajadores independientes (ej. "Ofrezco servicios de limpieza", "Soy desarrollador web y busco proyectos").
    *   Esto no serían ofertas de empleo tradicionales, sino un espacio para que la comunidad se ofrezca y contrate entre sí. Se podría monetizar destacando estos anuncios.

5.  **Integración con IA:**
    *   Usar un agente de IA para ayudar a las empresas a redactar ofertas de empleo atractivas.
    *   Un asistente para que los candidatos mejoren su CV o preparen entrevistas basándose en una oferta de empleo específica.

Este plan nos da una estructura clara para lanzar un portal de empleo de alta calidad y con un gran potencial de crecimiento.
