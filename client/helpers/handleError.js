import { FlashMessage } from "./flashMessage";
import { i18n } from "meteor/universe:i18n";

export function handleError(error, title = i18n.__("FlashMessages.error")) {
  if (!error) {
    return;
  }
  new FlashMessage(title, error.reason).show();
}
