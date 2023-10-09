import { match } from "../deps/ts_pattern.ts"
import { z } from "../deps/zod.ts"

export const weight = z.custom<`${number} ${WeightUnits}`>((x) => /^\d+ (m|k)?g$/.test(x as string))
export type WeightUnits = "mg" | "g" | "kg"
export type Weight = z.infer<typeof weight>

/**
 * converts legacy weight to new weight format.
 * @param g legacy weight (`1 unit` = `1g`)
 * @return g or kg
 */
export const fromLegacyWeight = (g: number): Weight =>
  match(g % 1000)
    .with(0, () => `${g / 1000} kg` as const)
    .otherwise(() => `${g} g` as const)
