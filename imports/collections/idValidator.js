import { _ } from "lodash";
import { Validator } from "meteor/jagi:astronomy";

const regExId =
  /^[23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz]{17}$/;

Validator.create({
  name: "meteorId",
  isValid({ value }) {
    if (Array.isArray(value)) {
      return _.map(value, (a) => regExId.test(a)).reduce(
        (previous, current) => previous && current,
        true,
      );
    }
    return regExId.test(value);
  },
  resolveError({ name }) {
    return `"${name}" is not a meteor id`;
  },
});
