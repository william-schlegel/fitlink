import convert from "color-convert";

import type { CMYK, HSL, HSV, HWB, LAB, LCH } from "color-convert";

// Color space types as arrays
type RGBArray = [number, number, number]; // [0-255, 0-255, 0-255]
type HSLArray = [number, number, number]; // [0-360, 0-100, 0-100]
type HSVArray = [number, number, number]; // [0-360, 0-100, 0-100]
type HWBArray = [number, number, number]; // [0-360, 0-100, 0-100]
type CMYKArray = [number, number, number, number]; // [0-100, 0-100, 0-100, 0-100]
type XYZArray = [number, number, number]; // [0-95.047, 0-100, 0-108.883]
type LABArray = [number, number, number]; // [0-100, -128-127, -128-127]
type LCHArray = [number, number, number]; // [0-100, 0-230, 0-360]
type OKLCHArray = [number, number, number]; // [0-1, 0-0.4, 0-360]
type OKLABArray = [number, number, number]; // [0-1, -0.4-0.4, -0.4-0.4]

interface ParsedColor {
  type:
    | "hex"
    | "rgb"
    | "hsl"
    | "hsv"
    | "hwb"
    | "cmyk"
    | "xyz"
    | "lab"
    | "lch"
    | "oklch"
    | "oklab"
    | "unknown";
  values: number[];
  alpha?: number;
}

const DEFAULT_COLOR = "#000000";

// ============================================================================
// CSS String Parsers - Convert CSS color strings to number arrays
// ============================================================================

/**
 * Parse a hex color string to RGB array
 * Supports: #RGB, #RGBA, #RRGGBB, #RRGGBBAA
 */
function parseHex(hex: string): { rgb: RGBArray; alpha?: number } | null {
  const cleaned = hex.trim().replace("#", "");

  let r: number, g: number, b: number, a: number | undefined;

  if (cleaned.length === 3) {
    // #RGB
    r = parseInt(cleaned[0] + cleaned[0], 16);
    g = parseInt(cleaned[1] + cleaned[1], 16);
    b = parseInt(cleaned[2] + cleaned[2], 16);
  } else if (cleaned.length === 4) {
    // #RGBA
    r = parseInt(cleaned[0] + cleaned[0], 16);
    g = parseInt(cleaned[1] + cleaned[1], 16);
    b = parseInt(cleaned[2] + cleaned[2], 16);
    a = parseInt(cleaned[3] + cleaned[3], 16) / 255;
  } else if (cleaned.length === 6) {
    // #RRGGBB
    r = parseInt(cleaned.substring(0, 2), 16);
    g = parseInt(cleaned.substring(2, 4), 16);
    b = parseInt(cleaned.substring(4, 6), 16);
  } else if (cleaned.length === 8) {
    // #RRGGBBAA
    r = parseInt(cleaned.substring(0, 2), 16);
    g = parseInt(cleaned.substring(2, 4), 16);
    b = parseInt(cleaned.substring(4, 6), 16);
    a = parseInt(cleaned.substring(6, 8), 16) / 255;
  } else {
    return null;
  }

  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;

  return { rgb: [r, g, b], alpha: a };
}

/**
 * Parse a CSS function color string like rgb(), hsl(), oklch(), etc.
 * Returns the numeric values and optional alpha
 */
