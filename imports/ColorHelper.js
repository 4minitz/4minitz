export class ColorHelper {
  static hex2rgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  static isDarkColor(color) {
    if (typeof color === "string") {
      color = ColorHelper.hex2rgb(color);
    }
    const o = Math.round(
      (parseInt(color.r) * 299 +
        parseInt(color.g) * 587 +
        parseInt(color.b) * 114) /
        1000,
    );
    return o < 125;
  }

  static isValidHexColorString(hexString) {
    if (hexString === null || hexString === "" || hexString === "#")
      return false;
    return ColorHelper.hex2rgb(hexString) !== null;
  }
}
