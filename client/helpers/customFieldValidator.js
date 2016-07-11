
export function addCustomValidator(inputFieldSelector, validate, errorMsg = "", event = 'keyup') {
    document.querySelectorAll(inputFieldSelector).forEach((element) => {
        element.addEventListener(event, function() {
            let result = validate(this.value);

            if (result.hasOwnProperty('errorMsg')) {
                errorMsg = result.errorMsg;
                result = result.valid;
            }

            if ( !result ) {
                this.setCustomValidity(errorMsg);
            } else {
                this.setCustomValidity('');
            }
        });
    });
}