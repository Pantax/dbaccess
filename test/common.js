/**
 * Created by ozlevka on 3/21/14.
 */
require('date-utils');
var dbmanager = require('../lib/dbmanager');
var util = require('util');
var config = require('../config/config');
var mysql = require('mysql');
var fs = require('fs');
var async = require('async');


function test_login() {
    dbmanager.login('kala', 'mala', function(err, res) {
        if(err) console.error(err);
        else console.log(util.inspect(res));

        dbmanager.releasePool();
    });
}


function userbytokenTest() {
    dbmanager.userbytoken('blaaslslslsl', function(err, result) {
        if(err) console.error(err);
        else console.log(result);

        dbmanager.releasePool();
    })
}


//test_login();
userbytokenTest();