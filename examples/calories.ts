import { Command, EnumType } from "../deps/cliffy.ts"
import { z } from "../mod.ts"
import { cliOptions } from "../utils/cli.ts"
import { readRecursively } from "../utils/parse.ts"
import { outputTo } from "../utils/query.ts"
import { makeTimeits } from "../utils/timeit.ts"
import { schemaFilter } from "../utils/transform.ts"

const name = z.union([
  z.string(),
  z.object({ str_sp: z.string() }).transform((x) => x.str_sp),
  z.object({ str: z.string() }).transform((x) => x.str),
])

type Portion = Pick<Food, "calories">

const compareByPortion = (a: Portion, b: Portion) => b.calories - a.calories
const compareByTotal = (a: Food, b: Food) => b.total - a.total

type Food = z.infer<typeof food>
const food = z
  .object({
    id: z.string().optional(),
    name,
    calories: z.coerce.number(),
    charges: z.number().default(1),
  })
  .transform((x) => ({ ...x, total: x.calories * x.charges }))

const queryType = new EnumType(["portion", "total"])

const main = () =>
  new Command()
    .name("calories")
    .type("query", queryType)
    .option(...cliOptions.quiet)
    .option(...cliOptions.path)
    .option(...cliOptions.output)
    .option("--limit <amount:integer>", "Limit number of entries to display.", { default: 30 })
    .option("--no-limit", "Display all entries.")
    .option("--sort-by <compare:query>", "Sort by individual portion or total", {
      default: "portion" as const,
    })
    .description("Query food calories.")
    .action(async ({ path, output, sortBy, limit, quiet }) => {
      const { timeit, timeitSync } = makeTimeits(quiet)

      const filter = schemaFilter(food)
      const entries = await readRecursively(path)
      const query = () =>
        entries.flatMap(({ text, path }) => {
          try {
            return filter(text)
          } catch (e) {
            console.log(path, e)
            return []
          }
        })

      const queried = timeitSync({ name: "querying foods", fn: query })
      if (queried.length === 0) {
        return console.log("no matching entries found.")
      }

      const cmp = sortBy === "portion" ? compareByPortion : compareByTotal
      const result = timeitSync({ name: "sorting by calories", fn: () => queried.toSorted(cmp) })
      if (output) {
        return outputTo(timeit)(result, output)
      }
      console.table(result.slice(0, limit || undefined))
    })

if (import.meta.main) {
  await main().parse(Deno.args)
}
