
function popCallbackFromArgs(args) {
    // Pull off any callback (or perhaps a 'callback' variable that was passed)
    if (args.length &&
        (args[args.length - 1] === undefined ||
        args[args.length - 1] instanceof Function)) {
        return args.pop();
    }
}

/**
 * Simple wrapper for Collections to make sure the collection-calls
 * will be done synchronously on the server and asynchronously on
 * the client.
 *
 * All methods accept a callback-function as last parameter
 * which will only be used on the client.
 */
export class ServerSyncCollection {
    constructor(collection, meteor) {
        this.collection = collection;
        this.meteor = meteor;
    }

    insert(...args) {
        let clientCallback = popCallbackFromArgs(args);
        if (!this.meteor.isClient) {
            clientCallback = null;
        }
        return this.collection.insert(...args, clientCallback);
    }

    update(...args) {
        let clientCallback = popCallbackFromArgs(args);
        if (!this.meteor.isClient) {
            clientCallback = null;
        }
        return this.collection.update(...args, clientCallback);
    }

    remove(...args) {
        let clientCallback = popCallbackFromArgs(args);
        if (!this.meteor.isClient) {
            clientCallback = null;
        }
        return this.collection.remove(...args, clientCallback);
    }
}