/**
 * A Firestore document as the UI consumes it: its id plus loosely-typed fields.
 * Legacy collections have no enforced schema, so fields are indexed rather than
 * enumerated. Prefer a specific interface (and a Zod schema) for new code.
 */
export interface Doc {
  id: string
  [field: string]: any // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * Transitional props type for components migrated from JSX without prop types.
 * Replace with a specific interface when a component is next touched.
 */
export type LegacyProps = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
