export class RGBA {
  buffer: Float32Array

  constructor(buffer: Float32Array) {
    this.buffer = buffer
  }

  static fromArray(array: Float32Array) {
    return new RGBA(array)
  }

  static fromValues(r: number, g: number, b: number, a: number = 1.0) {
    return new RGBA(new Float32Array([r, g, b, a]))
  }

  static fromInts(r: number, g: number, b: number, a: number = 255) {
    return new RGBA(new Float32Array([r / 255, g / 255, b / 255, a / 255]))
  }

  static fromHex(hex: string): RGBA {
    return hexToRgb(hex)
  }

  toInts(): [number, number, number, number] {
    return [Math.round(this.r * 255), Math.round(this.g * 255), Math.round(this.b * 255), Math.round(this.a * 255)]
  }

  get r(): number {
    return this.buffer[0]
  }

  set r(value: number) {
    this.buffer[0] = value
  }

  get g(): number {
    return this.buffer[1]
  }

  set g(value: number) {
    this.buffer[1] = value
  }

  get b(): number {
    return this.buffer[2]
  }

  set b(value: number) {
    this.buffer[2] = value
  }

  get a(): number {
    return this.buffer[3]
  }

  set a(value: number) {
    this.buffer[3] = value
  }

  map<R>(fn: (value: number) => R) {
    return [fn(this.r), fn(this.g), fn(this.b), fn(this.a)]
  }

  toString() {
    return `rgba(${this.r.toFixed(2)}, ${this.g.toFixed(2)}, ${this.b.toFixed(2)}, ${this.a.toFixed(2)})`
  }

  equals(other?: RGBA): boolean {
    if (!other) return false
    return this.r === other.r && this.g === other.g && this.b === other.b && this.a === other.a
  }
}

export function hexToRgb(hex: string): RGBA {
  hex = hex.replace(/^#/, "")

  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  } else if (hex.length === 4) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
  }

  if (!/^[0-9A-Fa-f]{6}$/.test(hex) && !/^[0-9A-Fa-f]{8}$/.test(hex)) {
    console.warn(`Invalid hex color: ${hex}, defaulting to magenta`)
    return RGBA.fromValues(1, 0, 1, 1)
  }

  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255
  const a = hex.length === 8 ? parseInt(hex.substring(6, 8), 16) / 255 : 1

  return RGBA.fromValues(r, g, b, a)
}

export function rgbToHex(rgb: RGBA): string {
  const components = rgb.a === 1 ? [rgb.r, rgb.g, rgb.b] : [rgb.r, rgb.g, rgb.b, rgb.a]
  return (
    "#" +
    components
      .map((x) => {
        const hex = Math.floor(Math.max(0, Math.min(1, x) * 255)).toString(16)
        return hex.length === 1 ? "0" + hex : hex
      })
      .join("")
  )
}

export function hsvToRgb(h: number, s: number, v: number): RGBA {
  let r = 0,
    g = 0,
    b = 0

  const i = Math.floor(h / 60) % 6
  const f = h / 60 - Math.floor(h / 60)
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)

  switch (i) {
    case 0:
      r = v
      g = t
      b = p
      break
    case 1:
      r = q
      g = v
      b = p
      break
    case 2:
      r = p
      g = v
      b = t
      break
    case 3:
      r = p
      g = q
      b = v
      break
    case 4:
      r = t
      g = p
      b = v
      break
    case 5:
      r = v
      g = p
      b = q
      break
  }

  return RGBA.fromValues(r, g, b, 1)
}

const COLOR_TYPE = {
  rgba: 0,
  ansi16: 1,
} as const

const ANSI16_COLOR = {
  black: 0,
  red: 1,
  green: 2,
  yellow: 3,
  blue: 4,
  magenta: 5,
  cyan: 6,
  white: 7,
  brightBlack: 8,
  brightRed: 9,
  brightGreen: 10,
  brightYellow: 11,
  brightBlue: 12,
  brightMagenta: 13,
  brightCyan: 14,
  brightWhite: 15,
} as const

export class Color {
  // buffer[0]: type (0=rgba, 1=ansi16)
  // buffer[1]: r (0-1) or ANSI16 index (0-15)
  // buffer[2]: g (0-1) or 0
  // buffer[3]: b (0-1) or 0
  // buffer[4]: a (0-1) or 0
  private buffer: Float32Array

  private constructor(array: Float32Array) {
    if (array.length !== 5) throw new Error("Color buffer must have length 5 (1 for type, 4 for RGBA or ANSI16)")

    this.buffer = array
  }

  static from(type: keyof typeof COLOR_TYPE, color: number[]): Color {
    const buffer = new Float32Array(5)
    buffer[0] = COLOR_TYPE[type]
    buffer.set(color, 1)

    return new Color(buffer)
  }

  static fromRGBA(r: number, g: number, b: number, a: number = 1.0): Color {
    return Color.from("rgba", [r, g, b, a])
  }

