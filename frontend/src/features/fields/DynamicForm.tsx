import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { getApiErrorMessage } from "../../services/api";
import { fieldsApi } from "./api";
import { DynamicFields, FileActivityContext } from "./FieldControls";
import { defaults, formSchema } from "./validation";
import {
  FieldDefinition,
  FieldIssue,
  FormVersion,
  SavedValues,
  Values,
} from "./types";

export function DynamicForm({
  version,
  caseId,
  initial,
  readOnly = false,
  onSaved,
}: {
  version: FormVersion;
  caseId: string;
  initial: SavedValues;
  readOnly?: boolean;
  onSaved?: (saved: SavedValues) => void;
}) {
  const schema = useMemo(() => formSchema(version.fields), [version.fields]);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: defaults(version.fields, initial.values),
    mode: "onChange",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [calculating, setCalculating] = useState(false);
  const [uploads, setUploads] = useState(0);
  const fileActivity = useCallback(
    (delta: number) => setUploads((value) => value + delta),
    [],
  );
  const revision = useRef(initial.revision),
    epoch = useRef(0);
  const { watch, setValue, getValues, reset, setError: markError } = form;
  useEffect(() => {
    reset(defaults(version.fields, initial.values));
    revision.current = initial.revision;
  }, [initial, reset, version.fields]);
  useEffect(() => {
    if (readOnly) return;
    let timer: ReturnType<typeof setTimeout>;
    let mounted = true;
    const schedule = () => {
      const ticket = ++epoch.current;
      clearTimeout(timer);
      timer = setTimeout(async () => {
        setCalculating(true);
        try {
          const result = await fieldsApi.validate(
            caseId,
            version.id,
            getValues(),
          );
          if (!mounted || ticket !== epoch.current) return;
          const apply = (
            defs: FieldDefinition[],
            values: Values,
            prefix = "",
          ) => {
            const targets = new Set(
              defs.flatMap((f) => Object.keys(f.options_json?.autofill || {})),
            );
            for (const f of defs) {
              const path = `${prefix}${f.key}`,
                value = values[f.key];
              if (
                (f.calculated ||
                  f.field_type === "computed" ||
                  targets.has(f.key)) &&
                value !== undefined &&
                getValues(path) !== value
              )
                setValue(path, value ?? "", { shouldValidate: true });
              if (f.field_type === "list" && Array.isArray(value))
                value.forEach((item, i) =>
                  apply(f.options_json?.fields || [], item, `${path}.${i}.`),
                );
            }
          };
          apply(version.fields, result.values);
          const computedKeys = new Set(
            version.fields
              .filter((f) => f.calculated || f.field_type === "computed")
              .map((f) => f.key),
          );
          for (const issue of result.errors)
            if (computedKeys.has(issue.path))
              markError(issue.path, { type: "server", message: issue.message });
          setError("");
        } catch (e) {
          if (mounted && ticket === epoch.current)
            setError(
              getApiErrorMessage(e, "No se pudo recalcular el formulario."),
            );
        } finally {
          if (mounted) setCalculating(false);
        }
      }, 300);
    };
    const subscription = watch(schedule);
    schedule();
    return () => {
      mounted = false;
      ++epoch.current;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [caseId, version, readOnly, watch, setValue, getValues, markError]);

  const submit = async (values: Values) => {
    if (uploads > 0) return;
    setError("");
    setMessage("");
    ++epoch.current;
    try {
      const saved = await fieldsApi.save(
        caseId,
        version.id,
        values,
        revision.current,
      );
      revision.current = saved.revision;
      reset(defaults(version.fields, saved.values));
      setMessage("Datos guardados y validados.");
      onSaved?.(saved);
    } catch (e) {
      const issues: FieldIssue[] | undefined = axios.isAxiosError(e)
        ? e.response?.data?.detail?.errors
        : undefined;
      issues?.forEach((issue) =>
        markError(issue.path, { type: "server", message: issue.message }),
      );
      if (issues?.[0])
        document.getElementById(`field-${issues[0].path}`)?.focus();
      setError(
        issues?.length ? "Revise los campos señalados." : getApiErrorMessage(e),
      );
    }
  };
  return (
    <FormProvider {...form}>
      <FileActivityContext.Provider value={fileActivity}>
        <form
          noValidate
          onSubmit={form.handleSubmit(submit)}
          className="space-y-5"
        >
          <DynamicFields
            fields={version.fields}
            caseId={caseId}
            versionId={version.id}
            disabled={readOnly || form.formState.isSubmitting}
          />
          {calculating && (
            <p role="status" className="text-sm text-slate-500">
              Validando y calculando…
            </p>
          )}
          {error && (
            <p role="alert" className="text-red-700">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="text-green-800">
              {message}
            </p>
          )}
          {!readOnly && (
            <button
              type="submit"
              disabled={form.formState.isSubmitting || uploads > 0}
              className="bg-brand-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {form.formState.isSubmitting ? "Guardando…" : "Guardar datos"}
            </button>
          )}
        </form>
      </FileActivityContext.Provider>
    </FormProvider>
  );
}
