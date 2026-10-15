import type { ComponentProps } from "react"

/** An unstyled <button> that defaults to type="button", so it never submits a surrounding form. */
export function PlainButton({ type = "button", ...props }: ComponentProps<"button">) {
  return <button type={type} {...props} />
}
