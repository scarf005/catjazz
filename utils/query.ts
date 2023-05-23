import { Command } from "../deps/cliffy.ts"
import { z, type ZodType as _ZodType } from "../deps/zod.ts"

import { readRecursively } from "./parse.ts"
import { schemaFilter } from "./transform.ts"
import { makeTimeits, Timeit } from "./timeit.ts"
import { BaseCliOption, cliOptions } from "./cli.ts"

export type QueryCliOption<Schema extends z.ZodTypeAny, O = unknown> =
  & Omit<BaseCliOption, "schema">
  & {
    schema: Schema

    /** postprocess queried results. */
    map?: (xs: z.output<Schema>[]) => O

    mapTask?: string
  }

/**
 * Recursively queries entries matching given zod schema.
 *
 * It cannot resolve inheritance or reference other entries.
 *
 * @example
 * ```ts
 * // Query mutation flags
 *
 * const flags = z
 *  .object({ type: z.literal("mutation"), flags: z.array(z.string()) })
 *  .transform((x) => x.flags)
 *
 * const main = query(flags)("./foo")
 *
 * await main().parse(Deno.args)
 * ```
 */
export const queryCli = <const Schema extends z.ZodTypeAny>(
  { desc, schema, task = "query", map, mapTask = "mapping" }: QueryCliOption<Schema>,
) =>
() =>
  new Command()
    .option(...cliOptions.quiet)
    .option(...cliOptions.path)
    .option(...cliOptions.output)
    .option("--flatten", "silence all output.", { required: false })
    .description(desc)
    .action(async ({ path, output, quiet = false }) => {
      const { timeit, timeitSync } = makeTimeits(quiet)

      const transformer = schemaFilter(schema)
      const entries = await readRecursively(path)
      const query = () => entries.flatMap(({ text }) => transformer(text))

      const queried = timeitSync({ name: task, fn: query })
      if (queried.length === 0) {
        return console.log("no matching entries found.")
      }
      if (!map) {
        return outputTo(timeit)(queried, output)
      }
      const mapped = timeitSync({ name: mapTask, fn: () => map(queried) })
      return outputTo(timeit)(mapped, output)
    })

const outputTo = (timeit: Timeit) => async (data: unknown, path?: string) => {
  if (!path) {
    return console.log(data)
  }
  await timeit({
    name: `wrote ${Array.isArray(data) ? data.length : 1} entries`,
    val: Deno.writeTextFile(path, JSON.stringify(data, null, 2)),
  })
}

if (import.meta.main) {
  const flags = z
    .object({ type: z.literal("mutation"), flags: z.array(z.string()) })
    .transform((x) => x.flags)

  const main = queryCli({ desc: "Query mutation flags", schema: flags })
  await main().parse(Deno.args)
}
