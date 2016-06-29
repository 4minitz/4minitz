import { SpacebarsCompiler } from 'meteor/spacebars-compiler'
import { Blaze } from 'meteor/blaze'


export class ServerTemplate {

    static render(content, data) {
        if (!data) {
            data = {};
        }

        var template = new Template(Random.id(), function () {
            var view = this;
            return eval(SpacebarsCompiler.compile(content))();
        });

        return Blaze.toHTMLWithData(template, data);
    }

}