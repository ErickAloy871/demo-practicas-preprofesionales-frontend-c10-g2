# Problemas conocidos

Lo que sabemos que está mal y no alcanzamos a arreglar antes de entregar esto.

Si encuentras algo que no está acá, agrégalo. Casi seguro hay más. No tuvimos tiempo de
auditar todo el repo, solo de anotar lo que nos mordió mientras construíamos.

## D-06 · Resuelto: validación diaria de horas unificada

La auditoría encontró cinco copias, no tres: el DTO del backend permitía hasta 12 h; la
creación y la exportación del servicio cortaban en 10 h; y este formulario repetía dos
funciones con tope de 8 h. La sincronización tampoco verificaba el límite.

La coordinación confirmó que las actividades de un estudiante se suman por fecha, incluso
entre plazas, y no pueden superar 8 h diarias. El formulario usa una única regla y mensaje
en `src/lib/hour-log-validation.ts`; el backend tiene la misma configuración en
`src/hour-log/hour-log.validation.ts` y también la aplica al sincronizar.

## D-08 · El indicador de sync miente por una ventana corta

`src/offline/sync/status.ts`, `src/offline/sync/scheduler.ts`.

Cuando termina un push, `runSync` llama `setStatus({ syncing: false, lastSyncAt: ... })`.
En ese momento el indicador ya se pinta como sincronizado. El contador de `pending` se
recalcula aparte, en un `await db.outbox.count()` una línea después. Entre esas dos
llamadas hay una vuelta al event loop en la que el estado en memoria dice "ya terminé" con
un contador de pendientes que todavía no se actualizó. Es una ventana de milisegundos, no
la vas a notar mirando la pantalla, pero si escribes un test que aserte sobre el orden de
los estados del indicador, la vas a agarrar. No nos alcanzó a arreglar. Hay que juntar
ambos `setStatus` en uno solo, o calcular `pending` antes de marcar `syncing: false`.

## D-09 · Resuelto: formulario de horas separado (G2-26)

`src/components/HourLogForm.tsx` presenta los campos y comunica eventos. La lógica vive
en `src/features/hour-log-form/`: `state.ts` contiene las transiciones y la validación
del formulario, `format.ts` los textos de fecha y duración, `operation.ts` construye el
registro y la operación, y `submit.ts` coordina el envío. Estas funciones se prueban sin
montar React y reutilizan la regla unificada de D-06, sin copiar sus límites.

`useHourLogForm.ts` conecta esa lógica con React y con la lectura reactiva de Dexie.
`storage.ts` conserva la transacción atómica de registro y outbox para guardar sin red.
Los campos visuales se separan en `HourLogFormFields.tsx` y `HourLogField.tsx`.
Todos los archivos extraídos, incluidos sus tests, tienen como máximo 150 líneas.
Las pruebas de integración comprueban el registro desde el formulario sin conexión,
la persistencia al reabrir IndexedDB y la reversión si falla el encolado.

## D-10 · Resuelto: tests de los hooks que leen de la base local (Dexie / IndexedDB)

`src/offline/hooks/`: `useHourLogs.spec.ts`, `usePlacement.spec.tsx`, `useSyncStatus.spec.ts`, junto con `useOnline.spec.ts`.

Se añadieron pruebas automatizadas con `fake-indexeddb` ejercitando lecturas reales contra Dexie sin falsear los hooks. Las pruebas cubren el estado de carga inicial (`undefined`), datos presentes y colección vacía (`[]` o `null`), además de reactividad en tiempo real y aislamiento completo entre casos (`await db.delete()`, `await db.open()`), alcanzando el 100% de cobertura en la carpeta.
