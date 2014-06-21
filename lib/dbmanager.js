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
    if(typeof params === 'function') {
        callback = params
        params  = null;
    }
    pool.getConnection(function(err, connection){
        if(err) {
            logger.log('error', util.format('%s getConnection failed', endpoint) , util.inspect(err));
            callback(err);
        } else {
            var queryCb = function(err, results){
                if(err) {
                    logger.log('error', '%s query failed for params=%s', util.inspect(err), util.inspect(params));
                    callback(err);
                } else {
                    logger.debug(util.format('%s suces process sql= %s, params=  %s', endpoint, sql, util.inspect(params)));
                    callback(null, results);
                }
                connection.release();
            };
            if(!params) {
                connection.query(sql,queryCb);
            } else {
                connection.query(sql, params, queryCb);
            }
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

function fromArraySqlString(arr, quoteReplacement) {
    var strArr = JSON.stringify(arr);
    return strArr.replace(/\[/g, '(').replace(/\]/g, ')').replace(/"/g, quoteReplacement);
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

exports.doctorsearch = function(terms, from, size, callback)   {
    if(!terms || terms.length == 0) {
        logger.error('doctorsearch terms undefined');
        callback('terms undefined');
    }  else {
        var dynamicSql = '';
        for(var i = 0; i < terms.length; i++) {
            if(terms[i]) {
                if(i > 0) dynamicSql += ' or ';
                dynamicSql += sqlsConfig.searchDynamicPart.replace(/:term/g, terms[i]);
            }
        }

        var sql = sqlsConfig.searchMainPart.replace(/:dynamic/g, dynamicSql);

        async.waterfall([
            function(cb) {
                processQuery('doctorsearch', sql, [ from, size], function(err, res) {
                    if(err) cb(err);
                    else cb(null, res);
                });
            },
            function(doctors, cb) {
                async.map(doctors, function(doctor, clb) {
                    exports.doctorappoptions(doctor.id, function(err, options){
                        if(err) clb(err);
                        else {
                            doctor.options = options;
                            clb(null,doctor);
                        }
                    });
                }, function(err, res) {
                    if(err) cb(err);
                    else cb(null, doctors);
                });
            }
        ], function(err, results) {
            if(err) callback(err);
            else {
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

exports.getpatientapphistory = function(patient_id, page, size, callback) {
    var pg = page? page : 0;
    var sz = size? size : 10;
    if(!patient_id) {
        logger.error('getpatientapphistory patient_id undefined');
        callback(new Error("patient_id undefined"));
    } else {
        processQuery("getpatientapphistory", sqlsConfig.patientAppointmentHistory, [patient_id, pg, sz], callback);
    }
}

exports.getpatientpersonalinfo = function(patient_id, callback) {
    if(!patient_id) {
        logger.error('getpatientpersonalinfo patient_id undefined');
        callback(new Error("patient_id undefined"));
    } else {
        processQuery("getpatientpersonalinfo", sqlsConfig.patientPersonalInfo, [patient_id], callback);
    }
}

exports.updatepatientinfo = function(patient_info, callback) {
    if(!patient_info) {
        logger.error('updatepatientinfo patient_info undefined');
        callback(new Error("patient_info undefined"));
    } else {
        if (patient_info.patient_id) {
            var allowed_fields = ['name', 'birthday', 'marital_status', 'occupation', 'address', 'picture_url', 'balance', "patient_id"];
            var object_keys = Object.keys(patient_info);
            for (var i = 0; i < object_keys.length; i++) {
                if (allowed_fields.indexOf(object_keys[i]) < 0) {
                    logger.error(util.format('updatepatientinfo %s not allowed field', object_keys[i]));
                    callback(new Error(util.format('%s not allowed field', object_keys[i])));
                    return;
                }
            }

            var updateStatement = '';
            for (var i = 0; i < object_keys.length; i++) {
                if (object_keys[i] != 'patient_id') {
                    if (updateStatement != '') {
                        updateStatement += util.format(", %s='%s'", object_keys[i], patient_info[object_keys[i]].toString().replace(/'/g, "''"));
                    } else {
                        updateStatement += util.format(" %s='%s'", object_keys[i], patient_info[object_keys[i]].toString().replace(/'/g, "''"));
                    }
                }
            }

            var sql = sqlsConfig.updatePatientInfo.replace(/:updateStatement/, updateStatement).replace(/:id/, patient_info.patient_id);

            processQuery('updatepatientinfo', sql, function(err, results) {
                if(err) callback(err);
                else {
                    callback(null,results);
                }
            })

        } else {
            logger.error('updatepatientinfo patient_id field undefined');
            callback(new Error('patient_id field undefined'));
        }
    }
}

exports.saveappointment = function(appointment_info, callback) {
    if(!appointment_info) {
        logger.error('saveappointment appointment_info undefined');
        callback(new Error('appointment_info undefined'));
    } else {
        var allowed_fields = ['patient_id', 'weight', 'height', 'blood_pressure', 'temperature', 'appointment_reason', 'additional_info', 'appointment_option_ids', 'id'];

        if(!appointment_info.appointment_option_ids || !Array.isArray(appointment_info.appointment_option_ids)) {
            logger.error('saveappointment appointment_option_ids field undefined or is not array');
            callback(new Error('appointment_option_ids field undefined or is not array'));
            return;
        }

        var object_keys = Object.keys(appointment_info);
        var columns = [];
        var values = [];
        var updStatement = '';
        for(var i = 0; i < object_keys.length; i++) {
            if(allowed_fields.indexOf(object_keys[i]) < 0) {
                logger.error(util.format('saveappointment %s field not allowed', object_keys[i]));
                callback(new Error(util.format('%s field not allowed', object_keys[i])))
                return;
            } else {
                if (object_keys[i] != "id" && object_keys[i] != 'appointment_option_ids') {
                    columns.push(object_keys[i]);
                    values.push(appointment_info[object_keys[i]]);
                    if(updStatement != '') {
                      updStatement += util.format(", %s='%s'", object_keys[i], appointment_info[object_keys[i]].toString().replace(/'/g, "''"));
                    } else {
                      updStatement += util.format(" %s='%s'", object_keys[i], appointment_info[object_keys[i]].toString().replace(/'/g, "''"));
                    }
                }
            }
        }

        pool.getConnection(function(err, connection) {
            if(err) {
                logger.error('saveappointment ' + util.inspect(err));
                callback(err);
            } else {
                connection.beginTransaction(function(err) {
                    if(err) {
                        logger.error('saveappointment ' + util.inspect(err));
                        callback(err);
                    } else {
                        async.waterfall([
                            function(cb) {
                                var sql = '';
                                if(appointment_info.id) {
                                    sql = sqlsConfig.updateAppointment.replace(/:updateStatement/, updStatement).replace(/:id/, appointment_info.id);
                                } else {
                                    sql = sqlsConfig.insertAppointment.replace(/:columns/, fromArraySqlString(columns,'`')).replace(/:values/, fromArraySqlString(values,"'"));
                                }
                                logger.debug('process %s', sql);
                                connection.query(sql, function(err, results) {
                                    if (!err) {
                                        if (appointment_info.id) {
                                            cb(null, appointment_info.id);
                                        } else {
                                           cb(null, results.insertId);
                                        }
                                    } else {
                                        cb(err);
                                    }
                                });
                            },
                            function(app_id, cb) {
                                var sql = sqlsConfig.deleteAppointmentAppointmentOptions.replace(/:id/, app_id);
                                logger.debug('process %s', sql);
                                connection.query(sql, function(e, r) {
                                    if(e) cb(e);
                                    else cb(null, app_id)
                                });
                            },
                            function(app_id, cb) {
                                async.each(appointment_info.appointment_option_ids, function(opt_id, c){
                                    logger.debug('process %s with params %s',sqlsConfig.insertAppointmentAppointmentOption, util.inspect([app_id, opt_id]));
                                    connection.query(sqlsConfig.insertAppointmentAppointmentOption, [app_id, opt_id], function(err, rslt) {
                                        if(err) {
                                            c(err);
                                        } else {
                                            c(null);
                                        }
                                    });
                                }, function(err){
                                    if(err) {
                                        cb(err);
                                    } else {
                                        cb(null);
                                    }
                                })
                            }
                        ], function(err, res) {
                            if(err) {
                                logger.error('saveappointment ' + util.inspect(err));
                                connection.rollback();
                                callback(err);
                            }
                            else {
                                connection.commit(function(err) {
                                   if(err) {
                                       logger.error('saveappointment ' + util.inspect(err));
                                       callback(err);
                                   } else callback(null, 'OK');
                                });
                            }
                        })
                    }
                })
            }
        })
    }
}

exports.forTest = function(args) {
    var arr = args[0];
    var replacement = args[1];
    return fromArraySqlString(arr,replacement);
}

exports.getappointment = function(app_id, callback) {
    if(!app_id) {
        logger.error('saveappointment app_id undefined');
        callback(new Error('app_id undefined'));
    } else {
        async.parallel([
            function(cb) {
                exports.getappointmentinfo(app_id, function(e, res) {
                    if(e) {
                        logger.error('getappointment %s', util.inspect(e));
                        cb(e);
                    } else {
                        cb(null, res);
                    }
                })
            },
            function(cb) {
                processQuery('getappointment', sqlsConfig.getAppOptionsByApp, [app_id], function(e, res) {
                    if(e) {
                        logger.error('getappointment %s', util.inspect(e));
                        cb(e);
                    } else {
                        cb(null, res);
                    }
                })
            }
        ],function(err,results) {
            if(!results || results.length == 0) {
                logger.error('getappointment appointment for %d id not found', app_id);
                callback(new Error(util.format('appointment for %d id not found', app_id)));
            } else {
                var resObj = results[0][0];
                if(results.length > 1) {
                    resObj.options = results[1];
                } else {
                    resObj.options = [];
                }

                callback(null, resObj);
            }
        })
    }
}

exports.getpatientdetails = function(pat_id, callback) {
    if(pat_id) {
        async.parallel([
           function(cb) {
                exports.getpatient(pat_id, cb);
           },
           function(cb) {
               processQuery("getpatientdetails", sqlsConfig.getPatientReviews, [pat_id], cb);
           },
           function(cb) {
               processQuery("getpatientdetails", sqlsConfig.getPatientAppointments, [pat_id], cb);
           }
        ], function(err, results) {
            if(err) callback(err);
            else {
                if(results && results.length > 0) {
                    var resObject = results[0][0];
                    resObject.reviews = results[1];
                    resObject.appointments = results[2];
                    callback(null, resObject);
                } else {
                    logger.error('getpatientdetails patient %d not found', pat_id);
                    callback(new Error(util.format("patient %d not found", pat_id)));
                }
            }
        })

    } else {
        logger.error('getpatientdetails pat_id undefined');
        callback(new Error('pat_id undefined'));
    }
}


exports.getcategories = function(from, size, callback) {
    processQuery('getcategories', sqlsConfig.getCategories, [from, size], callback);
}

exports.insertdocument = function(document, callback) {
    if(!document) {
       logger.error('insertdocument document undefined');
       callback(new Error('document undefined'));
       return;
    }

    var allowed_fields = ['name', 'subject', 'file_url'];
    var object_keys = Object.keys(document);
    if(object_keys.length == 0) {
        logger.error('insertdocument no document fields found');
        callback(new Error('no document fields found'))
    }
    for(var i = 0; i < object_keys.length; i++) {
        if(allowed_fields.indexOf(object_keys[i]) < 0) {
            var message = util.format('field %s not alllowed for document', object_keys[i]);
            logger.error('insertdocument ' + message );
            callback(new Error(message));
            return;
        }
    }

    processQuery('insertdocument', sqlsConfig.insertDocument, [document.name, document.subject, document.file_url], function(err, results) {
        if(err) callback(err);
        else callback(null, results);
    });
}



