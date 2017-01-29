import { SpacebarsCompiler } from 'meteor/spacebars-compiler'
import { Blaze } from 'meteor/blaze'

export class TemplateCreator {

    static create(content) {
        return new Blaze.Template(Random.id(), function () {
            // this variable needs to be declared to compile the template
            //noinspection JSUnusedLocalSymbols
            var view = this;
            return eval(SpacebarsCompiler.compile(content))();
        });
    }

}