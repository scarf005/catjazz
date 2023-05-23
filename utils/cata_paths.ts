import { fromFileUrl, join } from "../deps/std/path.ts"

export const FILE_PATH = fromFileUrl(import.meta.url)
export const ROOT = fromFileUrl(new URL("../../", import.meta.url))

const fromRoot = <const T extends string>(path: T) => join(ROOT, path) as `${string}/${T}`

export const PROJECT = {
  ROOT,
  SRC: fromRoot("src"),
  DATA: fromRoot("data"),
  JSON: fromRoot("data/json"),
  TOOLS: fromRoot("tools"),
  VSCODE: fromRoot(".vscode"),
} as const

if (import.meta.main) {
  for (const [name, path] of Object.entries(PROJECT)) {
    console.log(`${name}: ${path}`)
  }
}
