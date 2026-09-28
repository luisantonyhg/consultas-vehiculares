# Arquitectura de la consulta unificada

## Contrato que se conserva

- `/consulta` contiene los modos placa y DNI en una sola vista. El formulario, los IDs de los elementos y los nombres de los eventos siguen iguales.
- Placa usa `PUBLIC_BACKEND_URL`, el ticket de `/consultations`, el plan de ejecución del backend y las llamadas de `src/services/api.js`. DNI usa exclusivamente `/dni/stream/{dni}` mediante `EventSource`.
- Los resultados de placa se pintan en `#results-section`; los de DNI en `#dni-results-section`. El cambio de modo solo modifica visibilidad y campos; no transforma un resultado de un dominio en otro.
- El backend decide los límites del plan de placa. El frontend mantiene su límite conservador de un navegador pesado y respeta dependencias y orden de `src/services/execution_plan.js`.
- Los IDs de tarjetas, nombres de sección, headers de ticket, reintentos manuales y enlaces de fuente son contratos. Cambiarlos exige una prueba específica y una comprobación en navegador.

## Propiedad de cada sección

| Área | Archivos | Responsabilidad |
| --- | --- | --- |
| Ruta | `src/pages/consulta.astro` | Metadatos, composición de componentes y entrada del controlador. |
| Búsqueda unificada | `src/components/consulta/ConsultationHero.astro` | Banner, formulario, selector placa/DNI, escáner y CAPTCHA visual. Los IDs los consumen los controladores. |
| Modo DNI | `src/scripts/dni/dni-controller.ts`, `dni-stream-client.ts`, `dni-state.ts`, `src/components/DniResults.astro` | Selección de modo, consulta SSE, estado y tarjetas de identidad, SUNAT, JNE, MTC, MINEDU, OSCE, INFOGOB y WebMii. |
| Modo placa | `src/scripts/consulta/consulta-controller.ts` | Ticket, ciclo de consulta, coordinación de secciones, reintentos, caché efímera y acciones de modales. |
| Transporte placa | `src/services/api.js`, `transport.js` | HTTP y headers del backend. La UI no redefine las rutas. |
| Política de ejecución placa | `src/services/execution_plan.js`, `execution_scheduler.js` | Orden, dependencias y límites de concurrencia. |
| Tarjetas iniciales placa | `src/ui/vehicle_results.ts` | Estructura e inicialización visual de todas las tarjetas, sin solicitudes HTTP. |
| Puntuación placa | `src/services/vehicle_score.js`, `src/ui/vehicle_score_card.ts` | Cálculo puro y presentación de la puntuación. |
| Caché de placa | `src/services/result_cache.ts` | Guarda y restaura resultados en memoria durante 5 minutos; solo almacena placas confirmadas por SUNARP. |
| Renderers placa | `src/utils/renderers.js` y `src/utils/renderers/*` | Presentación de respuestas por proveedor. |
| Modales | `src/components/consulta/ConsultationOverlays.astro`, `src/ui/document_viewer.ts`, `src/ui/*modal*` | Estructura, apertura y acciones del documento. |
| Estilos y pie | `src/styles/consulta.css`, `src/components/consulta/ConsultationFooter.astro` | Estilo global de la ruta, impresión, exportación y pie. |

## Orden de placa que no se debe alterar por una extracción visual

1. Validar la placa con SUNARP y reservar/usar el ticket vigente.
2. Iniciar las fuentes rápidas conforme al plan y la capacidad admitida.
3. Ejecutar las fuentes de fondo y avanzadas con dependencias; SAT unificado precede a Lima/Municipal, el historial sigue a Municipal, Lunas va tras el historial y SBS al final.
4. Mostrar resultados útiles antes de que terminen las fuentes lentas; conservar fallos parciales, el score y el reintento individual.
5. Liberar el ticket después del cierre de las tareas finales y conservar la ventana para reintentos manuales permitidos.

## Siguientes cortes del controlador vehicular

El controlador vehicular todavía concentra coordinación y estado mutable. El próximo corte debe hacerse en este orden, con una prueba de comportamiento antes y después de cada paso:

1. Extraer la política de reintentos y de tickets; conservar headers `X-Consultation-Ticket`, `X-Manual-Retry` y la generación contra callbacks tardíos.
2. Extraer adaptadores por proveedor en grupos: registro y valor, SOAT/CITV/SBS, tránsito/SAT, combustible, documentos. Cada adaptador recibe el contexto de consulta; no lee estado global de otra sección.
3. Extraer el ciclo de consulta y la cola de secciones manteniendo `execution_plan.js` como única fuente del orden.
4. Extraer exportación, sin cambiar HTML o contratos del backend.

En cada corte: `tsc --noEmit`, `npm test`, `astro build`, y una prueba manual de placa válida, placa inexistente, DNI con registros, cambio de modo y reintento de una sola tarjeta.
