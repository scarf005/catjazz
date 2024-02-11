/**
 * @file
 *
 * Parses cataclysm JSON files.
 */

import { asynciter } from "../deps/asynciter.ts"
import { walk } from "../deps/std/fs.ts"
import { basename } from "../deps/std/path.ts"
import { match, P } from "../deps/ts_pattern.ts"

export type CataEntry = Record<string, unknown> & { type: string }

/** parses cataclysm JSON. wraps single object into array. */
export const parseCataJson = (text: string): CataEntry[] => {
  const rawJson = JSON.parse(text)

  return Array.isArray(rawJson) ? rawJson : [rawJson]
}

const isValidJson = (name: string) => !["default.json", "replacements.json"].includes(name)

const toEntry = async (path: string) => ({ path, text: await Deno.readTextFile(path) })

/** lightweight file system entry with file path and text content. */
export type Entry = { path: string; text: string }

/**
 * @internal
 * recursively reads all JSON files from given directory.
 */
const readDirRecursively = (root: string) => () =>
  asynciter(walk(root, { exts: [".json"] }))
    .filter(({ name }) => isValidJson(name))
    .concurrentUnorderedMap(({ path }) => toEntry(path))
    .collect()

/**
 * @internal
 * recursively reads all JSON files from given path.
 *
 * @param root path to file or directory.
 */
const readJSONRec = async (root: string) =>
  match({ root, ...(await Deno.stat(root)) })
    .with({ root: P.when((x) => !isValidJson(basename(x))) }, () => {
      throw new Error(`path ${root} is not a valid JSON file`)
    })
    .with(
      { isFile: true, root: P.when((x) => x.endsWith(".json")) },
      async () => [await toEntry(root)],
    )
    .with({ isDirectory: true }, readDirRecursively(root))
    .otherwise(() => {
      throw new Error(`path ${root} is neither JSON file nor directory`)
    })

/**
 * reads all JSON files from given paths recursively.
 */
export const readJSONsRec = (paths: string[]): Promise<Entry[]> =>
  asynciter(paths)
    .concurrentUnorderedMap(readJSONRec).collect()
    .then((x) => x.flat())
