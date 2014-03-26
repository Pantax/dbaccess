/**
 * Created by ozlevka on 3/21/14.
 */
var mysql = require('mysql');
var config = require('../config/config');
var fs = require('fs');
var async = require('async');
var winston = require('winston');
var util = require('util');
var sqlsConfig = require('../config/sqls');

var logger = new (winston.Logger)({
    transports : [
        new (winston.transports.Console)(config.logger.console),
        new (winston.transports.File)(config.logger.file)
    ]
});


var pool = mysql.createPool(config.mysql);

exports = module.exports;

/*
    Process single query
*/
function processQuery(endpoint, sql, params, callback) {
    pool.getConnection(function(err, connection){
        if(err) {
            logger.log('error', util.format('%s getConnection failed', endpoint) , util.inspect(err));
            callback(err);
        } else {
            var cb = function(err, results){
                if(err) {
                    logger.log('error', '%s query failed', util.inspect(err));
                    callback(err);
                } else {
                    logger.debug(util.format('%s suces process %s', endpoint, sql));
                    callback(null, results);
                }
                connection.release();
            };
            if(!params) connection.query(sql,cb);
            else connection.query(sql, params, cb);
        }
    })
}

function createQueryFromObject(obj) {
    var columns = Object.keys(obj);
    var values = [];

    for(var i = 0; i < columns.length; i++) {
        values.push(obj[columns[i]]);
    }

    return {
        columns : columns,
        values : values
    }
}

/*
* Process number sqls in transation;
* */
function processTransaction(sqls, callback) {
    pool.getConnection(function(err, connection){
        if(err) {
            logger.log('error', 'processTransaction getConnection', util.inspect(err));
            callback(err);
        }
        else {
            connection.beginTransaction(function(err){
                if(err) {
                    logger.log('processTransaction beginTransaction', util.inspect(err));
                    callback(err);
                }
                else {
                    async.map(sqls, function(sql, callback) {
                        logger.debug(util.format('process query %s', sql));
                        connection.query(sql,function(err, res) {
                            if(err) {
                                logger.log('error', util.format('processTransaction executeQuery: %s', sql), util.inspect(err));
                                callback(err);
                            } else {
                                logger.debug(util.format('query %s success', sql));
                                callback(null, res);
                            }
                        });
                    }, function(err, results){
                        if(err) {
                            connection.rollback(function() {
                                logger.log('error','processTransaction connectionRolled back', util.inspect(err));
                                callback(err);
                            })
                        }
                        else {
                            connection.commit(function(err) {
                                if(err) {
                                    logger.log('error', 'processTransaction commit failed', util.inspect(err));
                                    connection.rollback(function(){
                                        callback(err);
                                    });
                                } else {
                                    logger.debug('processTransaction success');
                                    callback(null,results)
                                }
                            });
                        }
                    });
                }
            });
        }
    });
};

exports.createSchema = function(callback) {
    fs.readFile('../config/createschema.sql', function(err, data){
          if(err) console.err(err)
          else {
              var sqls = data.toString().split(';');
              async.filter(sqls, function(sql, cb) {
                    if(sql.replace(/\n/g,'')) {
                        cb(true);
                    }
                    else {
                        cb(false);
                    }
              }, function(results) {
                   processTransaction(results, function(err, result){
                          callback(err);
                   });
              })
          }
    });
};

exports.releasePool = function() {
    pool.end(function(err){
        if(err) {
            logger.log('error', 'releasePool', err);
        }
    })
}

exports.getEntityByCode = function(code, isDoctor, callback) {
    if(!code) {
        logger.log('error', 'getEntityByCode code undefined');
        callback(new Error('code undefined'));
    } else {
        var table;
        if(isDoctor) {
            table = 'doctors';
        }
        else {
            table = 'patients';
        }

        var sql = 'select d.ID, d.Name, d.Degree from ?? d inner join entity_code ec on d.ID = ec.EntityId where ec.Code = ?';
        var params = [table, code];

        processQuery('getEntityByCode', sql, params, callback);
    }
}

exports.loadDoctorsFromJson = function (json, callback) {
    if(typeof json == 'string') {
        json = JSON.parse(json);
    }

    async.map(json,function(d, cb){
        sql = mysql.format(sqlsConfig.insertDoctor, [d.name, d.prof_stat, d.pract_name, d.picture_url]);
        cb(null,sql);
    }, function(err, sqls) {
        if(err) { callback(err); }
        else {
            processTransaction(sqls, function(err, res) {
                if(err) { callback(err); }
                else { callback(null, res); }
            });
        }
    })
};

exports.insertCategory = function (categoryName, callback) {
    if(!categoryName) {
        logger.error('insertCategory', 'category name undefined');
        callback(new Error('category name undefined'));
    } else {
        processQuery('insertCategory', sqlsConfig.insertCategory, [categoryName], function(err, results) {
            if(err) { callback(err); }
            else { callback(null, results); }
        });
    }
}

exports.addDoctorToCategory = function(doctor, category, callback) {
    if(!doctor || !category) {
        logger.error('addDoctorToCategory undefined doctor or category');
        callback(new Error('undefined doctor or category'));
    }
    else {
        processQuery('addDoctorToCategory',sqlsConfig.addDoctorCategory, [doctor.id, category.id], function(err, results){
            if(err) callback(err);
            else {
                callback(null, results);
            }
        })
    }
}

exports.getAllCategories = function(params, callback){
    processQuery('getAllCategories', sqlsConfig.getAllCategories, [], callback);
};

