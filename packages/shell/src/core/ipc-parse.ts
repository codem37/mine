import { err, ok } from "@mine/contracts";
import type { AppError, Result } from "@mine/contracts";
import type { z } from "zod";

export function parsePayload<S extends z.ZodType>(
  schema: S,
  raw: unknown,
): Result<z.output<S>, AppError> {
  const parsed = schema.safeParse(raw);
  if (parsed.success) {
    return ok(parsed.data);
  }
  const flattened = parsed.error.issues
    .map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
    .join("; ");
  return err({
    kind: "invalid-input",
    message: `payload rejected by ${schema.description ?? "schema"}: ${flattened}`,
    details: parsed.error.issues,
  });
}
