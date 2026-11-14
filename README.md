# Devtalk Presenter

Animated, interactive presentations for the browser, written as TypeScript scripts.

- **Slides are code.** A presentation is a plain `.ts` file, so you can review it, diff it, and let an AI agent help write it.
- **Live reload.** Save a file and the browser reloads on the same step, then plays that step again.
- **Morphs like manim.** Text morphs into text, images into text, and any element into any other.
- **Interactive.** A slide can ask the audience a question, and the answer becomes part of the animation.
- **Speaker view.** Notes, the next step and a timer in a second window that stays in step with the audience.
- **No runtime dependencies.** The rendering, animation and morphing are written from scratch on the Canvas 2D API. Vite and TypeScript are only used during development.

## Getting started

```sh
npm install
npm run dev
```

Open the URL Vite prints and pick a presentation. Node 22.18 or newer is required.

| Command                         | What it does                                          |
| ------------------------------- | ----------------------------------------------------- |
| `npm run dev`                   | Start the dev server with live reload                 |
| `npm run new -- my-talk`        | Create `src/presentations/my-talk/index.ts`           |
| `npm run remove -- my-talk`     | Delete `src/presentations/my-talk/`                   |
| `npm run build`                 | Build a static site into `dist/`                      |
| `npm run check`                 | Type-check, run the tests and build                   |

Each presentation lives in its own folder under `src/presentations/`, with its images next to it. Adding a folder adds the presentation, and deleting the folder removes it. No registry needs to be kept up to date.

## Presenting

| Key                                          | Action                                                       |
| -------------------------------------------- | ------------------------------------------------------------ |
| <kbd>→</kbd> <kbd>↓</kbd> <kbd>Space</kbd> <kbd>PgDn</kbd> | Next step. If an animation is playing, this finishes it first |
| <kbd>←</kbd> <kbd>↑</kbd> <kbd>PgUp</kbd>    | Previous step                                                |
| <kbd>Home</kbd> / <kbd>End</kbd>             | First / last slide                                           |
| Click or tap                                 | Next step                                                    |
| <kbd>F</kbd>                                 | Toggle fullscreen                                            |
| <kbd>S</kbd>                                 | Open the speaker view                                        |
| <kbd>Enter</kbd> in a field                  | Confirm the answer and go to the next step                   |
| <kbd>Esc</kbd> in a field                    | Leave the field                                              |

The URL keeps your place, as `#/<presentation>/<slide>/<step>`, so you can bookmark or share a link to any step.

### Speaker view

Press <kbd>S</kbd> while presenting to open the speaker view in a new window. Put it on your own screen and the presentation on the projector. It shows:

- the current step, and how the slide will look after the next one;
- the slide's notes;
- the slide and step you are on;
- the time since the speaker view opened. Click the time to restart it.

Moving in either window moves the other one too. The speaker view does not show fields, so answers typed during the talk appear only in the presentation window.

### Errors

If a script fails, the page shows the error and the slide it came from instead of going blank. Fix the script and save it, and the page reloads. A presentation that cannot be loaded at all is marked on the index page, and the other presentations keep working.

### Publishing

`npm run build` writes a static site to `dist/`. It uses relative paths, so you can host it from any folder, for example on GitHub Pages, or open it with `npm run preview`.

## Writing a presentation

```ts
import { fadeIn, morph, palette, presentation, slide, text } from '../../authoring.ts'

export default presentation('My talk', [
  slide('Title', ({ add, enter, step, notes }) => {
    const title = add(text('Hello', { size: 140, weight: 800 }))
    enter(fadeIn(title))                                      // plays when the slide appears
    step(morph(title, text('World', { color: palette.blue }))) // plays on the next →
    notes('Only the speaker view shows this.')
  }),

  slide('Question', ({ add, field, enter, step }) => {
    const question = add(text('Your name?', { y: 420 }))
    const name = field('name', { placeholder: 'Type, then press Enter', y: 580 })
    enter(fadeIn(question))
    step(morph(question, text(() => `Hi, ${name.value}!`)))  // text can be computed
  }),
])
```

