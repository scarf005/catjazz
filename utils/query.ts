import { Command } from "../deps/cliffy.ts"
import { z, type ZodType as _ZodType } from "../deps/zod.ts"

import { readJSONsRec } from "./parse.ts"
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
    .option(...cliOptions.paths)
    .option(...cliOptions.output)
    .description(desc)
    .action(async ({ paths, output, quiet = false }) => {
      const { timeit, timeitSync } = makeTimeits(quiet)

      const filter = schemaFilter(schema)
      const entries = await readJSONsRec(paths)
      const query = () =>
        entries.flatMap(({ text, path }) => {
          try {
            return filter(text)
          } catch (e) {
            console.log(path, e)
            return []
          }
        })

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

export const outputTo = (timeit: Timeit) => async (data: unknown, path?: string) => {
  const output = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  if (!path) {
    return console.log(output)
  }
  await timeit({
    name: `wrote ${Array.isArray(data) ? data.length : 1} entries to ${path}`,
    val: Deno.writeTextFile(path, output),
  })
}

if (import.meta.main) {
  const flags = z
    .object({
      type: z.literal("mutation"),
      flags: z.array(z.string()),
    })
    .transform((x) => x.flags)

  const mutationFlag = {
    "//": "This trait flag is used by cosmetic trait JSON, with no hardcode usage at present.",
    "type": "mutation_flag",
  }

  const main = queryCli({
    desc: "Find all query mutation flags",
    schema: flags,
    map: (xss) => {
      const result = [...new Set(xss.flat())]
        .map((x) => ({ id: x, ...mutationFlag }))

      return result
    },
  })
  await main().parse(Deno.args)
}
