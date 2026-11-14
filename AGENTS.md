# Agent guide

Read `README.md` first. It describes the authoring API and the architecture. This file lists the rules that are easy to get wrong.

## Commands

- `npm run dev` starts the dev server. Saving a file reloads the browser on the current step.
- `npm run check` type-checks, runs the tests and builds. Run it before you commit.
- `npm run new -- <kebab-name>` and `npm run remove -- <kebab-name>` create and delete presentations.

## Writing presentations

- A presentation is `src/presentations/<name>/index.ts`. Its default export must be the result of `presentation(...)`. Import everything you need from `'../../authoring.ts'`, and keep the presentation's images in the same folder.
- **Create elements inside the slide script.** The script runs once during rehearsal and again every time the slide is shown. An element created outside the script would carry state from one run into the next.
- Reveal effects (`fadeIn`, `popIn`, `slideIn`, `typewrite`, `drawLine`) hide their element as soon as they are called. Just `add` the element and pass the effect to the step that should reveal it.
- `morph(from, to)` hides `to` and adds it to the scene by itself, so there is no need to `add` it first.
- Text that depends on audience input should be a function, e.g. `text(() => name.value)`. A function is evaluated on every frame.
- Positions are in stage pixels on a 1920×1080 stage. `x` and `y` give an element's centre, except for `code()`, where `x` is the left edge.
- Steps play in order. Animations passed to a single `step(...)` call run in parallel. Use `sequence`, `stagger` and `delay` to arrange animations in time within a step.

## Changing the engine

- Keep the layers: `domain/` must not touch the DOM or `window`. Only type references to the Canvas API are allowed there, as in `Sketch`. `application/` uses only the domain. Browser code belongs in `infrastructure/`.
- Animations must be deterministic: `update(progress)` must depend only on `progress` and on the state captured in `start`. Seeking between steps relies on this.
- Do not add runtime dependencies. Animation and drawing are written by hand on purpose.
- TypeScript runs through Node's type stripping, both in the tests and in the scripts. That means:
  - erasable syntax only: no `enum`, no `namespace`, and no constructor parameter properties;
  - `import type` for imports used only as types;
  - every import path ends in `.ts`.
- Tests live next to the code as `*.test.ts` and use `node:test`. Test domain and application logic there. The canvas code is checked in the browser.
- Prefer small, intention-revealing names from the ubiquitous language: Presentation, Slide, Step, Entrance, Scene, Element, Animation, Morph, Presenter, Rehearsal, Surface, Sampler.
