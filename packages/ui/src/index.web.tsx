import React from "react";
import type { ButtonProps } from "./Button";

export function Button({ title, onPress, variant = "primary", disabled }: ButtonProps) {
  return (
    <button
      onClick={onPress}
      disabled={disabled}
      data-variant={variant}
      style={{
        padding: "8px 16px",
        borderRadius: 6,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {title}
    </button>
  );
}
