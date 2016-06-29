var compiler = SpacebarsCompiler;

ServerTemplate = {};



ServerTemplate.render = function(content, data) {
    if (!data) {
        data = {};
    }

    var template = new Template(Random.id(), function() {
        var view = this;
        return eval(compiler.compile(content))();
    });

    return Blaze.toHTMLWithData(template, data);
};
