
export class ServerSyncCollection {
    constructor(collection, meteor) {
        this.collection = collection;
        this.meteor = meteor;
    }

    insert(clientCallback, ...args) {
        if (!this.meteor.isClient) {
            clientCallback = null;
        }
        return this.collection.insert(...args, clientCallback);
    }

    update(clientCallback, ...args) {
        if (!this.meteor.isClient) {
            clientCallback = null;
        }
        return this.collection.update(...args, clientCallback);
    }

    remove(...args) {
        return this.collection.remove(...args);
    }
}