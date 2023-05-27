const glsl = x => x

const pane = new Tweakpane.Pane()

const params = {
  threshold: 0.5,
  interval: 4,
  overlap: 2,
  reverse: false,

  positionX: 0,
  positionY: 0,
  rotate: 0,
  scale: 2,

  positionXRandom: 500,
  positionYRandom: 500,
  rotateRandom: 180,
  scaleRandom: 3,
}

const base = pane.addFolder({ title: '基本' })
const tweak = pane.addFolder({ title: '微調整' })
const random = pane.addFolder({ title: '乱数' })

base.addInput(params, 'threshold', { min: 0, max: 1, step: 0.01, label: '閾値' })
base.addInput(params, 'interval', { min: 1, max: 10, step: 1, label: '間隔' })
base.addInput(params, 'overlap', { min: 1, max: 10, step: 1, label: '重なり' })
base.addInput(params, 'reverse', { label: '反転' })

tweak.addInput(params, 'positionX', { min: -1000, max: 1000, step: 1, label: '位置X' })
tweak.addInput(params, 'positionY', { min: -1000, max: 1000, step: 1, label: '位置Y' })
tweak.addInput(params, 'rotate', { min: -180, max: 180, step: 1, label: '回転' })
tweak.addInput(params, 'scale', { min: 1, max: 5, step: 0.01, label: '拡大' })

random.addInput(params, 'positionXRandom', { min: 0, max: 1000, step: 1, label: '位置Xの乱数' })
random.addInput(params, 'positionYRandom', { min: 0, max: 1000, step: 1, label: '位置Yの乱数' })
random.addInput(params, 'rotateRandom', { min: 0, max: 360, step: 1, label: '回転の乱数' })
random.addInput(params, 'scaleRandom', { min: 0, max: 5, step: 0.01, label: '拡大の乱数' })

let img
let main
let sub

function setup() {
  let ratio = min(windowWidth / 1920, windowHeight / 1080)
  let w = 1920 * ratio
  let h = 1080 * ratio

  let canvas = createCanvas(w, h)
  canvas.drop(dropFile)
  angleMode(DEGREES)
  frameRate(30)
  imageMode(CENTER)

  main = createGraphics(1920, 1080, WEBGL)
  sub = createGraphics(1920, 1080, WEBGL)
}

function draw() {
  background(0)
  translate(width / 2, height / 2)

  if (!img) {
    return
  }

  let idx = floor(frameCount / params.interval)

  let vert = glsl`
  attribute vec3 aPosition;
  attribute vec2 aTexCoord;

  varying vec2 uv;

  void main() {
    uv = aTexCoord;
    uv.y = 1.0 - uv.y;
    vec4 positionVec4 = vec4(aPosition, 1.0);
    positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
    gl_Position = positionVec4;
  }
  `

  let frag = glsl`
  precision highp float;

  varying vec2 uv;

  uniform sampler2D u_tex;

  uniform float threshold;

  uniform bool reverse;

  void main() {
    vec4 color = texture2D(u_tex, uv);

    float gray = (color.r + color.g + color.b) / 3.0;

    color = vec4(step(threshold, gray));

    if (reverse) {
      color = vec4(1.0) - color;
    }

    gl_FragColor = color;
  }
  `

  main.clear()
  main.background(0)

  for (let i = 0; i < params.overlap; i++) {
    sub.clear()
    sub.angleMode(DEGREES)
    sub.imageMode(CENTER)
    sub.randomSeed((idx + i) * 1000)
    sub.push()
    sub.translate(
      params.positionX + sub.random(-params.positionXRandom, params.positionXRandom),
      params.positionY + sub.random(-params.positionYRandom, params.positionYRandom))
    sub.rotate(params.rotate + sub.random(-params.rotateRandom, params.rotateRandom))
    sub.scale(params.scale + sub.random(0, params.scaleRandom))
    sub.image(img, 0, 0, 1920, 1080) 
    sub.pop()
    let sh = main.createShader(vert[0], frag[0])
    main.shader(sh)
    sh.setUniform('u_tex', sub)
    sh.setUniform('threshold', params.threshold)
    sh.setUniform('reverse', params.reverse)
    main.rect(0, 0, 1920, 1080)
  }

  image(main, 0, 0)
}

function dropFile(file) {
  img = loadImage(file.data, () => {})
}
