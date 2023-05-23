import { c, p } from "../deps/copb.ts"
import {
  bgBrightRed,
  bold,
  brightGreen,
  brightRed,
  brightWhite,
  brightYellow,
} from "../deps/std/fmt.ts"
import { match } from "../deps/ts_pattern.ts"

const redBoldBg = c(p(bgBrightRed)(brightWhite)(bold))

const color = (ms: number) =>
  match(ms)
    .when((x) => x < 100, () => brightGreen)
    .when((x) => x < 500, () => brightYellow)
    .when((x) => x < 1000, () => brightRed)
    .otherwise(() => redBoldBg)

const timeitInner = ({ start, end }: { start: number; end: number }) => {
  const ms = Math.round(end - start)
  const colorFn = color(ms)

  return { ms, color: colorFn, msColored: colorFn(`(${ms}ms)`) }
}

/** wait for a promise and returns its value, time it took, and color. */
export const timeitVerbose = async <T>(val: Promise<T>) => {
  const start = performance.now()
  const result = await val
  const end = performance.now()

  return { result, ...timeitInner({ start, end }) }
}

export const timeitSyncVerbose = <T>(fn: () => T) => {
  const start = performance.now()
  const result = fn()
  const end = performance.now()

  return { result, ...timeitInner({ start, end }) }
}

type TimeitOption<T> = {
  name: string | ((val: T) => string)
  val: Promise<T>
}

export type Timeit = ReturnType<typeof timeit>

/** wait for a promise and log how long it took. */
export const timeit = (quiet: boolean) => async <T>({ name, val }: TimeitOption<T>) => {
  const { result, msColored } = await timeitVerbose(val)
  const display = typeof name === "string" ? name : name(result)

  if (!quiet) console.log(`${display} ${msColored}`)

  return result
}

type TimeitSyncOption<T> = {
  name: string | ((val: T) => string)
  fn: () => T
}

export type TimeitSync = ReturnType<typeof timeitSync>
export const timeitSync = (quiet: boolean) => <T>({ name, fn }: TimeitSyncOption<T>) => {
  const { result, msColored } = timeitSyncVerbose(fn)
  const display = typeof name === "string" ? name : name(result)

  if (!quiet) console.log(`${display} ${msColored}`)

  return result
}

export type Timeits = ReturnType<typeof makeTimeits>
export const makeTimeits = (quiet: boolean) => ({
  timeit: timeit(quiet),
  timeitSync: timeitSync(quiet),
})
