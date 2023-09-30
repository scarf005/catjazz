import { match } from "../deps/ts_pattern.ts"
import { z } from "../deps/zod.ts"

export const weight = z.custom<`${number} ${WeightUnits}`>((x) => /^\d+ (m|k)?g$/.test(x as string))
export const volume = z.custom<`${number} ${VolumeUnits}`>((x) => /^\d+ (ml|L)$/.test(x as string))

export type WeightUnits = "mg" | "g" | "kg"
export type Weight = z.infer<typeof weight>
export type VolumeUnits = "ml" | "L"
export type Volume = z.infer<typeof volume>

/**
 * converts legacy weight to new weight format.
 * @param g legacy weight (`1 unit` = `1g`)
 * @return g or kg
 */
export const fromLegacyWeight = (g: number): Weight =>
  match(g % 1000)
    .with(0, () => `${g / 1000} kg` as const)
    .otherwise(() => `${g} g` as const)

/**
 * converts legacy volume to new volume format.
 * @param x legacy volume (`1 unit` = `250 mL`)
 * @return ml or L
 */
export const fromLegacyVolume = (x: number): Volume => {
  const ml = 250 * x
  return match(ml % 1000)
    .with(0, () => `${ml / 1000} L` as const)
    .otherwise(() => `${ml} ml` as const)
}

export const currency = z.custom<`${number} ${CurrencyUnits}`>((x) => /^\d+ (cent|USD|kUSD)$/.test(x as string))
export type CurrencyUnits = "cent" | "USD" | "kUSD"
export type Currency = z.infer<typeof currency>

const usd = 100
const kusd = 1_000 * usd

/**
 * converts legacy cent to new currency format.
 * @param c legacy cent (`1 unit` = `1 cent`)
 * @return cent or USD or kUSD
 */
export const fromLegacyCurrency = (c: number): Currency =>
  match(c)
    .when((c) => c % kusd === 0, () => `${c / kusd} kUSD` as const)
    .when((c) => c % usd === 0, () => `${c / usd} USD` as const)
    .otherwise(() => `${c} cent` as const)

