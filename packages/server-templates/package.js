Package.describe({
    name: 'felixble:server-templates',
    version: '1.0.0',
    summary: 'Server side template engine based on blaze',
    documentation: null
});

Package.onUse(function(api) {
    api.versionsFrom('1.3.3.1');
    api.use([
        'ecmascript',
        'blaze',
        'spacebars',
        'random',
        'spacebars-compiler'
    ], 'server');
    api.addFiles(['lib/api.js']);
    api.mainModule('lib/api.js');
});

Package.onTest(function(api) {
    api.use([
        'ecmascript',
        'tinytest',
        'blaze',
        'spacebars',
        'random',
        'spacebars-compiler'
    ], 'server');
    api.addFiles(['lib/api.js', 'test/api-test.js'], 'server');
});