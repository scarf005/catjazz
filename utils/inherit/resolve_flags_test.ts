import { assertEquals } from "../../deps/std/assert.ts"
import { resolveFlags } from "./resolve_flags.ts"

Deno.test("delete flags", () =>
  assertEquals(
    resolveFlags(
      { a: ["A", "B"], b: ["X", "Y"], c: 123 },
      {
        delete: { a: ["A"], b: ["B"] },
        extend: { d: [1, 2, 3] },
      },
    ),
    {
      a: ["B"],
      b: ["X", "Y"],
      c: 123,
      d: [1, 2, 3],
    },
  ))
