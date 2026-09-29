"use client";

import type { ComponentProps } from "react";
import { Input } from "./field";

/** Numeric field that opens the numeric keypad on phones and yields number | null. */
export function NumberInput({
  value,
  onValueChange,
  decimal = false,
  ...props
}: Omit<ComponentProps<"input">, "value" | "onChange" | "type"> & {
  value: number | null;
  onValueChange: (value: number | null) => void;
  decimal?: boolean;
}) {
  return (
    <Input
      type="text"
      inputMode={decimal ? "decimal" : "numeric"}
      pattern={decimal ? "[0-9]*[.,]?[0-9]*" : "[0-9]*"}
      autoComplete="off"
      value={value ?? ""}
      onChange={(e) => onValueChange(parseNumber(e.target.value, decimal))}
      {...props}
    />
  );
}

export function parseNumber(raw: string, decimal: boolean): number | null {
  const cleaned = raw.replace(",", ".").trim();
  if (cleaned === "") return null;
  const n = decimal ? Number.parseFloat(cleaned) : Number.parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : null;
}
