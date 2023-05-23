const returnEmpty = () => ({})
const returnField = (field: string) => <T>(x: T) => ({ [field]: x })

/** add field to object if given array or object is not empty.
 *
 * @example
 * ```ts
 * const base = { a: 1 }
 * const notAdded1 = { ...base, ...maybeAdd("b")([]) } // { a: 1 }
 * const notAdded2 = { ...base, ...maybeAdd("b")({}) } // { a: 1 }
 * const added = { ...base, ...maybeAdd("b")([2]) } // { a: 1, b: [2] }
 * ```
 */
export const maybeAdd = (field: string) => (x: Record<string, unknown> | unknown[]) =>
  Object.keys(x).length === 0 ? returnEmpty() : returnField(field)(x)
