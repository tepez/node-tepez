'use strict';
const Request = require('request');
const Bluebird = require('bluebird');
const Debug = require('debug');
const Joi = require('joi');
const _ = require('lodash');
const Chalk = require('chalk');


const debug = Debug('tepez:api');
const RequestAsync = Bluebird.promisify(Request, {multiArgs: true});

const reqObjectIdType = Joi.string()
    .regex(/^(?:[0-9a-fA-F]{24})$/)
    .required()
    .description('a MongoDB ObjectID, 24 hex characters');


class TepezApi {
    constructor(options) {
        Joi.assert(options, Joi.object().keys({
            baseUrl: Joi.string(),
            email: Joi.string().email(),
            password: Joi.string(),
            env: Joi.string().only('dev', 'staging', 'production')
        }));
        this.options = _.defaults(options, {
            env: 'production',
            email: process.env.TEPEZ_EMAIL,
            password: process.env.TEPEZ_PASSWORD,
            baseUrl: 'https://api.tepez.co.il',
            baseContribUrl: 'https://contrib-api.tepez.co.il'
        });

        Joi.assert(this.options.email, Joi.string().email().required());
        Joi.assert(this.options.password, Joi.string().required());

        this._apiEnvPrefix = this.options.env === 'production'
            ? ''
            : `${this.options.env}-`;
    }

    _inspectResponse(response) {
        const decodedUrl = decodeURI(response.request.href);

        debug(`${response.request.method} ${Chalk.cyan(decodedUrl)} ${response.statusCode} (${response.elapsedTime} ms)`);
        debug(response.body);
        if (response.statusCode < 200 || response.statusCode > 299) {
            const formattedBody = JSON.stringify(response.body, null, 2);
            throw new Error(`${response.request.method} ${decodedUrl} ${response.statusCode}: ${formattedBody}`);
        }
    }

    _getToken() {
        return RequestAsync({
            method: 'POST',
            url: `${this.options.baseUrl}/v1.0/auth/login`,
            json: true,
            time: true,
            body: {
                email: this.options.email,
                password: this.options.password
            }
        }).spread((response, body) => {
            this._inspectResponse(response);
            this._token = body.token;
            return null;
        });
    }

    _signinIfNeeded() {
        if (this._token) {
            return Bluebird.resolve();
        }
        return this._getToken();
    }

    _addAuthorizationHeader(requestOptions) {
        if (!requestOptions.headers) requestOptions.headers = {};
        requestOptions.headers.Authorization = `Bearer ${this._token}`;
    }

    submitEntry(options) {
        Joi.assert(options, Joi.object().keys({
            entryId: reqObjectIdType,
            data: Joi.object().required()
        }));

        return this._signinIfNeeded().then(() => {
            const requestOptions = {
                method: 'POST',
                url: `${this.options.baseUrl}/v1.0/entry/${options.entryId}/submit`,
                body: options.data,
                time: true,
                json: true,
            };
            this._addAuthorizationHeader(requestOptions);
            return RequestAsync(requestOptions)
        }).spread((response, body) => {
            this._inspectResponse(response);
            return body;
        });
    }

    getEntry(options) {
        Joi.assert(options, Joi.object().keys({
            entryId: reqObjectIdType.required(),
            fields: Joi.array().items(Joi.string()).single()
        }));

        return this._signinIfNeeded().then(() => {
            const qs = {};
            if (options.fields) qs.fields = options.fields;

            const requestOptions = {
                method: 'GET',
                url: `${this.options.baseUrl}/v1.0/entry/${options.entryId}`,
                time: true,
                json: true,
                qs: qs,
                qsStringifyOptions: { arrayFormat: 'repeat' }
            };
            this._addAuthorizationHeader(requestOptions);
            return RequestAsync(requestOptions)
        }).spread((response, body) => {
            this._inspectResponse(response);
            return body;
        });
    }

