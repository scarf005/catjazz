import { Command } from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts"

import {
  InputData,
  jsonInputForTargetLanguage,
  quicktype,
  TypeScriptTargetLanguage,
} from "npm:quicktype-core"

import { cliOptions } from "../utils/cli.ts"
import { dump, dumpGrouped, writeGrouped } from "./dump.ts"
import { makeTimeits } from "../utils/timeit.ts"

// TODO: move to scarf005/schemas

const desc = "Generate schema from JSON entries using quicktype"

const quicktypeOpt = {
  rendererOptions: {
    "just-types": true,
    "prefer-types": true,
    "explicit-unions": true,
    "prefer-unions": true,
  },
}

const genTypes = async ([name, rawJson]: [name: string, rawJson: string]) => {
  const jsonInput = jsonInputForTargetLanguage(new TypeScriptTargetLanguage())
  await jsonInput.addSource({ name, samples: [rawJson] })
  const inputData = new InputData()
  inputData.addInput(jsonInput)

  const typed = await quicktype({ ...quicktypeOpt, inputData })
  const result = typed.lines.map((x) => x.replace(/;$/, "").replace(/^export /, "")).join("\n")

  return [name, result]
}

const schemaCli = () =>
  new Command()
    .option(...cliOptions.paths)
    .option(...cliOptions.output)
    .description(desc)
    .action(async ({ path, output }) => {
      const timeits = makeTimeits(false)
      const dumped = await dump({ path, timeits })
      const grouped = dumpGrouped(timeits)(dumped)
      const gens = await Promise.all(Object.entries(grouped).map(genTypes))
      const result = Object.fromEntries(gens)

      writeGrouped(timeits)(result)(output, "ts")
    })

if (import.meta.main) {
  await schemaCli().parse(Deno.args)
}
