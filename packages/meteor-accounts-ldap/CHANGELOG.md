Accounts LDAP - Changelog
=========================

### v1.0 (Does not exist yet -- maybe be in the distant future)

- Automated test suite
- Configurable enough to support most LDAP authentication scenarios

### vNext

- Make UI part separate package

### v0.6.1

- Gave a `uniqueIdentifier` option in the LDAP.settings for more reliable lookups of users in the app database

### v0.6.0

- Added overwriteable `LDAP.appUsername` function to make some multi-tenancy scenarios easier
- Removed some accidental unnecessary globals
- Renamed some variables for easier code readability
- LDAPS support (copied approach from `typ:accounts-ldap`) -- untested

### v0.5.0

- Makes the search filter more flexible without having to overwrite the `LDAP.filter` function

### v0.4.3

- Changed the way that binds are done (using `userPrincipalName` format instead of the email address passed from the client) -- this may mess things up for some people -- I'll accept a PR that makes this part of the process more configurable (I admit that this package caters to the particular ldap setup that I work with.)

### v0.4.2

- Was working fine for quite a while