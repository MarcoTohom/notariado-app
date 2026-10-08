import { test, expect } from "@playwright/test";

test("configurar, completar, recalcular y recuperar datos de una escritura", async ({
  page,
  request,
}) => {
  const login = await request.post("http://127.0.0.1:8011/api/v1/auth/login", {
    data: {
      username_or_email: "e2e_sintetico",
      password: "Synthetic-test-42!",
    },
  });
  expect(login.ok()).toBeTruthy();
  const auth = { Authorization: `Bearer ${(await login.json()).access_token}` };
  const api = "http://127.0.0.1:8011/api/v1";
  const person = await request.post(`${api}/clients`, {
    headers: auth,
    data: {
      first_name: "María Sintética",
      last_name: "de la Peña",
      dpi: "0000000000101",
      nit: "00123-K",
      address: "Dirección sintética",
      marital_status: "SOLTERO",
    },
  });
  expect(person.ok()).toBeTruthy();
  const caseResponse = await request.post(`${api}/cases`, {
    headers: auth,
    data: { title: "Compraventa sintética E2E", case_type: "COMPRAVENTA" },
  });
  expect(caseResponse.ok()).toBeTruthy();
  const caseId = (await caseResponse.json()).id;
  await page.goto("/formularios");
  await page
    .getByRole("button", { name: "Iniciar Sesión", exact: true })
    .first()
    .click();
  await page.getByLabel(/Usuario o Correo/i).fill("e2e_sintetico");
  await page.getByLabel(/Contraseña/).fill("Synthetic-test-42!");
  await page.getByLabel(/Contraseña/).press("Enter");
  await expect(
    page.getByRole("heading", { name: "Formularios de escritura" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Nuevo formulario" }).click();
  await page
    .getByLabel("Nombre", { exact: true })
    .fill("Formulario creado en navegador");
  await page.getByLabel("Etiqueta", { exact: true }).fill("Observaciones");
  await page.getByLabel("Clave del campo").fill("observaciones");
  await page.getByRole("button", { name: "Guardar versión" }).click();
  await expect(page.getByLabel("Formulario y versión")).toContainText(
    "Formulario creado en navegador",
  );

  // Configure all twenty types through the same persisted definition API consumed by the editor.
  const f = (key: string, type: string, rest = {}) => ({
    key,
    label: key,
    field_type: type,
    ...rest,
  });
  const definitions = [
    f("texto", "text"),
    f("observaciones", "textarea"),
    f("nombre", "name"),
    f("dpi", "dpi", { readonly: true }),
    f("nit", "nit", { readonly: true }),
    f("telefono", "phone"),
    f("correo", "email"),
    f("cantidad", "integer"),
    f("decimal", "decimal"),
    f("precio", "currency", { required: true }),
    f("porcentaje", "percentage"),
    f("fecha", "date"),
    f("hora", "datetime"),
    f("confirmado", "boolean"),
    f("catalogo", "select", {
      options_json: {
        choices: [
          { label: "Opción activa", value: "a", active: true, order: 0 },
        ],
      },
    }),
    f("cliente", "relation", {
      source: "clients",
      options_json: { autofill: { dpi: "dpi", nit: "nit" } },
    }),
    f("archivo", "file"),
    f("bienes", "list", {
      options_json: {
        fields: [
          f("descripcion", "text", { required: true }),
          f("valor", "currency"),
        ],
      },
    }),
    f("total", "computed", {
      calculation_expression: "precio * cantidad + suma(bienes.valor)",
    }),
    f("notas", "richtext"),
  ];
  const created = await request.post(`${api}/fields/definitions`, {
    headers: auth,
    data: {
      name: "Veinte tipos sintéticos",
      case_type: "COMPRAVENTA",
      fields: definitions,
    },
  });
  expect(created.ok()).toBeTruthy();
  const version = await created.json();
  await page.reload();
  await page.getByLabel("Formulario y versión").selectOption(version.id);
  await page.getByRole("combobox", { name: "Expediente", exact: true }).selectOption(caseId);
  await page.getByLabel("texto", { exact: true }).fill("Texto sintético");
  await page.getByLabel("observaciones", { exact: true }).fill("Dos\nlíneas");
  await page.getByLabel("nombre", { exact: true }).fill("María de la Peña");
  await page.getByLabel("telefono", { exact: true }).fill("5555-0101");
  await page
    .getByLabel("correo", { exact: true })
    .fill("sintetico@example.com");
  await page.getByLabel("cantidad", { exact: true }).fill("2");
  await page.getByLabel("decimal", { exact: true }).fill("0.1234");
  const priceInput = page.getByRole("textbox", { name: "precio *", exact: true });
  await expect(priceInput).toHaveAttribute("aria-required", "true");
  await priceInput.fill("0.10");
  await page.getByLabel("porcentaje", { exact: true }).fill("12");
  await page.getByLabel("fecha", { exact: true }).fill("2026-10-04");
  await page.getByLabel("hora", { exact: true }).fill("2026-10-04T13:45");
  await page.getByLabel("confirmado", { exact: true }).check();
  await page.getByLabel("catalogo", { exact: true }).selectOption("a");
  await page
    .getByRole("option", { name: "María Sintética de la Peña", exact: true })
    .click();
  await expect(page.getByLabel("dpi", { exact: true })).toHaveValue(
    "0000000000101",
  );
  await page
    .getByLabel("archivo", { exact: true })
    .setInputFiles({
      name: "sintetico.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("nombre,valor\nsintetico,1"),
    });
  await expect(
    page.getByText("Descargar archivo", { exact: true }),
  ).toBeVisible();
  await page.getByText("Agregar bienes", { exact: true }).click();
  const descriptions = page.getByRole("textbox", { name: "descripcion *", exact: true });
  await descriptions.fill("Bien Uno");
  await page.getByLabel("valor", { exact: true }).fill("0.10");
  await page.getByText("Agregar bienes", { exact: true }).click();
  await descriptions.nth(1).fill("Bien Dos");
  await page.getByLabel("valor", { exact: true }).nth(1).fill("0.20");
  await page.getByLabel("Subir bienes 2").click();
  await page
    .getByLabel("notas", { exact: true })
    .fill('<p onclick="x">Nota</p>');
  await expect(page.getByLabel("total", { exact: true })).toHaveValue("0.50");
  await expect(page.getByLabel("total", { exact: true })).toHaveAttribute(
    "readonly",
    "",
  );
  await page.getByText("Guardar datos", { exact: true }).click();
  await expect(page.getByText("Datos guardados y validados.")).toBeVisible();
  await page.reload();
  await page.getByLabel("Formulario y versión").selectOption(version.id);
  await page.getByRole("combobox", { name: "Expediente", exact: true }).selectOption(caseId);
  await expect(priceInput).toHaveValue("0.10");
  await expect(
    descriptions.first(),
  ).toHaveValue("Bien Dos");
  await expect(page.getByLabel("notas", { exact: true })).toHaveValue(
    "<p>Nota</p>",
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByText("Descargar archivo", { exact: true }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("sintetico.csv");
  await page.screenshot({
    path: "test-results/phase-four-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/phase-four-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});
