### Propuesta de Hoja de Ruta: Portal de Empleo para Mi Red Colombia

#### Fase 0: Refactorización Arquitectónica del Módulo de Usuarios

- [x] **Análisis de Impacto:** Realizar un análisis completo del código para identificar todas las dependencias del `user.service.ts` y el tipo `UserProfile`.
- [x] **Diseño Hexagonal:**
    - [x] Crear la estructura de directorios: `src/lib/user/domain`, `src/lib/user/application`, `src/lib/user/infrastructure`.
    - [x] Definir la entidad `User` y sus tipos (`UserRole`, etc.) en `src/lib/user/domain/user.models.ts`.
    - [x] Definir los puertos (interfaces) para el repositorio de usuarios en `src/lib/user/domain/user.repository.ts` (e.g., `IUserRepository`).
- [x] **Implementación y Migración:**
    - [x] Crear los casos de uso (servicios de aplicación) en `src/lib/user/application/user.service.ts` (e.g., `UserCreator`, `UserFinder`).
    - [x] Crear el adaptador de infraestructura para Firestore en `src/lib/user/infrastructure/firestore-user.repository.ts`, implementando `IUserRepository`.
    - [x] Crear el adaptador de infraestructura para Firestore (Admin SDK) en `src/lib/user/infrastructure/firestore-admin-user.repository.ts`.
    - [ ] Refactorizar todo el código de la aplicación (componentes de UI, API routes, etc.) para usar los nuevos casos de uso en lugar de llamar directamente al antiguo `user.service.ts`.
    - [ ] Eliminar el antiguo `src/services/user.service.ts` una vez que la migración esté completa y verificada.
- [x] **Actualización del Modelo de Datos:**
    - [x] Modificar la entidad `User` para que el campo `role` sea `roles: UserRole[]`.
    - [x] Actualizar los casos de uso y el repositorio para manejar el array de roles.

---

#### Fase 1: MVP - Cimientos y Flujo Principal

1.  **Backend/Core:**
    - [ ] Implementar el middleware de permisos que verifique los `roles` del usuario.
    - [ ] Crear los servicios (casos de uso) y repositorios para `JobPosting` y `CompanyProfile` (CRUD básico) siguiendo la arquitectura hexagonal.
2.  **Frontend (Empleador):**
    - [ ] Crear un formulario simple en el dashboard para crear/editar el perfil de su empresa.
    - [ ] Crear un formulario para publicar una nueva oferta de empleo.
    - [ ] Una vista en su dashboard para listar las ofertas que ha publicado.
3.  **Frontend (Candidato):**
    - [ ] Crear la página pública `portal-empleo` que lista todas las ofertas activas.
    - [ ] Crear la página de detalle de la oferta `portal-empleo/[jobId]`.
    - [ ] Implementar el botón "Aplicar".

#### Fase 2: Paneles de Gestión y Experiencia de Usuario

- [ ] **Backend/Core:** Desarrollar los servicios para gestionar aplicaciones (`updateStatus`, etc.).
- [ ] **Frontend (Empleador):** Panel para ver y gestionar candidatos por oferta.
- [ ] **Frontend (Candidato):** Panel "Mis Postulaciones" y perfil de usuario mejorado.

#### Fase 3: Notificaciones y Monetización

- [ ] **Backend/Core:** Integrar servicio de email y triggers para notificaciones.
- [ ] **Frontend (General):** Integrar notificaciones en la UI.
- [ ] **Monetización:** Implementar "Publicación Destacada" con Stripe.

#### 4. **Ideas para Expansión Futura**

*   Matching con IA.
*   Integración con Calendario.
*   Perfiles de Empresa Avanzados.
*   Sistema de Referidos.
*   Analíticas para Empleadores.
*   Planes de Suscripción.
