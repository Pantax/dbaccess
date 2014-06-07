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
                    logger.log('error', '%s query failed for params=%s', util.inspect(err), util.inspect(params));
                    callback(err);
                } else {
                    logger.debug(util.format('%s suces process sql= %s, params=  %s', endpoint, sql, util.inspect(params)));
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

exports.releasePool = function() {
    pool.end(function(err){
        if(err) {
            logger.log('error', 'releasePool', err);
        }
    })
}

exports.login = function(user_name, password, callback) {
    if(!user_name || !password) {
        logger.error('login user_name or password undefined');
        callback(new Error("user_name or password undefined"));
    } else {
        async.waterfall([
            function(cb) {
                processQuery('login', sqlsConfig.loginGetUser,[user_name, password], function(e, results) {
                    if(e) cb(e);
                    else {
                        cb(null,results);
                    }
                })
            },
            function(user_res, cb) {
                if(!user_res || user_res.length == 0) {
                    logger.error('login user %s password %s not found', user_name, password);
                    cb(new Error('user not found'));
                } else {
                    cb(null,user_res[0].id);
                }
            },
            function(user_id, cb) {
                    if(!user_id) cb(new Error('strange ' + user_id + ' user_id undefined'));
                else {
                    processQuery('login', sqlsConfig.getToken,[user_id, config.user.tokenExpiredIn], function(err, res){
                        if(err) {
                            logger.error('logger error get token %s', util.inspect(err));
                            cb(err);
                        } else {
                            if(res && res.length > 0) cb(null, res[0][0].retToken);
                            else cb(new Error('no result returned'));
                        }
                    })
                }
            }
        ], function(err, result) {
            if(err) {
                logger.error('login %s', util.inspect(err));
                callback(err);
            }
            else {
                callback(null, result);
            }
        });
    }
};

exports.userbytoken = function(token, callback) {
    if(!token) {
        logger.error('userbytoken token undefined');
        callback(new Error('token undefined'));
    } else {
        processQuery('userbytoken', sqlsConfig.getUserByToken, [token, config.user.tokenExpiredIn], function(err, results) {
            if(err) {
                logger.error('userbytoken %s', util.inspect(err));
                callback(err);
            }
            else if(results && results.length > 0) {
               callback(null, {user_id: results[0].user_id, entity_type: results[0].entity_type, entity_id : results[0].entity_id,  result:'OK'});
            } else {
                callback(null, {user_id:-1, result : 'not found'});
            }
        })
    }
};

exports.getuserstatus = function(user_id, callback) {
    if(!user_id) {
        logger.error('getuserstatus user_id undefined');
        callback('user_id undefined');
    } else {
        processQuery('getuserstatus', sqlsConfig.getUserStatus, [user_id, config.user.statusExpiredIn], function(err, results) {
            if(err) {
                logger.error('getuserstatus %s', util.inspect(err));
                callback(err);
            } else {
                if(results && results.length > 0) callback(null, results[0].status);
                else callback(null, null);
            }
        });
    }
};

exports.updateuserstatus = function(user_id, callback) {
    if(!user_id) {
        logger.error('updateuserstatus user_id undefined');
        callback('user_id undefined');
    } else {
        processQuery('updateuserstatus', sqlsConfig.updateUserStatus, [user_id], function(err, results) {
            if(err) {
                logger.error('updateuserstatus %s', util.inspect(err));
                callback(err);
            } else {
                callback(null, results);
            }
        });
    }
};

exports.doctorappoptions = function(doctor_id, callback) {
    if(!doctor_id) {
        logger.error('doctorappoptions doctor_id undefined');
        callback('doctor_id undefined');
    } else {
        var sql = sqlsConfig.getDoctorAppOptions.replace(/:doctorId/g, doctor_id);
        processQuery('doctorappoptions', sql, function(err, results) {
            if(err) {
                logger.error('doctorappoptions %s',  util.inspect(err));
                callback(err);
            } else {
                callback(null, results);
            }
        });
    }
};

exports.doctorsearch = function(terms, callback)   {
    if(!terms || terms.length == 0) {
        logger.error('doctorsearch terms undefined');
        callback('terms undefined');
    } else {
        var dynamicSql = '';
        for(var i = 0; i < terms.length; i++) {
            if(terms[i]) {
                if(i > 0) dynamicSql += ' or ';
                dynamicSql += sqlsConfig.searchDynamicPart.replace(/:term/g, terms[i]);
            }
        }

        var sql = sqlsConfig.searchMainPart.replace(/:dynamic/g, dynamicSql);
        processQuery('doctorsearch', sql, function(err, results){
            if(err) {
                logger.error('doctorsearch %s',  util.inspect(err));
                callback(err);
            } else {
                callback(null, results);
            }
        });
    }
}

exports.getdoctor = function(doctor_id, callback) {
    if(!doctor_id) {
        logger.error('getdoctor doctor_id undefined');
        callback(new Error("doctor_id undefined"));
    } else {
        processQuery("getdoctor", sqlsConfig.getDoctor, [doctor_id], callback);
    }
}

exports.getpatient = function(patient_id, callback) {
    if(!patient_id) {
        logger.error('getpatient patient_id undefined');
        callback(new Error("patient_id undefined"));
    } else {
        processQuery("getpatient", sqlsConfig.getPatient, [patient_id], callback);
    }
}


exports.getpatientappointments = function(patient_id, callback) {
    if(!patient_id) {
        logger.error('getpatientappointments patient_id undefined');
        callback(new Error("doctor_id undefined"));
    } else {
        processQuery("getpatientappointments", sqlsConfig.getPatientAppointments, [patient_id], callback);
    }
}

exports.getappointmentinfo = function(app_id, callback) {
    if(!app_id) {
        logger.error('getappointmentinfo app_id undefined');
        callback(new Error("app_id undefined"));
    } else {
        processQuery("getappointmentinfo", sqlsConfig.appointmentInfo, [app_id], callback);
    }
}

