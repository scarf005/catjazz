import { match, P } from "../deps/ts_pattern.ts"
import { z } from "../deps/zod.ts"

export const currency = z.custom<`${number} ${CurrencyUnits}`>((x) =>
  /^\d+ (cent|USD|kUSD)$/.test(x as string)
)
export type CurrencyUnits = "cent" | "USD" | "kUSD"
export type Currency = z.infer<typeof currency>

const usd = 100
const kusd = 1000 * usd

export const fromCents = (c: number): Currency =>
  match(c)
    .with(0, () => `0 cent` as const)
    .when((c) => c % kusd === 0, () => `${c / kusd} kUSD` as const)
    .when((c) => c % usd === 0, () => `${c / usd} USD` as const)
    .otherwise(() => `${c} cent` as const)

export const toCents = (c: Currency): number =>
  match(c)
    .with(P.string.regex(/(\d+) cent/), (cent) => parseInt(cent, 10))
    .with(P.string.regex(/(\d+) USD/), (USD) => parseInt(USD, 10) * usd)
    .with(P.string.regex(/(\d+) kUSD/), (kUSD) => parseInt(kUSD, 10) * kusd)
    .otherwise(() => 0)

/**
 * converts legacy cent to new currency format.
 * @param c legacy cent (`1 unit` = `1 cent`)
 * @return cent or USD or kUSD
 */
export const fromLegacyCurrency = fromCents

/** multiplies currency string by given factor. */
export const multiplyCurrency = (c: Currency, n: number): Currency =>
  fromCents(Math.round(toCents(c) * n))
