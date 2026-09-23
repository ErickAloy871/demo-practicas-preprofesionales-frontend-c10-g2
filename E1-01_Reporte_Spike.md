# Reporte de Spike: Pérdida de operaciones offline por fallos de red (E1-01)

## Contexto
El sistema presenta un problema donde las operaciones realizadas offline (como registro de horas, documentos, evaluaciones, etc.) se pierden por completo si ocurre un fallo de red o error de servidor justo en el momento en que se intenta sincronizar (hacer push) con el backend.

## Evidencia
Se ha creado un test en `src/offline/sync/push.spec.ts` llamado `pierde las operaciones de la cola si la red falla durante pushOutbox (E1-01)` que demuestra y reproduce este problema inyectando un error simulado en la capa de red (`api`).

El test falla actualmente, confirmando la hipótesis de pérdida de datos.

## Análisis Técnico del Problema
El problema ocurre en la función `pushOutbox` (`src/offline/sync/push.ts`), debido al orden incorrecto de las operaciones.

**Orden actual de las operaciones (que causa la pérdida):**
1. **Lectura:** Se leen las operaciones pendientes de la cola local (`db.outbox`).
2. **Borrado prematuro:** Las operaciones **se borran de la cola local** (`await db.outbox.bulkDelete(...)`).
3. **Petición de red:** Se intenta enviar las operaciones al servidor mediante una petición a la API.
4. **Procesamiento de resultados:** Si la petición es exitosa, se procesan los resultados.

**¿Qué pasa si la red falla en el paso 3?**
Si la petición a la API lanza un error (falla la red o error 5xx), el flujo se interrumpe y lanza una excepción. Como las operaciones ya fueron borradas de la base de datos local en el paso 2, **se pierden para siempre**. No pueden ser reintentadas en el futuro porque la cola local ya está vacía.

## Alcance del Problema
**¿Afecta también a documentos y evaluaciones, o solo a horas?**
El problema **afecta a todas las entidades** del sistema que utilizan este mecanismo de sincronización offline (horas, documentos, evaluaciones, etc.).

La función `pushOutbox` procesa todos los registros de la tabla `outbox` de manera genérica:
```typescript
  const ops = entries.map((e) => ({
    clientOpId: e.clientOpId,
    entity: e.entity, // <--- Aquí puede ser 'hourLog', 'document', 'evaluation', etc.
    op: e.op,
    // ...
```
Al hacer un `bulkDelete` prematuro de las entradas obtenidas de la base de datos, cualquier tipo de entidad (`entity`) se elimina antes de confirmar su envío exitoso.

## Conclusión
Para solucionar este problema de forma segura, el orden debe invertirse: se debe enviar la petición al servidor primero, y **solo después de confirmar** que el servidor procesó (o rechazó permanentemente) las operaciones, se deben borrar del `outbox` o marcar con su nuevo estado.
