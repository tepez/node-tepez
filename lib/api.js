'use strict';
const Request = require('request');
const Bluebird = require('bluebird');
const Debug = require('debug');
const Joi = require('joi');
const _ = require('lodash');
const Chalk = require('chalk');


const debug = Debug('tepez:api');
const RequestAsync = Bluebird.promisify(Request, {multiArgs: true});

const objectIdType = Joi.string()
    .regex(/^(?:[0-9a-fA-F]{24})$/)
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
        const signinUrl = `${this.options.baseUrl}/v1.0/auth/login`;
        return RequestAsync({
            method: 'POST',
            url: signinUrl,
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

    listEntries(query, fields, sort) {
        Joi.assert(query, Joi.object().required().label('query'));
        Joi.assert(fields, Joi.array().items(Joi.string()).single().label('fields'));
        Joi.assert(sort, Joi.object().label('sort'));

        return this._signinIfNeeded().then(() => {
            const qs = {
                query: JSON.stringify(query)
            };
            if (fields) qs.fields = fields;
            if (sort) qs.sort = JSON.stringify(sort);

            const requestOptions = {
                method: 'GET',
                url: `${this.options.baseUrl}/v1.0/entry`,
                time: true,
                json: true,
                qs: qs
            };
            this._addAuthorizationHeader(requestOptions);
            return RequestAsync(requestOptions)
        }).spread((response, body) => {
            this._inspectResponse(response);
            return response;
        });
    }

    optionsSetDeleteOptions(setId) {
        Joi.assert(setId, objectIdType.label('setId'));

        const deleteOptionsUrl = `${this.options.baseUrl}/v1.0/optionsSet/${setId}/deleteOptions`;
        return this._signinIfNeeded().then(() => {
            const requestOptions = {
                method: 'POST',
                url: deleteOptionsUrl,
                time: true,
                json: true
            };
            this._addAuthorizationHeader(requestOptions);
            return RequestAsync(requestOptions)
        }).spread((response, body) => {
            this._inspectResponse(response);
            return response;
        });
    }

    optionsSetAddOptions(setId, options) {
        Joi.assert(setId, objectIdType.label('setId'));
        Joi.assert(options, Joi.array().min(1).items(Joi.object().keys({
            value: Joi.string(),
            score: Joi.number().integer(),
            data: Joi.object()
        })));

        const addOptionsUrl = `${this.options.baseUrl}/v1.0/optionsSet/${setId}/addOptions`;
        return this._signinIfNeeded().then(() => {
            const requestOptions = {
                method: 'POST',
                url: addOptionsUrl,
                json: true,
                time: true,
                body: {
                    options: options
                }
            };
            this._addAuthorizationHeader(requestOptions);
            return RequestAsync(requestOptions)
        }).spread((response, body) => {
            this._inspectResponse(response);
            return response;
        });
    }

    docsSetAddDocs(accountId, docsSetId, docs) {
        Joi.assert(accountId, objectIdType.label('accountId'));
        Joi.assert(docsSetId, Joi.string().required().label('docsSetId'));
        Joi.assert(docs, Joi.array().min(1).items(Joi.object().keys({
            id: Joi.string().required(),
            data: Joi.object()
        })));

        const url = `${this.options.baseContribUrl}/${this._apiEnvPrefix}docsSets/docsSet/${accountId}/${docsSetId}/addDocs`;
        return this._signinIfNeeded().then(() => {
            const requestOptions = {
                method: 'POST',
                url: url,
                json: true,
                time: true,
                body: {
                    docs: docs
                }
            };
            this._addAuthorizationHeader(requestOptions);
            return RequestAsync(requestOptions)
        }).spread((response, body) => {
            this._inspectResponse(response);
            return response;
        });
    }
}

module.exports = TepezApi;