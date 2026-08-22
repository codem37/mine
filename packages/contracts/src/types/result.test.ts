import { describe, expect, it } from "vitest";
import { err, ok } from "./result.js";
import type { Result } from "./result.js";
import type { AppError } from "./app-error.js";

describe("Result", () => {
  it("ok carries a value and narrows via the discriminant", () => {
    const result = ok(42);
    if (result.ok) {
      expect(result.value).toBe(42);
    } else {
      expect.unreachable("ok() must produce the ok branch");
    }
  });

  it("err carries an error and narrows via the discriminant", () => {
    const error: AppError = { kind: "invalid-input", message: "bad url" };
    const result: Result<number> = err(error);
    if (!result.ok) {
      expect(result.error.kind).toBe("invalid-input");
    } else {
      expect.unreachable("err() must produce the error branch");
    }
  });
});
