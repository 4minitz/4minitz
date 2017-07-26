import {Analyzer} from './lib/analyzer';
import {ItemIterator} from './lib/item-iterator';

const MONGO_URL = 'mongodb://localhost:3101/meteor';

async function main() {
    try {

        const analyzer = new Analyzer();
        const iterator = new ItemIterator(MONGO_URL, analyzer);
        await iterator.execute();
        console.log(JSON.stringify(analyzer.tokens));

    } catch (e) {
        if (!e.stack) console.error(e);
        else console.error(e.stack)
    }
}
main();