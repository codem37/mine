export type AppErrorKind = "invalid-input" | "unsupported" | "internal";

export interface AppError {
  readonly kind: AppErrorKind;
  readonly message: string;
  readonly details?: unknown;
}
