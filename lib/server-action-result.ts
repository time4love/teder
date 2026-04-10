/**
 * Next.js server actions can resolve to `undefined` in edge cases; using
 * `"error" in result` when `result` is undefined throws a TypeError.
 */
export function isServerActionError(
  result: unknown,
): result is { error: string } {
  return (
    result !== undefined &&
    result !== null &&
    typeof result === "object" &&
    "error" in result &&
    typeof (result as { error: unknown }).error === "string"
  );
}
