# CATJAZZ: Bright Nights JSON tools collection

<header align="center">
  <img src="./catjazz.svg" width="50%">
</header>

CATJAZZ is a collection of API for manipulating JSON data in [Cataclysm: Bright Nights][CBN]. They are powered by the [deno typescript runtime][deno] to ensure they're easy to use, portable, and fully typesafe.

## Example

```ts
import { baseCli } from "./main.ts"
import { z } from "./deps/zod.ts"
import { id } from "./utils/id.ts"

const noop = z.object({}).passthrough().transform(id)
const main = baseCli({ desc: "Do nothing", schema: noop })

await main().parse(Deno.args)
```

## License

AGPL 3.0 only. See [LICENSE](LICENSE) for details.

[deno]: https://deno.land
[CBN]: https://github.com/cataclysmbnteam/Cataclysm-BN

## Trivia

<details><summary>Project title was chosen by GPT4.</summary>

## Cataclysm: Bright Nights Acronyms

### You

could you make 20 idea for catchy acronym for `Cataclysm: Bright Nights JSON Manipulation Programme`

### ChatGPT

Certainly, here are 20 acronym ideas for `Cataclysm: Bright Nights JSON Manipulation Programme`:

1. CBNJUMP: Cataclysm Bright Nights JSON Universal Manipulation Programme
2. BRIGHTJAM: Bright Nights' Interactive Greatly Handy Tool: JSON Altering Mechanism
3. BRIGHTJUMP: Bright Nights' Reliable Interface for Game-oriented Handling Technology: JSON Unifying Manipulation Programme
4. BNCJAM: Bright Nights Cataclysm JSON Adjusting Machine
5. CATJAMP: Cataclysm Advanced Technology JSON Altering Mechanism Programme
6. NIGHTJAM: Nights' Intelligent Game Handler Technology: JSON Adjusting Module
7. BNMAGIC: Bright Nights' Module for Automated Game Interface Coding
8. CBNJIMP: Cataclysm Bright Nights JSON Innovative Manipulation Programme
9. PROJCAT: Programme for Robust Optimization of JSON in Cataclysm: Bright Nights
10. JUMPINCAT: JSON Unifying Manipulation Programme in Cataclysm: Bright Nights
11. NIGHTCAMP: Nights' Intelligent Game Handler Technology: Cataclysm Advanced Manipulation Programme
12. BRIGHTMOD: Bright Nights' Reliable Interface for Game Technology: Optimized Developer module
13. CBNJACK: Cataclysm Bright Nights JSON Automation and Coding Kit
14. BNCJSON: Bright Nights Cataclysm JSON Optimization Nexus
15. JUMPBNC: JSON Unifying Manipulation Programme for Bright Nights Cataclysm
16. JAMBNIGHT: JSON Altering Module for Bright Nights' Interactive Game Technology
17. CATJEM: Cataclysm Advanced Technology JSON Editing Mechanism
18. JESTER: JSON Editing Software for Technological Enhancement and Refactoring (in Bright Nights Cataclysm)
19. CATJAZZ: Cataclysm's Advanced Tool for JSON Alterations with Zero hassle and Zero bugs.
20. CBNJOY: Cataclysm Bright Nights' JSON Optimizer for You.

Remember that the best acronym should not only be catchy, but also convey the purpose and benefits of your programme to its potential users.

</details>
