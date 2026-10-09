import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import path from "node:path";

const python = path.resolve("../backend/.venv/Scripts/python.exe");
const docxHelper = path.resolve("../backend/tests/support/docx_cli.py");

test("cargar DOCX, capturar, validar y conservar dos borradores descargables por API autenticada", async ({ page, request }) => {
  await page.goto("/plantillas");
  await page.getByRole("button", { name: "Iniciar Sesión", exact: true }).first().click();
  await page.getByLabel(/Usuario o Correo/i).fill("e2e_sintetico");
  await page.getByLabel("Contraseña").fill("Synthetic-test-42!");
  await page.getByLabel("Contraseña").press("Enter");
  await expect(page.getByRole("button", { name: "Nueva Plantilla" })).toBeVisible();
  const token = await page.evaluate(() => localStorage.getItem("notariado_token"));
  const headers = { Authorization: `Bearer ${token}` };
  const api = "http://127.0.0.1:8011/api/v1";

  const person = await request.post(`${api}/clients`, { headers, data: {
    first_name: "Carlos Sintetico", last_name: "Mendez", dpi: "0000000000301", nit: "00126-K",
  } });
  expect(person.status()).toBe(201);
  const caseResponse = await request.post(`${api}/cases`, { headers, data: {
    title: "Expediente Sintético DOCX Integral", case_type: "COMPRAVENTA",
    parties: [{ client_id: (await person.json()).id, party_role: "COMPRADOR" }],
  } });
  expect(caseResponse.status()).toBe(201);
  const caseId = (await caseResponse.json()).id;

  await page.getByRole("button", { name: "Nueva Plantilla" }).click();
  const upload = page.getByRole("dialog", { name: "Cargar Plantilla DOCX" });
  await upload.getByLabel(/Nombre de la Plantilla/).fill("Plantilla Sintética Integral");
  await upload.getByLabel(/Tipo de Escritura/).selectOption("COMPRAVENTA");
  await upload.getByLabel("Archivo DOCX", { exact: false }).setInputFiles({
    name: "integral_sintetico.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer: execFileSync(python, [docxHelper, "template"]),
  });
  const uploaded = page.waitForResponse(response => response.url().endsWith("/templates") && response.request().method() === "POST");
  await upload.getByRole("button", { name: "Cargar Plantilla", exact: true }).click();
  const templateResponse = await uploaded;
  expect(templateResponse.status()).toBe(201);
  const template = await templateResponse.json();
  const versionId = template.versions[0].id;
  await expect(upload).toBeHidden();
  await page.getByRole("row").filter({ hasText: "Plantilla Sintética Integral" }).getByTitle("Versiones, variables y render de prueba").click();
  const detail = page.getByRole("dialog", { name: "Plantilla Sintética Integral" });
  await detail.getByRole("button", { name: "Activar esta versión" }).click();
  await expect(detail.getByRole("button", { name: "Activar esta versión" })).toBeHidden();
  await detail.getByRole("button", { name: "Probar render" }).click();
  await expect(detail).toContainText("Render verificado: cero placeholders residuales");
  await detail.getByRole("button", { name: "Cerrar", exact: true }).click();

  const values: Record<string, string> = {
    numero_escritura: "151", comprador_nombre: "Carlos Sintetico Mendez",
    comprador_dpi: "0000000000301", comprador_nit: "00126-K",
    finca_registral: "12345", folio_registral: "678", libro_registral: "12",
  };
  await page.goto(`/formularios?expediente=${caseId}`);
  await page.getByRole("combobox", { name: "Formulario y versión", exact: true }).selectOption(versionId);
  await expect(page.getByRole("button", { name: "Guardar datos" })).toBeVisible();
  for (const field of template.versions[0].fields) {
    await page.getByLabel(field.label, { exact: true }).fill(values[field.key]);
  }
  await page.getByRole("button", { name: "Guardar datos" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Datos guardados" })).toBeVisible();

  await page.goto("/expedientes");
  const caseRow = page.getByRole("row").filter({ hasText: "Expediente Sintético DOCX Integral" });
  await caseRow.getByTitle("Validar consistencia documental (RULE-001..020)").click();
  const validation = page.getByRole("dialog", { name: "Validación de Consistencia Documental" });
  await validation.getByLabel("Formulario y versión a evaluar").selectOption(versionId);
  const validated = page.waitForResponse(response => response.url().endsWith("/validations/run"));
  await validation.getByRole("button", { name: "Ejecutar validación" }).click();
  const validationResponse = await validated;
  expect(validationResponse.status()).toBe(201);
  expect((await validationResponse.json()).critical_count).toBe(0);
  await expect(validation).toContainText("Corrida actual");
  await validation.getByRole("button", { name: "Cerrar", exact: true }).click();

  const drafts = [];
  for (const number of [151, 152]) {
    if (number === 152) {
      const saved = await request.get(`${api}/fields/cases/${caseId}/versions/${versionId}`, { headers });
      const current = await saved.json();
      const revised = await request.put(`${api}/fields/cases/${caseId}/versions/${versionId}`, {
        headers, data: { revision: current.revision, values: { ...current.values, numero_escritura: "152" } },
      });
      expect(revised.status()).toBe(200);
    }
    await caseRow.getByTitle("Generar borrador DOCX verificado").click();
    const generation = page.getByRole("dialog", { name: "Generar Borrador DOCX" });
    await generation.getByLabel("Plantilla (versión ACTIVA)").selectOption(versionId);
    await generation.getByLabel("Notas de la versión (opcional)").fill(`Prueba sintética ${number}`);
    const generated = page.waitForResponse(response => response.url().endsWith("/documents/generate"));
    await generation.getByRole("button", { name: "Generar y verificar borrador" }).click();
    const result = await generated;
    expect(result.status()).toBe(201);
    const draft = await result.json();
    const latest = draft.versions[0];
    expect(latest.placeholders_free).toBe(true);
    expect(latest.residual_variables).toEqual([]);
    drafts.push(draft);
    await expect(generation).toContainText("Verificada — sin placeholders");
    const download = await request.get(`http://127.0.0.1:8011${latest.download_url}`, { headers });
    expect(download.status()).toBe(200);
    expect(JSON.parse(execFileSync(python, [docxHelper, "verify", String(number)], { input: await download.body(), encoding: "utf8" }))).toEqual({ residuals: 0, expected_values: true });
    await generation.getByRole("button", { name: "Cerrar", exact: true }).click();
  }
  expect(drafts[1].id).toBe(drafts[0].id);
  expect(drafts[1].versions_count).toBe(2);
  expect(drafts[1].versions[1].file_hash).toBe(drafts[0].versions[0].file_hash);
  const firstAgain = await request.get(`http://127.0.0.1:8011${drafts[0].versions[0].download_url}`, { headers });
  expect(firstAgain.status()).toBe(200);
  execFileSync(python, [docxHelper, "verify", "151"], { input: await firstAgain.body() });

  await page.goto("/documentos");
  await page.getByRole("row").filter({ hasText: drafts[1].title }).getByTitle("Ver historial de versiones y descargar").click();
  const history = page.getByRole("dialog");
  await expect(history).toContainText("Versión v1");
  await expect(history).toContainText("Versión v2");
  await expect(history.getByRole("link", { name: "Descargar", exact: true })).toHaveCount(2);
});
