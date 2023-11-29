import { match, P } from "../deps/ts_pattern.ts"
import { z } from "../deps/zod.ts"

export const volume = z.custom<`${number} ${VolumeUnits}`>((x) => /^\d+ (ml|L)$/.test(x as string))

export type VolumeUnits = "ml" | "L"
export type Volume = z.infer<typeof volume>

const litre = 1000

export const fromMililitres = (ml: number): Volume =>
  match(ml)
    .with(0, () => `${ml} ml` as const)
    .when((ml) => ml % litre === 0, (ml) => `${ml / litre} L` as const)
    .otherwise((ml) => `${ml} ml` as const)

/** converts volumes string as mililitres. */

export const toMililitres = (v: Volume): number =>
  match(v)
    .with(P.string.regex(/(\d+) ml/), (ml) => parseInt(ml, 10))
    .with(P.string.regex(/(\d+) L/), (L) => parseInt(L, 10) * litre)
    .otherwise(() => 0)

/**
 * converts legacy volume to new volume format.
 * @param x legacy volume (`1 unit` = `250 mL`)
 * @return ml or L
 */
export const fromLegacyVolume = (x: number): Volume => fromMililitres(x * 250)

/** multiplies volume string by given factor. */
export const multiplyVolume = (v: Volume, n: number): Volume =>
  fromMililitres(Math.round(toMililitres(v) * n))