A slide is a script. It receives a builder with five functions:

- `add(...elements)` puts elements on the slide, from back to front.
- `enter(...animations)` sets the entrance, which plays as soon as the slide is shown.
- `step(...animations)` adds a step, which plays on the next key press. Animations passed together play in parallel.
- `field(id, options)` adds a text input. Its `.value` is kept for the rest of the presentation.
- `notes(text)` adds speaker notes, which only the speaker view shows. Indentation is removed, so a template string works well.

The script runs again every time the slide is shown. Always create the slide's elements inside the script.

### Elements

Every element has `x`, `y` (its centre), `scale`, `rotation` (in degrees) and `opacity`. The stage is always 1920×1080, and `stage.center` is its middle.

| Factory                                     | Notes                                                                       |
| ------------------------------------------- | --------------------------------------------------------------------------- |
| `text(content, { size, weight, color, font, align, lineHeight })` | `content` can be a function, which is evaluated on every frame |
| `code(source, options)`                     | Monospaced and left-aligned. `x` is the left edge                           |
| `image(url, { width, height? })`            | Import the file to get its URL, e.g. `import logo from './logo.svg'`        |
| `rect({ width, height, radius, fill, stroke, lineWidth })` |                                                              |
| `circle({ radius, fill, stroke, lineWidth })` |                                                                           |
| `line({ from, to, color, lineWidth, arrow })` |                                                                           |
| `sketch((context, time) => …)`              | Draw anything with the Canvas 2D API. `time` is the number of seconds since the slide appeared |

Colours accept any CSS hex string, such as `'#58a6ff'`. `palette` has a matching set of colours.

### Animations

| Animation                                   | Effect                                                         |
| ------------------------------------------- | -------------------------------------------------------------- |
| `fadeIn`, `popIn`, `slideIn(el, dx, dy)`    | Reveal an element. It stays hidden until the animation plays   |
| `typewrite(text)`, `drawLine(line)`         | Reveal text or a line gradually                                |
| `fadeOut`, `moveTo(el, x, y)`, `scaleTo`, `rotateTo`, `recolor` | Change an element                          |
| `morph(from, to, { sweep })`                | Turn one element into another through particles                |
| `animate(object, { prop: value })`          | Tween any number on any object                                 |
| `tween((context) => (t) => …)`              | Write your own animation for `t` from 0 to 1                   |
| `parallel`, `sequence`, `stagger(gap, …)`, `delay(s, a)`, `wait(s)` | Compose animations                     |
| `call(fn)`                                  | Run code at a point in a timeline                              |

Effects, `morph`, `animate` and `tween` take `{ duration, ease }`, where `ease` is one of `ease.linear`, `in`, `out`, `inOut`, `back` or `elastic`.

`src/presentations/welcome/index.ts` shows every feature.

## How it works

The code follows domain-driven design, in layers that only depend inwards:

```
src/
  domain/          pure model, no DOM at all
    geometry/      numbers, colours, vectors
    animation/     Animation, tweens, timelines, effects, morph
    scene/         Element and its kinds, Scene, the Surface port
    morph/         point clouds and the Sampler port
    presentation/  Presentation, Slide, Outline
  application/     Presenter (the use case of presenting), rehearsal, Catalog
  infrastructure/  canvas, keyboard and pointer, URL, input overlay, speaker view
                   and window sync, error page, Vite module discovery
  authoring.ts     the one import presentation scripts need
  presentations/   your talks, one folder each
```

- An **Animation** has a `duration`, a `start(context)` method and an `update(progress)` method. `update` is deterministic, so `update(1)` always produces the final state. This is how the presenter can jump to any step: it rebuilds the slide and finishes every earlier step instantly.
- **Rehearsal** runs every slide script once at start-up. This counts the steps and collects the images to preload.
- A **morph** samples both elements into point clouds and pairs the points from left to right. It then flies the particles from one shape to the other, cross-fading with the real elements at both ends.
- The domain draws through the **Surface** port and samples through the **Sampler** port. The canvas implementations of both live in `infrastructure/`.

## License

MIT
