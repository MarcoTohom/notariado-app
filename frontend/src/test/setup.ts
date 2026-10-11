import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom no implementa la descarga de binarios: `URL.createObjectURL` y
// `revokeObjectURL` existen como stubs que lanzan, y `Blob.prototype.text`
// puede faltar en versiones antiguas. Los sustitutos permiten probar
// `downloadAuthenticated` (descargas autenticadas por JWT) sin tocar código
// de producción.
beforeEach(() => {
  if (!URL.createObjectURL) {
    Object.defineProperty(URL, "createObjectURL", {
      writable: true,
      configurable: true,
      value: () => "blob:test",
    });
  }
  if (!URL.revokeObjectURL) {
    Object.defineProperty(URL, "revokeObjectURL", {
      writable: true,
      configurable: true,
      value: () => undefined,
    });
  }
  if (typeof Blob !== "undefined" && !Blob.prototype.text) {
    Object.defineProperty(Blob.prototype, "text", {
      writable: true,
      configurable: true,
      value: function text(this: Blob) {
        return new Response(this).text();
      },
    });
  }
});

afterEach(() => {
  cleanup();
});
