import { FlashMessage } from './flashMessage';

export function handleError(error, title = 'Error') {
    (new FlashMessage(title, error.reason)).show();
}