Package.describe({
    name: 'felixble:server-templates',
    version: '1.0.0',
    summary: 'Server side template engine based on blaze',
    documentation: null
});

Package.onUse(function(api) {
    api.versionsFrom('1.2.0.1');
    api.use([
        'blaze',
        'spacebars',
        'random',
        'spacebars-compiler'
    ], 'server');
    api.addFiles(['lib/api.js']);
    api.export('ServerTemplate');
});

Package.onTest(function(api) {
    api.use([
        'tinytest',
        'blaze',
        'spacebars',
        'random',
        'spacebars-compiler'
    ], 'server');
    api.addFiles(['lib/api.js', 'test/api-test.js'], 'server');
});