    editEntry(options) {
        Joi.assert(options, Joi.object().keys({
            entryId: reqObjectIdType,
            data: Joi.object(),
            status: Joi.string()
        })).or('data', 'status');

        return this._signinIfNeeded().then(() => {
            const body = {};
            if (options.data) body.data = options.data;
            if (options.status) body.status = options.status;

            const requestOptions = {
                method: 'POST',
                url: `${this.options.baseUrl}/v1.0/entry/${options.entryId}`,
                body: body,
                time: true,
                json: true,
            };
            this._addAuthorizationHeader(requestOptions);
            return RequestAsync(requestOptions)
        }).spread((response, body) => {
            this._inspectResponse(response);
            return body;
        });
    }

    listEntries(options) {
        options = options || {};
        Joi.assert(options, Joi.object().keys({
            query: Joi.object(),
            fields: Joi.array().items(Joi.string()).single(),
            sort: Joi.object()
        }));

        return this._signinIfNeeded().then(() => {
            const qs = {};
            if (options.query) qs.query = JSON.stringify(options.query);
            if (options.fields) qs.fields = fields;
            if (options.sort) qs.sort = JSON.stringify(options.sort);

            const requestOptions = {
                method: 'GET',
                url: `${this.options.baseUrl}/v1.0/entry`,
                time: true,
                json: true,
                qs: qs,
                qsStringifyOptions: { arrayFormat: 'repeat' }
            };
            this._addAuthorizationHeader(requestOptions);
            return RequestAsync(requestOptions)
        }).spread((response, body) => {
            this._inspectResponse(response);
            return body;
        });
    }

    saveNewEntry(options) {
        Joi.assert(options, Joi.object().keys({
            formId: reqObjectIdType,
            data: Joi.object()
        }));

        return this._signinIfNeeded().then(() => {
            const requestOptions = {
                method: 'POST',
                url: `${this.options.baseUrl}/v1.0/entry/save`,
                body: {
                    form: options.formId,
                    data: options.data
                },
                time: true,
                json: true
            };
            this._addAuthorizationHeader(requestOptions);
            return RequestAsync(requestOptions)
        }).spread((response, body) => {
            this._inspectResponse(response);
            return body;
        });
    }

    optionsSetDeleteOptions(options) {
        Joi.assert(options, Joi.object().keys({
            setId: reqObjectIdType
        }));

        return this._signinIfNeeded().then(() => {
            const requestOptions = {
                method: 'POST',
                url: `${this.options.baseUrl}/v1.0/optionsSet/${options.setId}/deleteOptions`,
                time: true,
                json: true
            };
            this._addAuthorizationHeader(requestOptions);
            return RequestAsync(requestOptions)
        }).spread((response, body) => {
            this._inspectResponse(response);
            return body;
        });
    }

    optionsSetAddOptions(options) {
        Joi.assert(options, Joi.object().keys({
            setId: reqObjectIdType,
            options: Joi.array()
                .min(1).
                items(Joi.object().keys({
                    value: Joi.string(),
                    score: Joi.number().integer(),
                    data: Joi.object()
                }))
                .required()
        }));

        return this._signinIfNeeded().then(() => {
            const requestOptions = {
                method: 'POST',
                url: `${this.options.baseUrl}/v1.0/optionsSet/${options.setId}/addOptions`,
                json: true,
                time: true,
                body: {
                    options: options.options
                }
            };
            this._addAuthorizationHeader(requestOptions);
            return RequestAsync(requestOptions)
        }).spread((response, body) => {
            this._inspectResponse(response);
            return body;
        });
    }

    docsSetAddDocs(options) {
        Joi.assert(options, Joi.object().keys({
            accountId: reqObjectIdType,
            docsSetId: Joi.string().required(),
            docs: Joi.array().min(1).items(Joi.object().keys({
                id: Joi.string().required(),
                data: Joi.object()
            }))
        }));

        return this._signinIfNeeded().then(() => {
            const requestOptions = {
                method: 'POST',
                url: `${this.options.baseContribUrl}/${this._apiEnvPrefix}docsSets/docsSet/${options.accountId}/${options.docsSetId}/addDocs`,
                json: true,
                time: true,
                body: {
                    docs: options.docs
                }
            };
            this._addAuthorizationHeader(requestOptions);
            return RequestAsync(requestOptions)
        }).spread((response, body) => {
            this._inspectResponse(response);
            return body;
        });
    }
}

module.exports = TepezApi;