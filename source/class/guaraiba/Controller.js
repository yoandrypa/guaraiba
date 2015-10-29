/**
 * Copyright ©:
 *      2015 Yoandry Pacheco Aguila
 *
 * License:
 *      LGPL: http://www.gnu.org/licenses/lgpl.html
 *      EPL: http://www.eclipse.org/org/documents/epl-v10.php
 *      See the LICENSE file in the project's top-level directory for details.
 *
 * Authors:
 *      Yoandry Pacheco Aguila < yoandrypa@gmail.com >
 *
 */

/**
 * This class offers the basic features for create application controllers.
 */
qx.Class.define('guaraiba.Controller', {
    type: 'abstract',
    extend: qx.core.Object,
    include: [
        guaraiba.controllers.MResponder,
        guaraiba.controllers.MFilters,
        guaraiba.response.MStatus,
        qx.core.MLogging
    ],

    /**
     * Constructor
     *
     * @param request {guaraiba.Request}
     * @param response {guaraiba.Response}
     * @param params {Map?null} Params map object.
     */
    construct: function (request, response, params) {
        this.base(arguments);
        this.__accessTime = new Date();

        this.setRequest(request);
        this.setResponse(response);
        this.setParams(params);

        this.init();

        if (this.getConfiguration().getAllowCORS()) {
            this.beforeAll(this._allowCORS);
        }
    },

    properties: {
        /**
         * The guaraiba.Request object for this request/response cycle.
         */
        request: {
            check: 'guaraiba.Request'
        },

        /**
         * The guaraiba.Response object for this request/response cycle.
         */
        response: {
            check: 'guaraiba.Response'
        },

        /**
         * The parsed params for the request. Also passed as an arg
         * to the action, added as an instance field for convenience.
         */
        params: {
            check: 'Object'
        },

        /**
         * Content-type the controller can format the response in.
         */
        respondsWith: {
            check: 'Array',
            init: [
                'html', 'json', 'xml', 'js', 'txt', 'xhtml', 'pdf', 'docx', 'pptx',
                'xlsx', 'rtf', 'xls', 'csv', 'odt', 'ods', 'xml4swf', 'jpeg'
            ]
        },

        /**
         * Content to use for the response.
         */
        content: {
            init: ''
        },

        /** Determines whether the execution of the action has been completed or not. */
        completed: {
            check: 'Boolean',
            init: false
        }
    },

    members: {
        /**
         * Time accessed
         */
        __accessTime: null,

        /**
         * Anti-CSRF token for PUT/POST/DELETE
         */
        sameOriginToken: null,

        /**
         * Call immediately after constructor execute.
         */
        init: function () {
        },

        /**
         * Primary entry point for calling the action on a controller
         * Wraps the action so before and after filters can be run
         *
         * @param action {String} - Action name.
         * @internal
         */
        _handleAction: function (action) {
            var vThis = this, callback;

            if (!vThis[action]) {
                return this.respordWithStatusNotFound();
            }

            // Wrap the actual action handling in a callback to use as the last
            // - method in the async chain of before filters
            callback = function () {
                if (!vThis.getCompleted()) {
                    vThis[action](vThis.getRequest(), vThis.getResponse(), vThis.getParams());
                }
            };

//            // Generate an anti-CSRF token
//            if (config.secret && this.session) {
//                this.sameOriginToken = _generateSameOriginToken.call(this);
//            }

            try {
                this.execFilters(action, 'before', callback);
            } catch (err) {
                this.respondError(err)
            }
        },

        /**
         * Returns current worker application reference.
         *
         * @return {guaraiba.Application}
         */
        getApplication: function () {
            return this.getRequest().getApplication();
        },

        /**
         * Retorna la instancia de la session activa.
         *
         * @return {guaraiba.Session}
         */
        getSession: function () {
            return this.getRequest().getSession();
        },

        /**
         * Returns configuration of current worker application.
         *
         * @return {guaraiba.Configuration}
         */
        getConfiguration: function () {
            return this.getApplication().getConfiguration();
        },

        /**
         * Returns instance of register database connection schema.
         *
         * @param name {String?'default'} Database connection schema identification name.
         * @return {guaraiba.orm.DBSchema}
         * @throws {qx.core.AssertionError}
         */
        getDBSchema: function (name) {
            return this.getConfiguration().getDBSchema(name);
        },

        /**
         * Returns model instance for given record class or model name.
         *
         * @param classOrName {Class|String} ORM record class or model class name.
         * @param dbSchema {String?'default'} Database schema name.
         * @return {guaraiba.orm.Model}
         */
        getModel: function (classOrName, dbSchema) {
            var modelName = qx.lang.Type.isString(classOrName) ? classOrName : (classOrName.classname);

            return this.getDBSchema(dbSchema).getModel(modelName);
        },

        /**
         * Returns current router instance.
         *
         * @return {guaraiba.Router}
         */
        getRouter: function () {
            return guaraiba.router;
        },

        /**
         * Returns the name of the controller that being executed.
         *
         * @return {String}
         */
        getControllerName: function () {
            return this.getParams().controller;
        },

        /**
         * Returns the name of the action that being executed.
         *
         * @return {String}
         */
        getActionName: function () {
            return this.getParams().action;
        },

        /**
         * Returns the format of current request.
         *
         * @return {String}
         */
        getFormat: function () {
            return this.getParams().format || this.getDefaultFormat();
        },

        /**
         * Returns the default format for any request.
         *
         * @return {String}
         */
        getDefaultFormat: function () {
            return this.getConfiguration().getDefaultFormat();
        },

        /**
         * Returns cookies of current session.
         *
         * @return {Object|null}
         */
        getCookies: function () {
            return this.getSession().getCookies();
        },

        /**
         * Returns value of profile property of current session.
         *
         * @return {Map|null}
         */
        getCurrentUserProfile: function () {
            return this.getSession().get('profile');
        },

        /**
         * Transfer a request from its original action to a new one.
         * The entire request cycle is repeated, including before-filters.
         *
         * @param action {Object} The new action designated to handle the request.
         */
        transfer: function (action) {
            var params = this.getParams();
            params.action = action;
            this.setParams(params);
            this._handleAction(action);
        },

        /**
         * Sends a 302 redirect to the client, based on either a simple string-URL, or a controller/action/format combination.
         *
         * @param target {String|Object} Either an URL, or an object literal containing controller/action/format attributes to base the redirect on.
         * @param options {Object ? null} Options.
         */
        redirect: function (target, options) {
            var url,
                opts = options || {},
                statusCode = opts.statusCode || 302,
                controllerName = this.getControllerName();

            // Make sure it's a 3xx
            if (String(statusCode).indexOf('3') != 0) {
                throw new Error('Redirect status must be 3xx');
            }

            if (typeof target == 'string') {
                url = target
            } else if (guaraiba.is.IsFunction(this.getRouter().url)) {
                target.controller = target.controller || controllerName;
                target.format = target.format || this.getFormat();
                url = this.getRouter().url(target);
            }

            if (!url) {
                var ext = target.format || this.getFormat();

                url = '/'
                    + guaraiba.utils.string.decamelize(target.controller || controllerName)
                    + (target.action ? '/' + target.action : '')
                    + (target.id ? '/' + target.id : '');

                if (ext) {
                    url += '.' + ext;
                }
            }

            this.output(statusCode, { 'Location': url }, '');
        },

        /**
         * Filter to allow access to actions in cross-browser and cross-domain.
         *
         * This filter has to be applied in phase 'before'.
         *
         * @param done {Function} Callback function for return controll to _handleAction method.
         */
        _allowCORS: function allowCORS(done) {
            this.getResponse().setHeaders(200, {
                'Access-Control-Allow-Origin': this.getRequest().getHeaders().origin || '*',
                'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,OPTIONS',
                'Access-Control-Allow-Headers': 'Authorization, X-Csrf-Token, x-auth-token, Set-Cookie, range, X-API-VERSION, X-Requested-With, Content-Type, Accept, Origin',
                'Access-Control-Allow-Credentials': true,
                'Access-Control-Max-Age': 5184000 //2 months
            });
            done();
        }
    }
});