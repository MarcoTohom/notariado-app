# DIRECTRICES ARQUITECTÓNICAS DE FRONTEND

## 1. Stack Técnico
- **Framework:** React 18+ con TypeScript.
- **Bundler:** Vite.
- **Enrutamiento:** React Router 6+.
- **Estilos:** Tailwind CSS con componentes modulares inspirados en shadcn/ui.
- **Formularios Dinámicos:** React Hook Form + Zod.
- **Gestión de Estado y API:** TanStack Query (React Query) + Axios.
- **Iconografía:** Lucide React.
- **Pruebas:** Vitest + React Testing Library.

## 2. Componentes Dinámicos Tipados
El núcleo de la interfaz es el componente `DynamicForm`, el cual debe renderizar controles especializados según `field_type`:
- `TextInput` / `TextArea`
- `NameInput` (soporte tildes, apellidos compuestos, normalización)
- `DpiInput` (máscara 13 dígitos, validación de formato CUI)
- `NitInput` (máscara y formato guatemalteco)
- `CurrencyInput` (manejo de Quetzales `Q` y dólares con 2 decimales)
- `DateInput` / `DateTimeInput`
- `SelectInput`
- `RelationInput` (búsqueda y autocompletado de cliente/expediente)
- `ListInput` (colecciones dinámicas de comparecientes/accionistas)
- `ComputedInput` (solo lectura, cálculo dinámico)

## 3. Panel de Inconsistencias Notariales
La interfaz debe contar con un panel interactivo de inconsistencias que muestre:
- Severidad (`CRITICAL`, `ERROR`, `WARNING`, `INFO`).
- Mensaje descriptivo del fallo.
- Valor actual encontrado en el documento vs. valor esperado (según expediente o catálogo).
- Acción directa de "Ir al campo" para corregir en el formulario.
