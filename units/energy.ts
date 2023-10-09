import { z } from "../deps/zod.ts"

export const energy = z.custom<`${number} ${EnergyUnits}`>((x) => /^\d+ (m|k)?J$/.test(x as string))

export type EnergyUnits = "mJ" | "J" | "kJ"
export type Energy = z.infer<typeof energy>

/**
 * converts legacy energy to new energy format.
 * @param kj legacy energy (`1 unit` = `1kJ`)
 * @return kj
 */
export const fromLegacyEnergy = (kj: number): Energy => `${kj} kJ` as const
