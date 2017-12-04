const TepezApi = require('..');
const _ = require('lodash');


describe('node-tepez, TepezApi', () => {
    let spec;
    afterEach(() => spec = null);
    beforeEach(function () {
        spec = this
    });

    describe('email and password', () => {
        beforeEach(() => {
            spec.origEnv = _.cloneDeep(process.env);
        });

        afterEach(() => {
           process.env = spec.origEnv;
        });

        it('should accept email and password from constructor options, if passed', () => {
            const api = new TepezApi({
                email: 'mock-email@tepez.co.il',
                password: 'mock-password'
            });
            expect(api.options.email).toBe('mock-email@tepez.co.il');
            expect(api.options.password).toBe('mock-password');
        });

        it('should use TEPEZ_EMAIL and TEPEZ_PASSWORD if constructor options where not passed', () => {
            process.env.TEPEZ_EMAIL = 'mock-env-email@tepez.co.il';
            process.env.TEPEZ_PASSWORD = 'mock-env-password';

            const api = new TepezApi();
            expect(api.options.email).toBe('mock-env-email@tepez.co.il');
            expect(api.options.password).toBe('mock-env-password');
        });

        it('should throw if none is given', () => {
            expect(() => new TepezApi()).toThrow();
           expect(() => new TepezApi({ email: 'mock-email@tepez.co.il' })).toThrow();
           expect(() => new TepezApi({ password: 'mock-password' })).toThrow();
        });

        it('should use constructor options if both is given', () => {
            process.env.TEPEZ_EMAIL = 'mock-env-email@tepez.co.il';
            process.env.TEPEZ_PASSWORD = 'mock-env-password';

            const api = new TepezApi({
                email: 'mock-email@tepez.co.il',
                password: 'mock-password'
            });
            expect(api.options.email).toBe('mock-email@tepez.co.il');
            expect(api.options.password).toBe('mock-password');
        })
    });
});