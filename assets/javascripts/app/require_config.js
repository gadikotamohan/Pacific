require.config({
  deps: ['./initialize_app'],
  paths: {
    'config'               : './config',
    'migrations/schema'    : '../database/migrations/schema',
    'app_view_helpers'     : './helpers/app_view_helpers',
    "database_helper"      : "./helpers/db_helper",
    "secure_storage_helper": './helpers/secure_storage_helper',
    "encryption_helper"    : "./helpers/encryption_helper",
    "login_helper"         : "./helpers/login_helper",
    'text'                : '../../../bower_components/text/text',
    "react"                : "../../../node_modules/react/umd/react.production.min",
    "react-dom"            : "../../../node_modules/react-dom/umd/react-dom.production.min",
    "scheduler"           : "../../../node_modules/scheduler/umd/scheduler.production.min",
    "object-assign"       : "../../../node_modules/object-assign/index",
    'underscore'          : '../../../bower_components/lodash/lodash',
    'lodash'              : '../../../bower_components/lodash/dist/lodash',
    'jquery'              : '../../../bower_components/jquery/dist/jquery',
    "strftime"            : '../../../bower_components/strftime/strftime',
    'bootstrap'           : '../../../bower_components/bootstrap/dist/js/bootstrap',
    'jsSHA'               : '../../../bower_components/jsSHA/src/sha256',
    'aes-js'              : '../../../bower_components/aes-js/index'
  }
});