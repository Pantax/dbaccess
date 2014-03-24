/**
 * Created by ozlevka on 3/21/14.
 */

var dbmanager = require('../lib/dbmanager');
var util = require('util');
var config = require('../config/config');
var mysql = require('mysql');



dbmanager.getEntityByCode('ABCD4321', true, function(err, results){
    if(err) console.error(err);
    else console.log(results);

    dbmanager.releasePool();
});