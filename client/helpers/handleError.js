import { FlashMessage } from './flashMessage';

export function handleError(error, title = 'Error') {
    if (!error) {
        return;
    }
    (new FlashMessage(title, error.reason)).show();
}