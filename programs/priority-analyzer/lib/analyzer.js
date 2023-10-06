

export class Analyzer {

    constructor() {
        this.tokens = {};
    }

    analyseActionItem(item) {
        const priority = item.priority;
        if (!priority) {
            return;
        }
        const token = this.getToken(priority);
        if (token) {
            token.counter++;
        } else {
            this.addToken(priority);
        }
    }

    getToken(priority) {
        return this.tokens[priority.toUpperCase()];
    }

    addToken(priority) {
        this.tokens[priority.toUpperCase()] = { counter: 1 };
    }
}
