/**
 * Copyright ©:
 *      2015 Yoandry Pacheco Aguila
 *
 * License:
 *      LGPL-3.0: http://spdx.org/licenses/LGPL-3.0.html#licenseText
 *      EPL-1.0: http://spdx.org/licenses/EPL-1.0.html#licenseText
 *      See the LICENSE file in the project's top-level directory for details.
 *
 * Authors:
 *      Yoandry Pacheco Aguila < yoandrypa@gmail.com >
 *
 */

var jake = require('jake');

jake.addListener('complete', function () {
    process.stdout.write("\n");
    process.exit();
});

/**
 * This class offers the basic properties and features to create an start guaraiba server applications.
 *
 * @ignore(namespace,task,desc)
 */
qx.Class.define('guaraiba.Tasks', {
    statics: {
        /**
         *
         * @param nameSpace {String} Task namespace.
         * @param taskName {String} Task name.
         * @param async {Boolean?false} The task execution will be synchronous or asynchronous.
         * @param action {Function} Method to execute when task is called.
         * @param scope {Object} Scope to execute task method passed in the action parameter.
         * @param desciption {String} Task desctiption.
         */
        registerTask: function (nameSpace, taskName, async, action, scope, desciption) {
            var createTask = function () {
                desc(desciption);
                task(taskName, [], { async: async }, function () {
                    action.apply(scope || this, arguments);
                });
            };

            nameSpace ? namespace(nameSpace, createTask) : createTask();
        },

        /**
         * Check if the application is under development.
         *
         * @return {Boolean}
         * @ignore(__filename)
         */
        itIsDeveloping: function(){
            return String(__filename).match(/source\/class\/guaraiba\/Tasks.js$/);
        },

        /**
         * Check if the application is under development.
         *
         * @return {Boolean}
         */
        itIsProduction: function(){
            return !this.itIsDeveloping();
        }
    }
});