function parseCssFunction(
  str: string,
): { name: string; values: number[]; alpha?: number } | null {
  // Match patterns like: rgb(255, 128, 0), rgb(255 128 0), rgb(255 128 0 / 0.5), oklch(70% 0.15 200)
  const match = str.trim().match(/^(\w+)\s*\(\s*(.+?)\s*\)$/);
  if (!match) return null;

  const name = match[1].toLowerCase();
  let valuesStr = match[2];

  // Handle alpha separator
  let alpha: number | undefined;
  if (valuesStr.includes("/")) {
    const [colorPart, alphaPart] = valuesStr.split("/").map((s) => s.trim());
    valuesStr = colorPart;
    const alphaValue = alphaPart.trim();
    if (alphaValue.endsWith("%")) {
      alpha = parseFloat(alphaValue) / 100;
    } else {
      alpha = parseFloat(alphaValue);
    }
  }

  // Parse values (handle both comma and space separation)
  const rawValues = valuesStr.includes(",")
    ? valuesStr.split(",").map((s) => s.trim())
    : valuesStr.split(/\s+/).filter((s) => s.length > 0);

  const values = rawValues.map((v, index) => {
    const trimmed = v.trim();

    // Handle percentage values
    if (trimmed.endsWith("%")) {
      const percent = parseFloat(trimmed);

      // Context-dependent percentage conversion
      if (name === "rgb" || name === "rgba") {
        return (percent / 100) * 255;
      } else if (name === "oklch" || name === "oklab") {
        // For oklch: L is 0-1, C is 0-0.4, H is 0-360
        if (index === 0) return percent / 100; // L: percentage to 0-1
        if (index === 1) return (percent / 100) * 0.4; // C: percentage to 0-0.4
        return percent * 3.6; // H: percentage to degrees
      } else if (
        name === "hsl" ||
        name === "hsla" ||
        name === "hsv" ||
        name === "hwb"
      ) {
        // For hsl: H is degrees (not percentage), S and L are 0-100
        if (index === 0) return percent * 3.6; // H: percentage to degrees
        return percent; // S, L: already 0-100
      } else if (name === "lab" || name === "lch") {
        if (index === 0) return percent; // L: 0-100
        return percent; // a, b, c, h: keep as-is for now
      }
      return percent;
    }

    // Handle degree values
    if (trimmed.endsWith("deg")) {
      return parseFloat(trimmed);
    }

    // Handle turn values (1turn = 360deg)
    if (trimmed.endsWith("turn")) {
      return parseFloat(trimmed) * 360;
    }

    // Handle rad values
    if (trimmed.endsWith("rad")) {
      return (parseFloat(trimmed) * 180) / Math.PI;
    }

    // Handle grad values (400grad = 360deg)
    if (trimmed.endsWith("grad")) {
      return (parseFloat(trimmed) * 360) / 400;
    }

    return parseFloat(trimmed);
  });

  return { name, values, alpha };
}

/**
 * Parse RGB/RGBA CSS string to RGB array
 * Supports: rgb(255, 128, 0), rgb(255 128 0), rgba(255, 128, 0, 0.5)
 */
function parseRgb(str: string): { rgb: RGBArray; alpha?: number } | null {
  const parsed = parseCssFunction(str);
  if (!parsed || (parsed.name !== "rgb" && parsed.name !== "rgba")) return null;
  if (parsed.values.length < 3) return null;

  const rgb: RGBArray = [
    Math.round(Math.max(0, Math.min(255, parsed.values[0]))),
    Math.round(Math.max(0, Math.min(255, parsed.values[1]))),
    Math.round(Math.max(0, Math.min(255, parsed.values[2]))),
  ];

  // RGBA with alpha as 4th value
  let alpha = parsed.alpha;
  if (parsed.values.length >= 4 && alpha === undefined) {
    alpha = parsed.values[3];
  }

  return { rgb, alpha };
}

/**
 * Parse HSL/HSLA CSS string to HSL array
 * Supports: hsl(200, 50%, 50%), hsl(200 50% 50%), hsla(200, 50%, 50%, 0.5)
 */
function parseHsl(str: string): { hsl: HSLArray; alpha?: number } | null {
  const parsed = parseCssFunction(str);
  if (!parsed || (parsed.name !== "hsl" && parsed.name !== "hsla")) return null;
  if (parsed.values.length < 3) return null;

  const hsl: HSLArray = [
    ((parsed.values[0] % 360) + 360) % 360, // Normalize hue to 0-360
    Math.max(0, Math.min(100, parsed.values[1])),
    Math.max(0, Math.min(100, parsed.values[2])),
  ];

  let alpha = parsed.alpha;
  if (parsed.values.length >= 4 && alpha === undefined) {
    alpha = parsed.values[3];
  }

  return { hsl, alpha };
}

/**
 * Parse HSV CSS string to HSV array
 */
function parseHsv(str: string): { hsv: HSVArray; alpha?: number } | null {
  const parsed = parseCssFunction(str);
  if (!parsed || parsed.name !== "hsv") return null;
  if (parsed.values.length < 3) return null;

  const hsv: HSVArray = [
    ((parsed.values[0] % 360) + 360) % 360,
    Math.max(0, Math.min(100, parsed.values[1])),
    Math.max(0, Math.min(100, parsed.values[2])),
  ];

  return { hsv, alpha: parsed.alpha };
}

/**
 * Parse HWB CSS string to HWB array
 */
function parseHwb(str: string): { hwb: HWBArray; alpha?: number } | null {
  const parsed = parseCssFunction(str);
  if (!parsed || parsed.name !== "hwb") return null;
  if (parsed.values.length < 3) return null;

  const hwb: HWBArray = [
    ((parsed.values[0] % 360) + 360) % 360,
    Math.max(0, Math.min(100, parsed.values[1])),
    Math.max(0, Math.min(100, parsed.values[2])),
  ];

  return { hwb, alpha: parsed.alpha };
}

