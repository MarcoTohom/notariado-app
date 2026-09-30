# CONTEXTO DE TESIS Y EXPERIMENTACIÓN (UMG)

## 1. Identificación Académica
- **Institución:** Universidad Mariano Gálvez de Guatemala (UMG).
- **Facultad:** Facultad de Ingeniería en Sistemas de Información y Ciencias de la Computación.
- **Curso:** Proyecto de Graduación.
- **Estudiante:** Marco Antonio Lares Tohom.
- **Tema:** Desarrollo de sistema de borradores de escrituras públicas en Python para reducir el tiempo de redacción y revisión de inconsistencias en los datos y congruencia en los incisos en un bufete jurídico.

## 2. Hipótesis General
> "La implementación de un sistema de borradores de escrituras públicas en Python reducirá el tiempo de revisión de la organización de incisos, datos y consistencia documental de 240 minutos a 60 minutos por escritura pública en un bufete jurídico guatemalteco, mediante la validación automatizada de la información y la estandarización de la estructura documental."

## 3. Variables de Investigación
- **Variable Independiente (V1):** Sistema de borradores de escrituras públicas en Python con motor de validación documental y plantillas estructuradas.
- **Variable Dependiente (V2):** Tiempo de revisión y tasa de inconsistencias documentales detectadas en la elaboración de la escritura pública.
- **Línea Base (Baseline):** 240 minutos (4 horas).
- **Meta Experimental:** Aproximadamente 60 minutos (1 hora).

## 4. Diseño del Experimento y Datos Sintéticos
- **Muestra Experimental:** 100 casos sintéticos distribuidos equitativamente (20 por tipo de escritura):
  1. Compraventa de bien inmueble (20 casos).
  2. Donación entre vivos (20 casos).
  3. Arrendamiento (20 casos).
  4. Protocolación de matrimonio (20 casos).
  5. Constitución de sociedad (20 casos).
- **Distribución de Casos de Prueba:** Casos 100% válidos y casos con anomalías deliberadas (errores en DPI, NIT, discordancia de nombres, fechas inválidas, montos contradictorios, fincas/folios/libros erróneos, incisos omitidos o duplicados).
- **Fórmula de Reducción:**
  $$\text{Reducción (\%)} = \left(\frac{T_{\text{tradicional}} - T_{\text{sistema}}}{T_{\text{tradicional}}}\right) \times 100$$
- **Regla Estricta:** Las métricas mostradas en dashboards y reportes deben derivar del cálculo real de las ejecuciones, nunca de valores ficticios estáticos.
