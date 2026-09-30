# MARCO JURÍDICO NOTARIAL Y FORMATOS (GUATEMALA)

## 1. Fundamentos Legales
- **Código de Notariado (Decreto 314 del Congreso de la República de Guatemala):**
  - **Artículo 29:** Requisitos solemnes del instrumento público (número de orden, lugar y fecha, nombres de otorgantes, edad, estado civil, nacionalidad, profesión, domicilio, DPI/CUI, fe de conocimiento o testigos de conocimiento, otorgamiento y firma).
  - **Artículo 30:** Prohibición del uso de abreviaturas o cifras (todos los números y cantidades deben expresarse en letras en la redacción notarial matriz).
  - **Artículo 31:** Requisitos esenciales y causas de nulidad instrumental.
- **Constitución Política de la República de Guatemala:**
  - **Artículo 31 (Habeas Data):** Toda persona tiene derecho a conocer lo que de ella conste en archivos y registros estatales, y la finalidad de dicha información.
- **Código Civil (Decreto Ley 106):**
  - Regulación de los contratos de compraventa de bienes inmuebles, donaciones entre vivos y arrendamientos.
- **Código de Comercio (Decreto 2-70):**
  - Requisitos constitutivos para sociedades anónimas y de responsabilidad limitada.

## 2. Tipos de Instrumentos Notariales Base
1. **Compraventa de Bien Inmueble:**
   - Requiere datos registrales completos: Finca, Folio, Libro y Departamento/Municipio.
   - Declaración de gravámenes, anotaciones o limitaciones.
   - Precio en quetzales (o moneda pactada), forma de pago y consentimiento expreso.
2. **Donación entre Vivos:**
   - Estimación formal del bien donado.
   - Aceptación expresa del donatario en el mismo acto o instrumento posterior.
3. **Arrendamiento:**
   - Especificación detallada del bien, plazo, monto de la renta mensual, depósito y causales de rescisión.
4. **Protocolación de Matrimonio:**
   - Incorporación al protocolo del acta notarial de matrimonio, certificación de atestados de nacimiento y régimen económico capitular.
5. **Constitución de Sociedad:**
   - Socios fundadores, denominación o razón social, objeto, capital social (autorizado, suscrito y pagado), aportaciones y nombramiento de representante legal.

## 3. Invariantes de Datos y Validaciones Registrales
- **DPI (CUI):** Siempre 13 caracteres numéricos (`string`). Los primeros 4 dígitos corresponden al código secuencial personal, los siguientes 5 al identificador único y los últimos 4 al código geográfico (Departamento [2 dígitos] + Municipio [2 dígitos]). Prohibido almacenar como entero.
- **NIT:** Siempre `string`. Formato alfanumérico (ejemplo: `1234567-8` o `CF`).
- **Valores Monetarios:** Procesamiento obligatorio con `decimal.Decimal` para montos, honorarios, impuestos y cálculos de aranceles. Prohibido usar `float`.
- **Datos Registrales:** Validación cruzada obligatoria entre los campos Finca, Folio, Libro y el Departamento correspondiente al Registro General de la Propiedad (Zona Central o Segundo Registro en Quetzaltenango).
