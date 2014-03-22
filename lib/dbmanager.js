/**
 * Created by ozlevka on 3/21/14.
 */
var mysql = require('mysql');
var config = require('../config/config');
var fs = require('fs');



var pool = mysql.createPool(config.mysql);


pool.on('error', function(err) {
    //todo log to dberrors
    console.error(err);
});

exports = module.exports;


exports.createSchema = function() {
    fs.readFile('../config/createschema.sql', function(err, results){
        if(err) console.log(err);
        else {
            pool.query(results.toString(), function(err, rows, fileds) {
                if(err) console.error(err);
                else {
                    console.log(rows[0].solution);
                }
            });
        }
    });
}









