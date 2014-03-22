/**
 * Created by ozlevka on 3/21/14.
 */
var mysql = require('mysql');
var config = require('../config/config');
var fs = require('fs');
var async = require('async');


var pool = mysql.createPool(config.mysql);


pool.on('error', function(err) {
    //todo log to dberrors
    console.error(err);
});

exports = module.exports;


exports.createSchema = function() {
    fs.readFile('../config/createschema.sql', function(err, data){
          if(err) console.err(err)
          else {
              var sqls = data.toString().split(';');
              async.map(sqls, function(sql, callback){
                  if(sql) {
                      pool.query(sql, function(err, rows, fileds) {
                         if(err) callback(err);
                         else {
                             console.log(sql);
                             callback(null, 'OK');
                         }
                      });
                  }
                  else
                    callback(null,'EMPTY');
              }, function(err, results) {
                 if(err) console.error(err);
                 else {
                     pool.end();
                 }
              })
          }
    });




};









