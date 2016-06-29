

Tinytest.add("Server template can compile and render a template string", function(test) {
    var date = new Date();
    var content = "Hallo {{name}}, time: {{date}}";
    var data = {
        name: "4Minitz",
        date: function() { return date }
    };

    var result = ServerTemplate.render(content, data);

    var expected = "Hallo " + data.name + ", time: " + date;
    test.equal(result, expected);
});