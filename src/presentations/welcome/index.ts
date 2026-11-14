import {
  animate,
  circle,
  code,
  delay,
  drawLine,
  ease,
  fadeIn,
  fadeOut,
  fonts,
  image,
  line,
  morph,
  moveTo,
  palette,
  parallel,
  popIn,
  presentation,
  recolor,
  rect,
  sequence,
  sketch,
  slide,
  slideIn,
  stage,
  stagger,
  text,
  typewrite,
} from '../../authoring.ts'
import logo from './logo.svg'

export default presentation('Welcome to Devtalk Presenter', [
  slide('Title', ({ add, enter }) => {
    add(sketch(drift))
    const title = add(text('Devtalk Presenter', { size: 150, weight: 800, y: 470 }))
    const subtitle = add(text('Presentations, written as code', { size: 52, color: palette.muted, y: 600 }))
    enter(sequence(popIn(title), typewrite(subtitle)))
  }),

  slide('Slides are scripts', ({ add, enter, step }) => {
    const heading = add(text('Slides are scripts', { size: 88, weight: 800, y: 170 }))
    const panel = add(rect({ width: 1160, height: 440, radius: 28, y: 540, fill: palette.surface, stroke: palette.border, lineWidth: 2 }))
    const snippet = add(
      code(
        [
          "slide('Hello', ({ add, enter, step }) => {",
          "  const hello = add(text('Hello'))",
          '  enter(fadeIn(hello))',
          "  step(morph(hello, text('World')))",
          '})',
        ].join('\n'),
        { x: 460, y: 540, color: palette.blue },
      ),
    )
    const hint = add(text('Save the file and the browser reloads right on this step', { size: 40, color: palette.muted, y: 900 }))
    enter(slideIn(heading, 0, -60), fadeIn(panel), delay(0.4, typewrite(snippet)))
    step(slideIn(hint, 0, 40))
  }),

  slide('Text morphs into text', ({ add, enter, step }) => {
    const words = [
      text('Hello', { size: 220, weight: 800, color: palette.blue }),
      text('Bonjour', { size: 220, weight: 800, color: palette.purple }),
      text('Hola', { size: 220, weight: 800, color: palette.orange }),
      text('Hej!', { size: 220, weight: 800, color: palette.green }),
    ]
    enter(fadeIn(add(words[0])))
    words.slice(1).forEach((word, index) => step(morph(words[index], word)))
  }),

  slide('Images morph too', ({ add, enter, step }) => {
    const picture = add(image(logo, { width: 440 }))
    const word = text('{ devtalk }', { size: 180, weight: 800, color: palette.blue })
    const badge = image(logo, { width: 200, x: 1640, y: 860 })
    enter(popIn(picture))
    step(morph(picture, word, { duration: 2 }))
    step(morph(word, badge, { sweep: 0.8 }))
  }),

  slide('Slides can listen', ({ add, field, enter, step }) => {
    const question = add(text('What should we call you?', { size: 84, weight: 800, y: 400 }))
    const name = field('name', { placeholder: 'Type a name, then press Enter', width: 960, y: 580 })
    const visitor = () => name.value.trim() || 'stranger'
    const greeting = text(() => `Hello, ${visitor()}!`, { size: 130, weight: 800, color: palette.green })
    enter(slideIn(question, 0, -60), fadeIn(name))
    step(fadeOut(name, { duration: 0.3 }), morph(question, greeting))
    step(morph(greeting, wave(visitor)))
  }),

  slide('Diagrams draw themselves', ({ add, enter, step }) => {
    const heading = add(text('Shapes, arrows and anything else', { size: 72, weight: 800, y: 200 }))
    const columns = [460, 960, 1460]
    const boxes = ['Browser', 'API', 'Database'].map((label, index) => [
      add(rect({ x: columns[index], width: 320, height: 160, radius: 24, fill: palette.surface, stroke: palette.blue, lineWidth: 3 })),
      add(text(label, { x: columns[index], size: 46 })),
    ])
    const arrows = [0, 1].map((index) =>
      add(line({ from: { x: columns[index] + 175, y: 540 }, to: { x: columns[index + 1] - 185, y: 540 }, color: palette.muted, arrow: true })),
    )
    const packet = add(circle({ x: columns[0], y: 540, radius: 18, fill: palette.green }))

    enter(fadeIn(heading), stagger(0.2, ...boxes.map((parts) => parallel(...parts.map((part) => popIn(part))))))
    step(stagger(0.3, ...arrows.map((arrow) => drawLine(arrow))))
    step(
      sequence(
        popIn(packet, { duration: 0.3 }),
        moveTo(packet, columns[2], 540, { duration: 1.4 }),
        recolor(packet, palette.orange, { duration: 0.3 }),
        moveTo(packet, columns[0], 540, { duration: 1.4 }),
      ),
    )
  }),

  slide('Animate anything', ({ add, enter, step }) => {
    const wave = { amplitude: 0, frequency: 1 }
    add(text('animate() tweens any number on any object', { size: 64, weight: 800, y: 200 }))
    add(
      sketch((context, time) => {
        context.strokeStyle = palette.purple
        context.lineWidth = 8
        context.lineCap = 'round'
        context.beginPath()
        for (let x = 160; x <= stage.width - 160; x += 8) {
          const y = 600 + Math.sin((x / 240) * wave.frequency + time * 2) * wave.amplitude
          if (x === 160) context.moveTo(x, y)
          else context.lineTo(x, y)
        }
        context.stroke()
      }),
    )
    enter(animate(wave, { amplitude: 160 }, { duration: 1.6, ease: ease.elastic }))
    step(animate(wave, { frequency: 3 }, { duration: 1.5 }))
    step(animate(wave, { amplitude: 0 }, { ease: ease.in }))
  }),

  slide('Your turn', ({ add, enter }) => {
    const title = add(text('Your turn', { size: 160, weight: 800, y: 420 }))
    const create = add(code('npm run new -- my-talk', { x: stage.center.x, y: 600, size: 48, align: 'center', color: palette.green }))
    const remove = add(code('npm run remove -- my-talk', { x: stage.center.x, y: 690, size: 36, align: 'center', color: palette.muted }))
    enter(popIn(title), delay(0.5, sequence(typewrite(create), fadeIn(remove))))
  }),
])

/** Dots drifting slowly across the stage. */
function drift(context: CanvasRenderingContext2D, time: number): void {
  context.fillStyle = palette.border
  for (let index = 0; index < 90; index++) {
    const x = (index * 241 + time * (14 + (index % 7) * 5)) % stage.width
    const y = ((index * 137) % stage.height) + Math.sin(time + index) * 14
    context.beginPath()
    context.arc(x, y, 2 + (index % 3), 0, Math.PI * 2)
    context.fill()
  }
}

/** A word whose letters ride a rainbow wave. */
function wave(word: () => string) {
  return sketch((context, time) => {
    const letters = [...word()]
    context.font = `800 150px ${fonts.sans}`
    context.textBaseline = 'middle'
    const widths = letters.map((letter) => context.measureText(letter).width)
    let x = stage.center.x - widths.reduce((total, width) => total + width, 0) / 2
    letters.forEach((letter, index) => {
      context.fillStyle = `hsl(${(time * 60 + index * 35) % 360} 85% 65%)`
      context.fillText(letter, x, stage.center.y + Math.sin(time * 3 + index * 0.6) * 40)
      x += widths[index]
    })
  })
}
