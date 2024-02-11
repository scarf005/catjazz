#!/usr/bin/env -S deno run --allow-read --allow-write

import { cliOptions } from "../utils/cli.ts"
import { Command } from "../deps/cliffy.ts"
import { b } from "../deps/copb.ts"
import { mapValues } from "../deps/std/collection.ts"
import { join } from "../deps/std/path.ts"
import { CataEntry, parseCataJson, readJSONsRec } from "../utils/parse.ts"
import { makeTimeits, Timeits } from "../utils/timeit.ts"

const toMiB = (bytes: number) => (bytes / 1024 ** 2).toFixed(2)
const objectElems = (obj: Record<string, unknown>) => Object.entries(obj).length

type Type = string
type Dump = string
type DumpedByType = Record<Type, Dump>

export const dumpWhole = ({ timeitSync }: Timeits) => (jsons: CataEntry[]): Dump =>
  timeitSync({
    name: (val) => `stringified ${val.length} characters`,
    fn: () => JSON.stringify(jsons),
  })

export const dumpGrouped = ({ timeitSync }: Timeits) => (jsons: CataEntry[]): DumpedByType =>
  timeitSync({
    name: (schemas) => `stringified ${objectElems(schemas)} schemas`,
    fn: () => mapValues(Object.groupBy(jsons, ({ type }) => type), JSON.stringify),
  })

export const writeWhole = ({ timeit }: Timeits) => (dump: string) => (output: string) =>
  timeit({
    name: `wrote ${toMiB(dump.length)} MiB to ${output}`,
    val: Deno.writeTextFile(output, dump),
  })

export const writeGrouped =
  ({ timeit }: Timeits) => (dumped: DumpedByType) => async (output: string, ext = "") => {
    await timeit({
      name: `checked ${output} directory`,
      val: Deno.mkdir(output, { recursive: true }),
    })

    const writes = Object.entries(dumped).map(([type, entries]) =>
      Deno.writeTextFile(join(output, `${type}.${ext}`), entries)
    )

    await timeit({
      name: `wrote ${objectElems(dumped)} files under ${output}`,
      val: Promise.all(writes),
    })
  }

type Option = { paths: string[]; timeits: Timeits }

export const dump = async (
  { paths, timeits: { timeit, timeitSync } }: Option,
): Promise<CataEntry[]> => {
  const entries = await timeit({
    name: (val) => `read ${val.length} files`,
    val: readJSONsRec(paths),
  })

  return timeitSync({
    name: (val) => `flattened ${val.length} entries`,
    fn: () => entries.flatMap(({ text }) => parseCataJson(text)),
  })
}

const makeDumpFns = (timeits: Timeits) => {
  const f = {
    writeGrouped: writeGrouped(timeits),
    writeWhole: writeWhole(timeits),
    dumpGrouped: dumpGrouped(timeits),
    dumpWhole: dumpWhole(timeits),
  }
  return (group: boolean) => group ? b(f.writeGrouped)(f.dumpGrouped) : b(f.writeWhole)(f.dumpWhole)
}

const desc =
  "Recursively read all JSON entries of Cataclysm: Bright Nights and dump them to a single file."

const dumpCli = () =>
  new Command()
    .option(...cliOptions.paths)
    .option("-o, --output <path:string>", "output file path.", { required: true })
    .option("--group", "whether to split the dump by their type")
    .option(...cliOptions.quiet)
    .description(desc)
    .action(async ({ paths, output, group = false, quiet = false }) => {
      const timeits = makeTimeits(quiet)
      const fn = makeDumpFns(timeits)(group)

      const dumped = await dump({ paths, timeits })

      await fn(dumped)(output)
    })

if (import.meta.main) {
  await dumpCli().parse(Deno.args)
}
