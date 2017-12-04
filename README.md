# node-tepez
> Node.js wrapper for the Tepez HTTP [API](https://docs.tepez.co.il)

## Work in progress. Not ready for clients use.

[![npm version](https://badge.fury.io/js/node-tepez.svg)](http://badge.fury.io/js/node-tepez)
[![Known Vulnerabilities](https://snyk.io/test/npm/node-tepez/badge.svg)](https://snyk.io/test/npm/node-tepez)


## Usage

```
const Tepez = require('node-tepez');


const tepez = new Tepez({
    email: '< EMAIL >',
    password: '< PASSWORD >'
});
```

## Authentication
Both email and password can be given when constructor the client instance as `email` and `password` respectively.
If either option is not given, the `TEPEZ_EMAIL` and `TEPEZ_PASSWORD` environment variables will be used, if present.
If neither is given, an exception will be thrown when creating the client instance.

## Debug
Set the `DEBUG` environment variable to `tepez:api` to get each request and response made by the client printed to the console.

## Supported methods

### Form
* getForm
* listForms

### Entry
* getEntry
* listEntries
* saveNewEntry
* submitEntry
* editEntry

### Options set
* optionsSetDeleteOptions
* optionsSetAddOptions

### Docs
* docsSetAddDocs