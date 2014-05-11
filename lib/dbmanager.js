/**
 * Created by ozlevka on 3/21/14.
 */
require('date-utils');
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

function parseTimeFromString(time) {
    if(typeof time == 'string') {
        var splittedTime = time.split(':');
        for(var i = 0; i < splittedTime.length; i++) {
            splittedTime[i] = splittedTime[i] * 1;
        }

        return splittedTime[0] * 60 + splittedTime[1];
    }

    return 0;
}



