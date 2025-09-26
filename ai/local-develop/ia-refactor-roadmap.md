
# Hoja de Ruta: Refactorización del Sistema de Agentes IA "Valeria"

## Objetivo General

Reconstruir el núcleo del sistema de chat de IA para que sea robusto, predecible, fácil de depurar y esté alineado con las mejores prácticas de Genkit. Esto resolverá los problemas actuales de fallos silenciosos y sentará una base sólida para futuras expansiones como el RAG y la integración de nuevas herramientas.

---

## Arquitectura Propuesta

1.  **Capa de Presentación (UI):** Componentes de React (`ChatWidget`, Paneles de Admin) que solo se encargan de mostrar datos y capturar la entrada del usuario. No tienen lógica de negocio sobre qué agente usar.

2.  **Capa de API (Controlador):** El `ChatController` (`chat.controller.ts`) actúa como único punto de entrada. Verifica al usuario, determina su plan (Gratis, Premium) o si está en modo "Laboratorio", y decide qué configuración de agente se debe cargar.

3.  **Capa de Orquestación (Flujo de Genkit):** Un único y limpio `migration-chat-flow.ts`. Recibe la configuración del agente desde el controlador y orquesta la llamada a la IA, incluyendo el uso de herramientas. Es agnóstico a los planes de usuario.

4.  **Capa de Herramientas (Habilidades):** Herramientas de Genkit como `knowledgeBaseSearch.ts`. Son funciones aisladas que realizan una tarea específica (buscar en la base de datos vectorial) sin conocer el contexto general de la conversación.

---

## Plan de Acción por Pasos

### Paso 1: Reconstruir el Flujo de Chat (`migration-chat-flow.ts`)

*   **Objetivo:** Crear un flujo de Genkit simple y robusto que siga la documentación al pie de la letra.
*   **Acciones:**
    1.  Simplificar el `inputSchema` del flujo para que acepte el historial, el mensaje actual, el `systemPrompt` y el `model` directamente.
    2.  Llamar a `ai.generate()` pasándole el `systemPrompt` en su campo `system` y el historial de chat correctamente mapeado.
    3.  Asegurarse de que las `tools` (como `knowledgeBaseSearch`) se pasen correctamente en la llamada a `ai.generate()`.
    4.  Mejorar el manejo de errores para que, si la IA falla, devuelva un error específico en lugar de un mensaje genérico.

### Paso 2: Fortalecer el Adaptador del Agente (`genkit-agent.adapter.ts`)

*   **Objetivo:** Hacer que el adaptador sea el "director de orquesta" que elige la configuración correcta y llama al nuevo flujo.
*   **Acciones:**
    1.  Implementar la lógica para obtener el `claim` (`valeria_plan`) del usuario autenticado o detectar si es un administrador en el laboratorio.
    2.  Basado en ese contexto, cargar la configuración del agente correcta (`global` o `valeria_premium`) desde la colección `agentConfig` en Firestore.
    3.  Llamar al `migration-chat-flow` del Paso 1, pasándole la configuración que acaba de cargar.

### Paso 3: Implementar la Búsqueda en la Base de Conocimiento (RAG - Parte 1)

*   **Objetivo:** Crear y validar la herramienta que permite a la IA buscar en nuestros documentos.
*   **Acciones:**
    1.  Refinar la herramienta `knowledgeBaseSearch` en `knowledge-base-search.ts`.
    2.  La herramienta usará el SDK de Admin de Firestore y la función `findNeighbors` para realizar la búsqueda vectorial en la colección `knowledge_base`.
    3.  Asegurarse de que el `systemPrompt` del agente `valeria_premium` instruya claramente a la IA para que **use esta herramienta** cuando reciba preguntas que requieran conocimiento específico.

### Paso 4: Implementar el Análisis de Documentos en Sesión (RAG - Parte 2)

*   **Objetivo:** Permitir a los usuarios Premium subir un documento y que la IA pueda conversar sobre él.
*   **Acciones:**
    1.  Modificar el `PostMessageUseCase` para que, si recibe un archivo, lo procese: lo divida en fragmentos y lo guarde en la colección `knowledge_base` con metadatos especiales (`source: 'user_session'`, `sessionId: '...'`).
    2.  Actualizar la herramienta `knowledgeBaseSearch` para que, si recibe un `sessionId`, busque tanto en los documentos globales (`admin_kb`) como en los específicos de esa sesión.
    3.  Actualizar el `systemPrompt` del agente Premium para que entienda que puede haber documentos específicos de la sesión.

### Paso 5: Pruebas y Limpieza Final

*   **Objetivo:** Validar todo el flujo y limpiar el código obsoleto.
*   **Acciones:**
    1.  Probar exhaustivamente desde el "Agent Lab" y como un usuario normal (gratuito y premium).
    2.  Verificar que la subida y consulta de documentos en sesión funciona.
    3.  Eliminar archivos y código que hayan quedado obsoletos tras esta refactorización.
