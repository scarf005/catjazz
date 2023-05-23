import { filterEntries, mapEntries } from "../../deps/std/collection.ts"
import { match, P } from "../../deps/ts_pattern.ts"
type Entry = Record<string, unknown>
type Flags = Record<string, unknown[]> | undefined

const isFlags = P.array(P.string)

const extendThenDelete = (ext?: unknown[]) => (del?: unknown[]) => (xs: unknown[]) => {
  const deleted = del ? xs.filter((x) => !del.includes(x)) : xs
  return ext ? [...deleted, ...ext] : deleted
}

type Option = { extend: Flags; delete: Flags }
export const resolveFlags = (
  entry: Entry,
  { extend: ext, delete: del }: Partial<Option>,
): Entry => {
  const mapped = mapEntries(entry, ([key, value]) => [
    key,
    match(value)
      .with(isFlags, (xs) => extendThenDelete(ext?.[key])(del?.[key])(xs))
      .otherwise(() => value),
  ])
  return match(ext)
    .with(P.nullish, () => mapped)
    .otherwise((ext) => ({ ...mapped, ...filterEntries(ext, ([key]) => !entry[key]) }))
}