  static fromANSI16(name: keyof typeof ANSI16_COLOR): Color {
    const index = ANSI16_COLOR[name]
    if (index === undefined) throw new Error(`Unknown ANSI color: ${name}`)

    return Color.from("ansi16", [index])
  }

  static fromHex(hex: string): Color {
    // todo: impl
    return Color.fromRGBA(0, 0, 0, 1)
  }

  is(type: keyof typeof COLOR_TYPE): boolean {
    return this.buffer[0] === COLOR_TYPE[type]
  }

  get r(): number {
    return this.is("rgba") ? this.buffer[1] : 0
  }
  set r(value: number) {
    if (!this.is("rgba")) throw new Error("Cannot set r value on non-rgba color")
    this.buffer[1] = value
  }

  get g(): number {
    return this.is("rgba") ? this.buffer[2] : 0
  }
  set g(value: number) {
    if (!this.is("rgba")) throw new Error("Cannot set g value on non-rgba color")
    this.buffer[2] = value
  }

  get b(): number {
    return this.is("rgba") ? this.buffer[3] : 0
  }
  set b(value: number) {
    if (!this.is("rgba")) throw new Error("Cannot set b value on non-rgba color")
    this.buffer[3] = value
  }

  get a(): number {
    return this.is("rgba") ? this.buffer[4] : 0
  }
  set a(value: number) {
    if (!this.is("rgba")) throw new Error("Cannot set a value on non-rgba color")
    this.buffer[4] = value
  }

  // toString(): string {
  //   if (this.is("rgba")) {
  //     return `rgba(${this.r.toFixed(2)}, ${this.g.toFixed(2)}, ${this.b.toFixed(2)}, ${this.a.toFixed(2)})`
  //   }
  //
  //   if (this.is("ansi16")) {
  //     const index = this.buffer[1]
  //     const name = Object.keys(ANSI16_COLOR).find((key) => ANSI16_COLOR[key as keyof typeof ANSI16_COLOR] === index)
  //     return `ansi(${name})`
  //   }
  //
  //   return "unknown color"
  // }
}

const COLORS = {
  transparent: Color.fromRGBA(0, 0, 0, 0),

  // rgba colors
  black: Color.fromHex("#000000"),
  white: Color.fromHex("#FFFFFF"),
  red: Color.fromHex("#FF0000"),
  green: Color.fromHex("#008000"),
  blue: Color.fromHex("#0000FF"),
  yellow: Color.fromHex("#FFFF00"),
  cyan: Color.fromHex("#00FFFF"),
  magenta: Color.fromHex("#FF00FF"),
  silver: Color.fromHex("#C0C0C0"),
  gray: Color.fromHex("#808080"),
  grey: Color.fromHex("#808080"),
  maroon: Color.fromHex("#800000"),
  olive: Color.fromHex("#808000"),
  lime: Color.fromHex("#00FF00"),
  aqua: Color.fromHex("#00FFFF"),
  teal: Color.fromHex("#008080"),
  navy: Color.fromHex("#000080"),
  fuchsia: Color.fromHex("#FF00FF"),
  purple: Color.fromHex("#800080"),
  orange: Color.fromHex("#FFA500"),
  brightblack: Color.fromHex("#666666"),
  brightred: Color.fromHex("#FF6666"),
  brightgreen: Color.fromHex("#66FF66"),
  brightblue: Color.fromHex("#6666FF"),
  brightyellow: Color.fromHex("#FFFF66"),
  brightcyan: Color.fromHex("#66FFFF"),
  brightmagenta: Color.fromHex("#FF66FF"),
  brightwhite: Color.fromHex("#FFFFFF"),

  // ansi16 colors
  "ansi(black)": Color.fromANSI16("black"),
  "ansi(red)": Color.fromANSI16("red"),
  "ansi(green)": Color.fromANSI16("green"),
  "ansi(yellow)": Color.fromANSI16("yellow"),
  "ansi(blue)": Color.fromANSI16("blue"),
  "ansi(magenta)": Color.fromANSI16("magenta"),
  "ansi(cyan)": Color.fromANSI16("cyan"),
  "ansi(white)": Color.fromANSI16("white"),
  "ansi(brightblack)": Color.fromANSI16("brightBlack"),
  "ansi(brightred)": Color.fromANSI16("brightRed"),
  "ansi(brightgreen)": Color.fromANSI16("brightGreen"),
  "ansi(brightyellow)": Color.fromANSI16("brightYellow"),
  "ansi(brightblue)": Color.fromANSI16("brightBlue"),
  "ansi(brightmagenta)": Color.fromANSI16("brightMagenta"),
  "ansi(brightcyan)": Color.fromANSI16("brightCyan"),
  "ansi(brightwhite)": Color.fromANSI16("brightWhite"),
} as const satisfies Record<string, Color>

type ColorInput = Color | keyof typeof COLORS | (string & {})

export function parseColor(color: ColorInput): Color {
  if (typeof color === "string") {
    const lowerColor = color.toLowerCase()

    if (lowerColor in COLORS) {
      return COLORS[lowerColor as keyof typeof COLORS]
    }

    return hexToColor(color)
  }

  return color
}
