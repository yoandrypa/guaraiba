/**
 * This class offers the basic properties and features to create a REST controller for a table of the database.
 */
qx.Class.define('guaraiba.controllers.RestTableController', {
    type: 'abstract',
    extend: guaraiba.controllers.RestController,

    properties: {
        /** Name of table in database */
        tableName: {
            check: 'String',
            nullable: false
        }
    },

    members: {

        /**
         * Action to create new record with attrs given by request parameters.
         *
         * @param request {guaraiba.Request}
         * @param response {guaraiba.Response}
         * @param params {Object} Request parameters hash. <code>{ items: {field1: 'v1', ... fieldN: 'vN'} }</code>.
         */
        createAction: function (request, response, params) {
            var items = this._normalizeData(params.items);

            qb.insert(items, '*').then(function (err, record) {
                this.respondError(err) || this._prepareItem(record, function (err, item) {
                    if (!this.respondError(err)) {
                        var done = qx.lang.Function.bind(function () {
                            this.respond({
                                type: this.getRecordClassName(),
                                id: record[this.getIdFieldName()],
                                data: item
                            });
                        }, this);

                        if (qx.Interface.objectImplements(this, guaraiba.controllers.IAccessControlListToResources)) {
                            this.saveAccessControlListToResources(record, done);
                        } else {
                            done();
                        }
                    }
                });
            }, this);
        },

        /**
         * Action to update record with id and attrs given by request parameters.
         *
         * @param request {guaraiba.Request}
         * @param response {guaraiba.Response}
         * @param params {Object} Request parameters hash with id field: Ex: <code>{ id: 1, items: {field1: 'v1', ... fieldN: 'vN'} }</code>.
         */
        updateAction: function (request, response, params) {
            var qb = this.createQueryBuilder(),
                idFieldName = this.getIdFieldName(),
                id = params.id || params[idFieldName],
                items = this._normalizeData(params.items);

            if (qx.lang.Type.isString(items)) {
                items = request.parseJson(items);
            }

            qb.update(items, '*').where(idFieldName, id).then(function (err, record) {
                this.respondError(err) || this._prepareItem(record, function (err, item) {
                    this.respondError(err) || this.respond({
                        type: this.getRecordClassName(),
                        id: record[this.getIdFieldName()],
                        data: item
                    });
                });
            }, this);
        },

        /**
         * Action to remove record with id given by request parameters.
         *
         * @param request {guaraiba.Request}
         * @param response {guaraiba.Response}
         * @param params {Object} Request parameters hash with id field: Ex: <code>{ id: 1 }</code>.
         */
        destroyAction: function (request, response, params) {
            var qb = this.createQueryBuilder(),
                idFieldName = this.getIdFieldName(),
                id = params.id || params[idFieldName];

            qb.remove('*').where(idFieldName, id).then(function (err, record) {
                this.respondError(err) || this._prepareItem(record, function (err, item) {
                    if (!this.respondError(err)) {
                        var done = qx.lang.Function.bind(function () {
                            this.respond({
                                type: this.getRecordClassName(),
                                id: record[this.getIdFieldName()],
                                data: item
                            });
                        }, this);

                        if (qx.Interface.objectImplements(this, guaraiba.controllers.IAccessControlListToResources)) {
                            this.destroyAccessControlListToResources(record, done);
                        } else {
                            done();
                        }
                    }
                });
            }, this);
        },

        /**
         * Returns record class name.
         *
         * @return {String}
         */
        getRecordClassName: function () {
            return this.getTableName();
        },

        /**
         * Create query builder over defined tableName propety.
         *
         * @return {guaraiba.orm.QueryBuilder}
         * @see guaraiba.controllers.RestModelController#tableName
         */
        createQueryBuilder: function () {
            return this.getDBSchema().createQueryBuilder().from(this.getTableName());
        }
    }
});