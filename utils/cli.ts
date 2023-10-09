import { Command } from "../deps/cliffy.ts"
import { z, type ZodType as _ZodType } from "../deps/zod.ts"
import { match, P } from "../deps/ts_pattern.ts"
import { id } from "./id.ts"

import { CataEntry, Entry, parseCataJson, readRecursively } from "./parse.ts"
import { applyRecursively, schemaTransformer } from "./transform.ts"
import { timeit } from "./timeit.ts"
import { fmtJsonRecursively } from "./json_fmt.ts"

export type BaseCliOption = {
  /** Description for the script. */
  desc: string
  /** Name of the task this script does. */
  task?: string
  /**
   * A zod object with transformation. @see {@link _ZodType.transform}
   */
  schema: z.ZodTypeAny
}

const unpack = (xs: string[] | Entry[]) =>
  match(xs)
    .with(P.array(P.string), id)
    .otherwise((xs) => xs.map(({ path }) => path))

type OptionMethod = Command["option"]
type OptionParams = Parameters<OptionMethod>

export const cliOptions = {
  path: ["-p, --path <string>", "path to recursively find jsons.", { required: true }],
  quiet: ["-q, --quiet", "silence all output.", { required: false }],
  output: ["-o, --output <type:string>", "output file path. outputs to stdout if omitted.", {
    required: false,
  }],
  format: ["--format <path:string>", "format json files using formatter at given path.", {
    required: false,
  }],
} as const satisfies Record<string, Readonly<OptionParams>>

/**
 * Recursively applies a zod transformation
 * for all json files concurrently in a given path.
 *
 * It cannot resolve inheritance or reference other entries.
 *
 * @example
 * ```ts
 * // A script that doubles all the `fun` value of `FOOD` entries:
 * import { baseCli } from "./main.ts"
 * import { z } from "./deps/zod.ts"
 * import { id } from "./utils/id.ts"
 *
 * const food = z
 *  .object({ comestible_type: z.literal("FOOD"), fun: z.number() })
 *  .passthrough()
 *  .transform((x) => ({ ...x, fun: x.fun * 2 }))
 *
 * const main = baseCli({ desc: "Double food fun", schema: food })
 *
 * await main().parse(Deno.args)
 * ```
 */
export const baseCli = ({ desc, task = "migration", schema }: BaseCliOption) => () =>
  new Command()
    .option(...cliOptions.path)
    .option(...cliOptions.quiet)
    .option(...cliOptions.format)
    .description(desc)
    .action(async ({ path, format, quiet = false }) => {
      const timeIt = timeit(quiet)

      const transformer = schemaTransformer(schema)
      const ignore = (entries: CataEntry[]) =>
        entries.find(({ type }) => ["mapgen", "palette", "mod_tileset"].includes(type))

      const mapgenIgnoringTransformer = (text: string) => {
        const entries = parseCataJson(text)
        return ignore(entries) ? text : JSON.stringify(transformer(entries), null, 2)
      }

      const recursiveTransformer = applyRecursively(mapgenIgnoringTransformer)

      const entries = await timeIt({ name: "reading JSON", val: readRecursively(path) })

      await timeIt({ name: task, val: recursiveTransformer(entries) })

      if (!format) return
      await timeIt({
        name: "formatting",
        val: fmtJsonRecursively({ formatterPath: format, quiet: true })(unpack(entries)),
      })
    })

if (import.meta.main) {
  const { z } = await import("../deps/zod.ts")
  const { id } = await import("./id.ts")

  const noop = z.object({}).passthrough().transform(id)
  const main = baseCli({ desc: "Do nothing", schema: noop })
  await main().parse(Deno.args)
}
