// 向後相容的 re-export；實作在 ./playgrounds/index.ts
export type { PlaygroundItem, PlaygroundTemplate } from "./playgrounds/types"
export { playgrounds, playgroundsByTemplate } from "./playgrounds/index"
