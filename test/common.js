/**
 * Created by ozlevka on 3/21/14.
 */

var dbmanager = require('../lib/dbmanager');
var util = require('util');

var mysql = require('mysql');

dbmanager.deleteDocument(3,function(err, results){
    if(err) console.error(err);
    else console.log(results);

    dbmanager.releasePool();
})