/**
 * Parse LAB CSS string to LAB array
 * Supports: lab(50% 40 -30), lab(50 40 -30)
 */
function parseLab(str: string): { lab: LABArray; alpha?: number } | null {
  const parsed = parseCssFunction(str);
  if (!parsed || parsed.name !== "lab") return null;
  if (parsed.values.length < 3) return null;

  const lab: LABArray = [
    Math.max(0, Math.min(100, parsed.values[0])),
    Math.max(-128, Math.min(127, parsed.values[1])),
    Math.max(-128, Math.min(127, parsed.values[2])),
  ];

  return { lab, alpha: parsed.alpha };
}

/**
 * Parse LCH CSS string to LCH array
 * Supports: lch(50% 30 200), lch(50 30 200deg)
 */
function parseLch(str: string): { lch: LCHArray; alpha?: number } | null {
  const parsed = parseCssFunction(str);
  if (!parsed || parsed.name !== "lch") return null;
  if (parsed.values.length < 3) return null;

  const lch: LCHArray = [
    Math.max(0, Math.min(100, parsed.values[0])),
    Math.max(0, Math.min(230, parsed.values[1])),
    ((parsed.values[2] % 360) + 360) % 360,
  ];

  return { lch, alpha: parsed.alpha };
}

/**
 * Parse OKLCH CSS string to OKLCH array
 * Supports: oklch(70% 0.15 200), oklch(0.7 0.15 200deg)
 */
function parseOklch(str: string): { oklch: OKLCHArray; alpha?: number } | null {
  const parsed = parseCssFunction(str);
  if (!parsed || parsed.name !== "oklch") return null;
  if (parsed.values.length < 3) return null;

  const oklch: OKLCHArray = [
    Math.max(0, Math.min(1, parsed.values[0])),
    Math.max(0, Math.min(0.4, parsed.values[1])),
    ((parsed.values[2] % 360) + 360) % 360,
  ];

  return { oklch, alpha: parsed.alpha };
}

/**
 * Parse OKLAB CSS string to OKLAB array
 */
function parseOklab(str: string): { oklab: OKLABArray; alpha?: number } | null {
  const parsed = parseCssFunction(str);
  if (!parsed || parsed.name !== "oklab") return null;
  if (parsed.values.length < 3) return null;

  const oklab: OKLABArray = [
    Math.max(0, Math.min(1, parsed.values[0])),
    Math.max(-0.4, Math.min(0.4, parsed.values[1])),
    Math.max(-0.4, Math.min(0.4, parsed.values[2])),
  ];

  return { oklab, alpha: parsed.alpha };
}

/**
 * Parse CMYK CSS string to CMYK array
 */
function parseCmyk(str: string): { cmyk: CMYKArray; alpha?: number } | null {
  const parsed = parseCssFunction(str);
  if (!parsed || (parsed.name !== "cmyk" && parsed.name !== "device-cmyk"))
    return null;
  if (parsed.values.length < 4) return null;

  const cmyk: CMYKArray = [
    Math.max(0, Math.min(100, parsed.values[0])),
    Math.max(0, Math.min(100, parsed.values[1])),
    Math.max(0, Math.min(100, parsed.values[2])),
    Math.max(0, Math.min(100, parsed.values[3])),
  ];

  return { cmyk, alpha: parsed.alpha };
}

// ============================================================================
// Universal Color Parser
// ============================================================================

/**
 * Parse any CSS color string and return its type and values
 */
function parseColor(colorStr: string): ParsedColor {
  const str = colorStr.trim().toLowerCase();

  // Hex colors
  if (str.startsWith("#")) {
    const result = parseHex(str);
    if (result) {
      return { type: "hex", values: result.rgb, alpha: result.alpha };
    }
  }

  // RGB/RGBA
  if (str.startsWith("rgb")) {
    const result = parseRgb(str);
    if (result) {
      return { type: "rgb", values: result.rgb, alpha: result.alpha };
    }
  }

  // HSL/HSLA
  if (str.startsWith("hsl")) {
    const result = parseHsl(str);
    if (result) {
      return { type: "hsl", values: result.hsl, alpha: result.alpha };
    }
  }

  // HSV
  if (str.startsWith("hsv")) {
    const result = parseHsv(str);
    if (result) {
      return { type: "hsv", values: result.hsv, alpha: result.alpha };
    }
  }

  // HWB
  if (str.startsWith("hwb")) {
    const result = parseHwb(str);
    if (result) {
      return { type: "hwb", values: result.hwb, alpha: result.alpha };
    }
  }

  // LAB
  if (str.startsWith("lab")) {
    const result = parseLab(str);
    if (result) {
      return { type: "lab", values: result.lab, alpha: result.alpha };
    }
  }

  // LCH
  if (str.startsWith("lch")) {
    const result = parseLch(str);
    if (result) {
      return { type: "lch", values: result.lch, alpha: result.alpha };
    }
  }

  // OKLCH
  if (str.startsWith("oklch")) {
    const result = parseOklch(str);
    if (result) {
      return { type: "oklch", values: result.oklch, alpha: result.alpha };
    }
  }

  // OKLAB
  if (str.startsWith("oklab")) {
    const result = parseOklab(str);
    if (result) {
      return { type: "oklab", values: result.oklab, alpha: result.alpha };
    }
  }

  // CMYK
  if (str.startsWith("cmyk") || str.startsWith("device-cmyk")) {
    const result = parseCmyk(str);
    if (result) {
      return { type: "cmyk", values: result.cmyk, alpha: result.alpha };
    }
  }

  return { type: "unknown", values: [] };
}

