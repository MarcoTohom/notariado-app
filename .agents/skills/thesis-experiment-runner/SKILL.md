---
name: thesis-experiment-runner
description: Procedimiento para la generación de 100 casos sintéticos distribuidos y la ejecución del experimento de medición de tiempos de revisión notarial.
---

# Procedimiento del Experimento de Tesis UMG

## 1. Generación de Casos Sintéticos (100 Casos)
Ejecutar el script generador en backend (`seed_synthetic.py`):
- **Estratificación obligatoria:**
  - 20 casos de Compraventa de inmueble.
  - 20 casos de Donación entre vivos.
  - 20 casos de Arrendamiento.
  - 20 casos de Protocolación de matrimonio.
  - 20 casos de Constitución de sociedad.
- **Inyección de Inconsistencias Controladas:**
  - Aproximadamente el 50% de los casos deben contener anomalías premeditadas (DPI discordante, NIT erróneo, nombre mal escrito, fecha inconsistente, sumatoria errónea en aportaciones, inciso repetido o faltante).
  - El restante 50% de los casos deben ser íntegros y válidos.
- **Privacidad:** Todos los nombres, identificadores y direcciones deben ser generados sintéticamente (utilizando bibliotecas como `Faker` con localización en español). Prohibido utilizar datos personales reales.

## 2. Registro y Medición de Tiempos
Para cada ejecución de prueba:
1. Registrar `test_case_id`, el método evaluado (`TRADITIONAL` vs. `SYSTEM`), timestamp de inicio y timestamp de finalización.
2. Contabilizar:
   - Inconsistencias detectadas.
   - Inconsistencias omitidas.
   - Tiempo neto de resolución y corrección (en minutos y segundos).
3. Calcular métricas estadísticas:
   - Tiempo promedio tradicional ($\mu_{\text{tradicional}}$).
   - Tiempo promedio con el sistema ($\mu_{\text{sistema}}$).
   - Porcentaje real de reducción:
     $$\text{Reducción} = \left(\frac{\mu_{\text{tradicional}} - \mu_{\text{sistema}}}{\mu_{\text{tradicional}}}\right) \times 100$$
4. Publicar los resultados de manera dinámica en el **Dashboard Experimental** y permitir la exportación a formato XLSX/CSV para la redacción del Capítulo IV de la tesis (Análisis y Discusión de Resultados).
