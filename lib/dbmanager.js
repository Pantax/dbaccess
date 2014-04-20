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

exports.setConfig = function(cfg, callback) {
    config = cfg;
    callback(null);
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

exports.saveDoctor = function(doctor, callback) {
    if (!doctor) {
        logger.log('error', 'saveDoctor with undefined argument');
        callback(new Error('doctor is undefined'));
    } else {
       if (doctor.id) {
           var sql = sqlsConfig.updateDoctor;
           var params = [doctor.name, doctor.prof_stat, doctor.pract_name, doctor.picture_url, doctor.id];
       } else {
           var sql = sqlsConfig.insertDoctor;
           var params = [doctor.name, doctor.prof_stat, doctor.pract_name, doctor.picture_url];
       }

       processQuery('saveDoctor', sql, params, function(err, results){
           if(err) callback(err);
           else {
               if(results.insertId) doctor.id = results.inserId;
               callback(null, doctor);
           }
       })
    }
}

exports.findDoctorBy = function(field, term, callback) {
    if(!field || !term) {
        logger.error('findDoctorBy field or term undefined');
        callback(new Error('field or term undefined'));
    } else {
        processQuery('findDoctorBy', sqlsConfig.findDoctorBy,[field, '%' + term + '%'], function(err, results){
            if(err) callback(err);
            else
                callback(null, results);
        })
    }
}

exports.findDoctorByCategory = function(categoryId, callback) {
    if(!categoryId) {
        logger.error("findDoctorByCategory categoryId undefined");
        callback(new Error("categoryId undefined"));
    } else {
        processQuery('findDoctorByCategory',sqlsConfig.findDoctorByCategory,[categoryId], function(err, results) {
            if(err) callback(err);
            else callback(null, results);
        });
    }
};

exports.getDoctorCategories = function(doctorId, callback) {

};

exports.associateDoctorCategories = function(doctorId, categoryIds, callback){
    if(!doctorId || !categoryIds) {
        logger.error('Undefined doctorId or categories');
        callback(new Error('Undefined doctorId or categories'));
    } else {
        var sqls = [];
        sqls.push(mysql.format(sqlsConfig.deleteDoctorCategory,[doctorId]));
        async.each(categoryIds, function(catId, cb){
            sqls.push((mysql.format(sqlsConfig.insertDoctorCategory,[doctorId, catId])));
            cb(null);
        }, function(err){
            processTransaction(sqls,function(err,results){
                if(err) callback(err);
                else callback(null, results);
            })
        })
    }
};

exports.saveDoctorAppointmentOptions = function(doctor_id, options, callback) {
    if(!doctor_id || !options) {
        looger.error('addDoctorAppointmentOptions doctor_id or options undefined');
        callback(new Error('doctor_id or options undefined'));
    } else {
        async.map(options, function(option, opCallback){
            if(option.id) {
                opCallback(null, mysql.format(sqlsConfig.updateDoctorAppointmentOption,[option.week_day, option.from_time, option.duration, option.id]));
            } else {
                opCallback(null, mysql.format(sqlsConfig.insertDoctorAppointmentOption, [doctor_id, option.week_day, option.from_time, option.duration]));
            }
        }, function(err, sqls){
            if(err) { callback(err);}
            else {
                processTransaction(sqls,function(err, results){
                    callback(err, results);
                });
            }
        });
    }
};

exports.getDoctorAppointmentsOptions = function(doctor_id, callback) {
    if(!doctor_id) {
        logger.error("getDoctorAppointmentsOptions doctor_id undefined");
        callback(new Error('doctor_id undefined'));
    } else {
        processQuery('getDoctorAppointmentsOptions', sqlsConfig.getDoctorAppointmentOptions, doctor_id, function(err, results){
            if(err) callback(err);
            else callback(null, results);
        });
    }
}

exports.deleteDoctorAppointmentsOptions = function(option_ids, callback) {
    if(!option_ids || !option_ids.length) {
        logger.error('deleteDoctorAppointmentsOptions option_ids is undefined or empty');
        callback(new Error('option_ids is undefined or empty'))
    } else {
        async.map(option_ids, function(id, callback){
            callback(null,mysql.format(sqlsConfig.deleteDoctorAppointmentOption, id));
        }, function(err, sqls){
            processTransaction(sqls, function(err, results){
                if(err) callback(err);
                else callback(null, results);
            });
        });
    }
};

exports.savePatient = function(patient, callback) {
   if(!patient) {
       logger.error('savePatient patient undefined');
       callback(new Error('patient undefined'));
   } else {
       if(patient.id) {
         processQuery('savePatient', sqlsConfig.updatePatient, [patient.name, patient.id], function(err, results) {
            if(err) callback(err);
            else callback(null, results);
         });
       } else {
            processQuery('savePatient', sqlsConfig.insertPatient, [patient.name], function(err, results){
                if(err) callback(err);
                else callback(null, results);
            });
       }
   }
};

exports.saveAppointment = function(appointment, callback) {
    if(!appointment) {
        logger.error('saveAppointment appointment not defined');
        callback(new Error('appointment not defined'));
    } else if(!appointment.doctor_app_options || !appointment.patient_id) {
        logger.error('saveAppointment appointment options or patient not defined');
        callback(new Error('appointment options or patient not defined'));
    } else if(!appointment.from_date || !appointment.to_date) {
        logger.error('saveAppointment from_date or to_date not defined');
        callback(new Error('from_date or to_date not defined'));
    } else {
       pool.getConnection(function (err, connection) {
            if(err) {
                logger.error('saveAppointment error get pool connection', util.inspect(err));
                callback(err);
            } else {
                connection.beginTransaction(function(err){
                    if(err){
                        logger.error('saveAppointment begin transaction error', util.inspect(err));
                        callback(err);
                    }
                    else {
                        exports.validateAppointment(appointment, connection, function(err, res){
                            if(err) {
                              logger.error('validate appointment error', util.inspect(err));
                              callback(err);
                            } else if(res) {
                                if (!appointment.id) {
                                    async.waterfall([
                                        function(cb){
                                            connection.query(sqlsConfig.insertAppointment, [appointment.patient_id, appointment.from_date, appointment.to_date], function(err, results){
                                                if(err) {
                                                    logger.error('saveAppointment insert appointment error', util.inspect(err))
                                                    cb(err);
                                                } else {
                                                    cb(null, {appointmentId: results.insertId})
                                                }
                                            })
                                        },
                                        function(app_id, cb) {
                                            async.each(appointment.doctor_app_options, function(op, incb){
                                                connection.query(sqlsConfig.insertAppointmentOptions, [op, app_id.appointmentId], function(err, results){
                                                    if(err) cb(err)
                                                    else cb(null);
                                                })
                                            }, function(err, inres){
                                                if(err) {
                                                    logger.error('insert appointment option link', util.inspect(err));
                                                    cb(err);
                                                } else {
                                                    cb(null);
                                                }
                                            })
                                        }
                                        //todo add more functions to this transaction
                                    ], function(err, results){
                                        if(err) {
                                            logger.error('saveAppointment error', util.inspect(err));
                                            connection.rollback(function(){
                                                    callback('insert appointment failed');
                                            });
                                        } else {
                                            connection.commit(function(){
                                                callback(null, results);
                                            });
                                        }
                                    });
                                } else {
                                    //todo update appointment if delete insert is not good for jews
                                }
                            } else {
                                callback('appointment validation failed');
                            }

                        });
                    }
                });
            }
        });
    }
};

exports.validateAppointment = function(appointment, connection, callback) {
    var externalConnection = true;
    if(typeof connection == 'function') {
        callback = connection;
        externalConnection = false;
    }
    async.waterfall([
        function(cb) {
            if(externalConnection) cb(null);
            else {
                pool.getConnection(function(err, con) {
                    if(err) {
                        logger.error('validateAppointment error getConnection', util.inspect(err));
                        cb(err);
                    } else {
                        connection = con;
                        cb(null);
                    }
                });
            }
        },
        function(cb) {
            if(!appointment) cb(new Error('Appointment undefined'));
            else if(!appointment.doctor_app_options || !appointment.patient_id || !appointment.from_date || !appointment.to_date) cb(new Error('Appointment details undefined'));
            else {
                var sql = sqlsConfig.getMultipleDoctorAppOptions.replace(/inreplace/g,appointment.doctor_app_options.toString());
                connection.query(sql, function(err, results){
                    if(err) cb(err);
                    else {
                        cb(null, results);
                    }
                });
            }
        },
        function(results, cb) {
            if(!results || results.length == 0) {
                cb('no appointment options found');
            }
            else async.each(results, function(doctor_app_option, valCb){
                var startDate = new Date(appointment.from_date);
                var endDate = new Date(appointment.to_date);
                if(doctor_app_option.week_day != (startDate.getDay() + 1)) valCb({option_id:doctor_app_option.id, message: 'week day is different'});
                else {
                    var optionStart = startDate.clone();
                    optionStart.clearTime();
                    optionStart.addMinutes(parseTimeFromString(doctor_app_option.from_time));
                    var optionEnd = optionStart.clone().addMinutes(doctor_app_option.duration * 1);
                    if(!startDate.between(optionStart, optionEnd) || !endDate.between(startDate, endDate)) valCb({option_id:doctor_app_option.id, message: 'appointment is not between doctor option dates'});
                    else {
                        valCb(null,{option_id:doctor_app_option.id, message: 'appointments valid for option'});
                    }
                }
            }, function(err, res){
                if(err) {
                    cb(err);
                } else {
                    cb(null, res);
                }
            });
        }], function(err, results){
         if(err) {
             logger.error('validate appointment error', util.inspect(err));
             if(!externalConnection) connection.release();
             callback(null, false);
         }  else {
              callback(null, true);
         }
    });


};

exports.deleteAppointment = function(appointment_id, callback) {
     if(!appointment_id) {
         logger.error('deleteAppointment appointment_id undefined');
         callback(new Error('appointment_id undefined'));
     } else {
         var sqls = [
            mysql.format(sqlsConfig.deleteAppointment, appointment_id),
            mysql.format(sqlsConfig.deleteAppointmentAppointmentOptions, appointment_id),
            mysql.format(sqlsConfig.deleteAppointmentMessage, appointment_id)
         ];

         processTransaction(sqls, function(err, results){
             if(err) {
                 logger.error('deleteAppointment error', util.inspect(err));
                 callback(err);
             } else {
                 callback(null, results);
             }
         })

     }
};

