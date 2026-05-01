---
description: "Applies to all TypeScript files to enforce strict typing and absolutely prevent the use of the `any` type."
applyTo: "**/*.{ts,tsx}"
---

# TypeScript Strict Typing Rules

- **NEVER use the `any` type.**
- If you do not know the exact type, use `unknown` and perform appropriate type narrowing or checking.
- If you are dealing with external data, define a precise `interface` or `type` alias instead of escaping with `any`.
- Avoid using `any` in generics, function parameters, return types, and variable declarations.
- Enforce strict typing to maintain type safety and predictability across the application.
