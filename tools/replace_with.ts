#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --unstable

import { brightGreen as g, brightRed as r, brightYellow as y } from "../deps/std/fmt.ts"

import { Entry, readRecursively } from "../utils/parse.ts"
import { timeit } from "../utils/timeit.ts"
import { fmtJsonRecursively } from "../utils/json_fmt.ts"
import { schemaTransformer } from "../utils/transform.ts"
import { Command } from "../deps/cliffy.ts"
import { z } from "../deps/zod.ts"
import { promiseAllProperties } from "../deps/promise_all_properties.ts"
import { match, P } from "../deps/ts_pattern.ts"
import { cliOptions } from "../mod.ts"

type CataWithId = z.infer<typeof cataWithId>
const cataWithId = z.object({ id: z.string() }).passthrough()

type ParsedEntry = { path: string; parsed: CataWithId[] }

export const parseIds = (entries: Entry[]): ParsedEntry[] => {
  const idExtractor = schemaTransformer(cataWithId)

  return entries.map(({ path, text }) => ({ path, parsed: idExtractor(text) as CataWithId[] }))
}

export const findId = (ids: ParsedEntry[]) => (idToFind: string): ParsedEntry | undefined => {
  return ids.find(({ parsed }) => parsed.some(({ id }) => id === idToFind))
}

export const findFromEntry = (parsed: CataWithId[]) => (idToFind: string): CataWithId => {
  const result = parsed.find(({ id }) => id === idToFind)
  if (!result) {
    throw new Error(`could not find id ${idToFind}`)
  }
  return result
}

type ReplaceWith = (replace: CataWithId[]) => (using: CataWithId[]) => (id: string) => CataWithId[]
export const replaceWith: ReplaceWith = (replace) => (using) => (idToReplace) => {
  const actualReplaceEntry = findFromEntry(using)(idToReplace)

  return replace.map((x) =>
    match(x.id)
      .with(idToReplace, () => actualReplaceEntry)
      .otherwise(() => x)
  )
}

const nonNull = () => P.not(P.nullish)

const writeReplaceWith =
  (replaceEntries: ParsedEntry[]) =>
  (usingEntries: ParsedEntry[]) =>
  (idToReplace: string): Promise<string | void> => {
    const withId = (msg: string) => `${r(idToReplace.padEnd(20))} : ${msg}`
    const warn = (msg: string) => () => Promise.resolve(console.log(withId(r(msg))))

    const replaceEntry = findId(replaceEntries)(idToReplace)
    const usingEntry = findId(usingEntries)(idToReplace)

    return match({ replaceEntry, usingEntry })
      .with(
        { replaceEntry: nonNull(), usingEntry: nonNull() },
        async (
          { replaceEntry: { path, parsed: replace }, usingEntry: { path: from, parsed: using } },
        ) => {
          const newlyReplaced = replaceWith(replace)(using)(idToReplace)
          const write = Deno.writeTextFile(path, JSON.stringify(newlyReplaced, null, 2))

          await timeit(false)({ name: withId(`${y(path)} <- ${g(from)}`), val: write })
          return path
        },
      )
      .otherwise(warn(`${replaceEntry?.path ?? "no entry"} <- ${usingEntry?.path ?? "no entry"}`))
  }

const ex = {
  id: r("foo"),
  replace: y('{ "id": "foo", "desc": "to be replaced" }'),
  replacePath: y("replace/(any path)/path.json"),
  using: g('{ "id": "foo", "desc": "using" }'),
  usingPath: g("using/(any path)/.json"),
}

const main = () =>
  new Command()
    .description(`
      ${y("replace")} contents of a JSON entry ${g("using")} another JSON entry with the same id.
      this is useful for replacing mod content with vanilla content and vice versa.

      for example, imagine you have two entries with same id ${ex.id}:
      ${ex.replace} at ${ex.replacePath}
      ${ex.using} at ${ex.usingPath}

      if you want to replace ${ex.replace} with ${ex.using}, you can run:
      tools/json_tools/replace_with.ts ${y("--replace replace/")} ${g("--using using/")} ${ex.id}
    `)
    .option(...cliOptions.quiet)
    .option(...cliOptions.format)
    .option("-r, --replace <type:string>", "path to recursively search jsons.", { required: true })
    .option("-u, --using <type:string>", "path to recursively search jsons.", { required: true })
    .arguments("<id...>")
    .action(async ({ replace, using, format, quiet = false }, ...idsToReplace) => {
      const readResult = promiseAllProperties({
        replaceEntries: readRecursively(replace).then(parseIds),
        usingEntries: readRecursively(using).then(parseIds),
      })

      const { replaceEntries, usingEntries } = await timeit(quiet)({
        name: "reading entries",
        val: readResult,
      })
      const replaceFn = writeReplaceWith(replaceEntries)(usingEntries)

      const result = await Promise.all(idsToReplace.map(replaceFn))

      if (!format) return
      const paths = result.filter((x): x is string => x !== undefined)
      await timeit(quiet)({
        name: "linting",
        val: fmtJsonRecursively({ quiet: true, formatterPath: format })(paths),
      })
    })
    .parse(Deno.args)

if (import.meta.main) {
  await main()
}
