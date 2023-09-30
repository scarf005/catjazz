import { asynciter } from "../deps/asynciter.ts"
import { match, P } from "../deps/ts_pattern.ts"
import { z } from "../deps/zod.ts"
import { bgRed } from "../deps/std/fmt.ts"

import { Entry, parseCataJson } from "./parse.ts"
import { deepMerge } from "../deps/std/collection.ts"

export type Transformer<T = unknown> = (text: string) => T[]

/** Apply same transformation to all JSON files recursively in given directory. */
export const applyRecursively = (transformer: Transformer) => async (entries: Entry[]) => {
  await asynciter(entries)
    .concurrentUnorderedMap(async ({ path, text }) => {
      try {
        await Deno.writeTextFile(path, JSON.stringify(transformer(text), null, 2))
      } catch (e) {
        console.log(`${bgRed("ERROR")} @ ${path}: ${e}`)
      }
    })
    .collect()
}

/**
 * creates a transformer that searches (and migrates) entries satisfying given schema.
 * mapping schemas are zod schema with .transform() method either on object level or property,
 * which will transform an entry satisfying schema.
 *
 * entries that do not satisfy schema are left unchanged.
 */
export const schemaTransformer = (schema: z.ZodTypeAny): Transformer => (text) =>
  parseCataJson(text)
    .map((x) =>
      match(schema.safeParse(x))
        .with({ success: true, data: P.select() }, (parsed) =>
          deepMerge(x, parsed, { arrays: "replace" }))
        .otherwise(() =>
          x
        )
    )

/**
 * creates a transformer that filters entries satisfying given schema.
 */
export const schemaFilter =
  <const T extends z.ZodTypeAny>(schema: T): Transformer<z.output<T>> => (text) =>
    parseCataJson(text)
      .flatMap((x) =>
        match(schema.safeParse(x))
          .with({ success: true, data: P.select() }, (x) => [x])
          .otherwise(() => [])
      )
