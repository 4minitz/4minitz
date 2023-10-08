export class RangeHelper {
  static convertRangeToMinMaxObject(range, fallbackResult) {
    let min, max;

    if (isNaN(range)) {
      const array = range ? range.split("-") : [];
      if (array.length > 1) {
        min = parseInt(array[0], 10);
        max = parseInt(array[1], 10);
      } else {
        return fallbackResult;
      }
    } else {
      min = max = parseInt(range, 10);
    }

    return {
      min,
      max,
    };
  }
}
