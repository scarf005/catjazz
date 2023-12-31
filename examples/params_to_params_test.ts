import { z } from "../deps/zod.ts"

import { testSchema } from "../utils/test_schema.ts"

import { id } from "../utils/id.ts"
import { assertEquals } from "../deps/std/assert.ts"
import { match, P } from "../deps/ts_pattern.ts"

export const mergeDamageSchema = z.record(z.string(), z.unknown())
  .transform((obj) =>
    match(obj)
      // at first, it tries to check that the object has
      // damage: number, pierce: number
      .with(
        { damage: P.number, pierce: P.number, ...obj }, // if it succeeds, it returns the transformed object
        ({ damage, pierce, ...args }) => ({
          damage: { damage_type: "bullet", amount: damage, armor_penetration: pierce },
          ...args,
        }),
      )
      // if it fails, it will do nothing
      .otherwise(id)
  )

Deno.test("damage", async (t) =>
  await testSchema(t.step)(mergeDamageSchema)([
    {
      input: { damage: 60, pierce: 46 },
      expected: { damage: { damage_type: "bullet", amount: 60, armor_penetration: 46 } },
    },
    { id: { damage: 30, foo: [1, 2, 3], bar: "barbaz" } },
    { id: { damage: { damage_type: "bullet", amount: 60, armor_penetration: 46 } } },
  ]))

const before = {
  damage: 60,
  pierce: 46,
  foo: [1, 2, 3],
  bar: "barbaz",
}

const after = {
  damage: { damage_type: "bullet", amount: 60, armor_penetration: 46 },
  foo: [1, 2, 3],
  bar: "barbaz",
}

Deno.test(
  "merge complex armor params",
  async (t) => {
    await t.step(
      "can parse full entry",
      () =>
        assertEquals(
          mergeDamageSchema.parse(before),
          after as unknown,
        ),
    )
  },
)