// ============================================================================
// Unified Conversion Functions
// ============================================================================

/**
 * Convert any CSS color string to RGB array
 */
export function colorToRgb(colorStr: string): RGBArray {
  const parsed = parseColor(colorStr);

  switch (parsed.type) {
    case "hex":
    case "rgb":
      return parsed.values as RGBArray;
    case "hsl":
      return convert.hsl.rgb(parsed.values as HSL);
    case "hsv":
      return convert.hsv.rgb(parsed.values as HSV);
    case "hwb":
      return convert.hwb.rgb(parsed.values as HWB);
    case "lab":
    case "oklab":
      return convert.lab.rgb(parsed.values as LAB);
    case "lch":
    case "oklch":
      return convert.lch.rgb(parsed.values as LCH);
    case "cmyk":
      return convert.cmyk.rgb(parsed.values as CMYK);
    default:
      return [0, 0, 0];
  }
}

/**
 * Convert any CSS color string to HSL array
 */
export function colorToHsl(colorStr: string): HSLArray {
  const rgb = colorToRgb(colorStr);
  return convert.rgb.hsl(rgb);
}

/**
 * Convert any CSS color string to Hex string
 */
export function colorToHex(colorStr: string): string {
  const rgb = colorToRgb(colorStr);
  return `#${convert.rgb.hex(rgb)}`;
}

/**
 * Convert any CSS color string to LAB array
 */
export function colorToLab(colorStr: string): LABArray {
  const rgb = colorToRgb(colorStr);
  return convert.rgb.lab(rgb);
}

/**
 * Convert any CSS color string to LCH array
 */
export function colorToLch(colorStr: string): LCHArray {
  const rgb = colorToRgb(colorStr);
  return convert.rgb.lch(rgb);
}

/**
 * Convert any CSS color string to OKLCH array
 */
export function colorToOklch(colorStr: string): OKLCHArray {
  const rgb = colorToRgb(colorStr);
  return convert.rgb.lch(rgb);
}

/**
 * Convert any CSS color string to OKLAB array
 */
export function colorToOklab(colorStr: string): OKLABArray {
  const rgb = colorToRgb(colorStr);
  return convert.rgb.lab(rgb);
}

/**
 * Convert any CSS color string to XYZ array
 */
export function colorToXyz(colorStr: string): XYZArray {
  const rgb = colorToRgb(colorStr);
  return convert.rgb.xyz(rgb);
}

/**
 * Convert any CSS color string to CMYK array
 */
export function colorToCmyk(colorStr: string): CMYKArray {
  const rgb = colorToRgb(colorStr);
  return convert.rgb.cmyk(rgb);
}

// ============================================================================
// CSS Variable Helper
// ============================================================================

/**
 * Get the computed value of a CSS variable and convert to hex
 * @param cssVar CSS variable name (e.g., "--primary", "var(--primary)")
 * @param element Optional element to get the computed style from (defaults to document.documentElement)
 * @returns Hex color string or DEFAULT_COLOR if resolution fails
 */
export function cssVarToHex(cssVar: string, element?: Element | null): string {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return DEFAULT_COLOR;
  }

  // Normalize the CSS variable name (handle both "--primary" and "var(--primary)")
  let varName = cssVar.trim();
  const varMatch = varName.match(/^var\(\s*(--[\w-]+)\s*\)$/);
  if (varMatch) varName = varMatch[1];

  // Ensure it starts with --
  if (!varName.startsWith("--")) varName = `--${varName}`;

  const targetElement = element ?? document.documentElement;
  const computedValue = getComputedStyle(targetElement)
    .getPropertyValue(varName)
    .trim();

  if (!computedValue) return DEFAULT_COLOR;

  return colorToHex(computedValue);
}
