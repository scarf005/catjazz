import { match } from "../deps/ts_pattern.ts"
import { z } from "../deps/zod.ts"

export const volume = z.custom<`${number} ${VolumeUnits}`>((x) => /^\d+ (ml|L)$/.test(x as string))

export type VolumeUnits = "ml" | "L"
export type Volume = z.infer<typeof volume>

const litre = 1000

/**
 * converts legacy volume to new volume format.
 * @param x legacy volume (`1 unit` = `250 mL`)
 * @return ml or L
 */
export const fromLegacyVolume = (x: number): Volume =>
  match(x * 250)
    .with(0, () => `${x} ml` as const)
    .when((ml) => ml % litre === 0, (ml) => `${ml / litre} L` as const)
    .otherwise((ml) => `${ml} ml` as const)
