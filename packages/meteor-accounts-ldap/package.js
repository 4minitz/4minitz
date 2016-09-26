Package.describe({
  name : 'babrahams:accounts-ldap',
  summary: 'Meteor account login via LDAP',
  version: '0.6.1',
  git : 'https://github.com/JackAdams/meteor-accounts-ldap',
  documentation: 'README.md'
});

Npm.depends({'ldapjs' : '0.7.1', 'connect' : '2.19.3'});

Package.on_use(function (api) {
  api.versionsFrom('1.1.0.2');
  api.use(['routepolicy', 'webapp'], 'server');
  api.use(['accounts-base', 'underscore', 'less@2.5.0_2'], ['client', 'server']);
  api.use('accounts-password', 'server');
  api.imply('accounts-base', ['client', 'server']);
  api.use(['ui', 'templating', 'jquery', 'spacebars', 'reactive-var'], 'client');
  api.add_files([
    'ldap_client.html',
    'ldap_client.js',
    'ldap_client.less'], 'client');
  api.add_files('ldap_server.js', 'server');
  api.export('LDAP');
});
