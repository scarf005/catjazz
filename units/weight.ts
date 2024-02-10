import { match, P } from "../deps/ts_pattern.ts"
import { typedRegEx } from "../deps/typed_regex.ts"
import { z } from "../deps/zod.ts"

export const weight = z.custom<`${string} ${WeightUnits}`>((x) => /^\d+ (m|k)?g$/.test(x as string))
export type WeightUnits = "mg" | "g" | "kg"
export type Weight = z.infer<typeof weight>

const kilogram = 1000

const re = typedRegEx("(?<n>\\d+) (?<unit>mg|kg|g)")

export const parseGrams = (w: string): number => {
  const { n, unit } = re.captures(w)!

  // deno-fmt-ignore
  switch (unit) {
    case "mg": return 1 // do we really need miligrams?
    case "g":  return +n
    case "kg": return +n * kilogram
  }
  throw new Error(`invalid weight: ${w}`)
}

export const fromGrams = (g: number): Weight =>
  match(g % kilogram)
    .with(0, () => `${g / 1000} kg` as const)
    .otherwise(() => `${g} g` as const)

/** converts weight string as grams. */
export const toGrams = (w: Weight): number =>
  match(w)
    .with(P.string.regex(/(\d+) g/), (g) => parseInt(g, 10))
    .with(P.string.regex(/(\d+) kg/), (kg) => parseInt(kg, 10) * kilogram)
    .otherwise(() => 0)

/**
 * converts legacy weight to new weight format.
 * @param g legacy weight (`1 unit` = `1g`)
 * @return g or kg
 */
export const fromLegacyWeight = fromGrams

/** multiplies weight string by given factor. */
export const multiplyWeight = (w: Weight, n: number): Weight =>
  fromGrams(Math.round(toGrams(w) * n))
