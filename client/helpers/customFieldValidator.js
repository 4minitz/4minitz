
export function addCustomValidator(inputFieldSelector, validate, errorMsg) {
    document.querySelectorAll(inputFieldSelector).forEach((element) => {
        element.addEventListener('keyup', function() {
            if ( !validate(this.value) ) {
                this.setCustomValidity(errorMsg);
            } else {
                this.setCustomValidity('');
            }
        });
    });
}