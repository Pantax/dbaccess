/**
 * Created by ozlevka on 3/21/14.
 */
var mysql = require('mysql');
var config = require('../config/config');
var fs = require('fs');
var async = require('async');
var winston = require('winston');
var util = require('util');

var logger = new (winston.Logger)({
    transports : [
        new (winston.transports.Console)(config.logger.console),
        new (winston.transports.File)(config.logger.file)
    ]
});


var pool = mysql.createPool(config.mysql);

exports = module.exports;


function processQuery(endpoint, sql, params, callback) {
    pool.getConnection(function(err, connection){
        if(err) {
            logger.log('error', util.format('%s getConnection failed', endpoint) , err);
            callback(err);
        } else {
            connection.query(sql, params, function(err, results){
                if(err) {
                    logger.log('error', '%s query failed', err);
                    callback(err);
                } else {
                    logger.debug(util.format('%s suces process %s', endpoint, sql));
                    callback(null, results);
                }
                connection.release();
            });
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
                             logger.log('debug', 'running sql %s', sql);
                             callback(null, 'OK');
                         }
                      });
                  }
                  else
                    callback(null,'EMPTY');
              }, function(err, results) {
                 if(err) logger.log('error', 'create schema error:%s', err);
                 else {
                     logger.log('debug', 'finish create schema %s', results);
                     pool.end();
                 }
              })
          }
    });
};


exports.saveDoctor = function(doctor, callback) {
    if (!doctor) {
        logger.log('error', 'saveDoctor with undefined argument');
        callback(new Error('doctor is undefined'));
    } else {
       if (doctor.id) {
           var sql = 'UPDATE pantax.doctors SET Name = ?, Degree = ? where ID = ?';
           var params = [doctor.name, doctor.degree, doctor.id];
       } else {
           var sql = 'INSERT INTO pantax.doctors ( Name, Degree ) VALUES ( ?, ? )';
           var params = [doctor.name, doctor.degree];
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

exports.deleteDoctor = function(doctorId,callback) {
    if(!doctorId) {
        logger.log('error', 'deleteDoctor failed: undefined doctorId');
        callback(new Error('doctorId undefined'));
    } else {
        var sql = 'DELETE FROM pantax.doctors WHERE ID = ?';
        processQuery('deleteDoctor', sql, [doctorId], callback)
    }
}

exports.releasePool = function() {
    pool.end(function(err){
        if(err) {
            logger.log('error', 'releasePool', err);
        }
    })
}

exports.savePatient = function(patient, callback) {
    if(!patient) {
        logger.error('savePatient failed undefined patient');
        callback(new Error('undefined patient'));
    } else {
        if(patient.id) {
            var sql = 'UPDATE pantax.patients SET Name = ? WHERE ID = ?';
            var params = [patient.name, patient.id];
        } else {
            var sql = 'INSERT INTO pantax.patients( Name ) VALUES ( ? )';
            var params = [patient.name]
        }

        processQuery('savePatient', sql, params, function(err, results) {
            if(err) callback(err);
            else {
                if(results.insertId) {
                    patient.id = results.insertId;
                }

                callback(null, patient);
            }
        })
    }
}

exports.deletePatient = function(patientId, callback) {
    if(!patientId) {
        logger.error('deletePatient patientId is undefined');
        callback(new Error(' patientId is undefined'));
    } else {
        var sql = 'DELETE FROM pantax.patients WHERE ID = ?';
        processQuery('deletePatient', sql, [patientId], function(err, results) {
            if(err) callback(err);
            else {
                callback(null, 'OK');
            }
        })
    }
}

exports.saveDocument = function(document, callback) {
    if(!document) {
        logger.log('error', 'saveDocument failed undefined document');
        callback(new Error('undefined document'));
    } else {
        if(document.id) {
            var sql = 'UPDATE pantax.documents SET Name = ? ,Type = ? ,FilePath = ?, Comments = ?, WHERE ID = ?';
            var params = [document.name, document.type, document.filePath, document.comments, document.id];
        } else {
            var sql = 'INSERT INTO pantax.documents ( ?? )  VALUES ( ? )';
            var prepare = createQueryFromObject(document);
            var params = [prepare.columns, prepare.values];
        }

        processQuery('saveDocument', sql, params, function(err, results){
            if (err) callback(err);
            else {
                if(results.insertId) document.id = results.insertId;
                callback(null, document);
            }
        });
    }
}

exports.deleteDocument = function(documentId, callback) {
    if(!documentId) {
        logger.error('deleteDocument documentId is undefined');
        callback(new Error(' documentId is undefined'));
    } else {
        var sql = 'DELETE FROM pantax.documents WHERE ID = ?';
        processQuery('deleteDocument', sql, [documentId], function(err, results) {
            if(err) callback(err);
            else {
                callback(null, 'OK');
            }
        })
    }
}

exports.saveAppointment = function(appointment, callback) {
    if(!appointment) {
        logger.log('error', 'saveAppointment failed undefined appointment');
        callback(new Error('undefined appointment'));
    } else {
        if(appointment.id) {
            var sql = 'UPDATE pantax.appointments SET DoctorId = ? ,PatientId = ? ,FromDate = ?, ToDate = ? WHERE ID = ?';
            var params = [appointment.doctorId, appointment.patientId, appointment.fromDate, appointment.toDate, appointment.id];
        } else {
            var sql = 'INSERT INTO pantax.appointments ( ?? )  VALUES ( ? )';
            var prepare = createQueryFromObject(appointment);
            var params = [prepare.columns, prepare.values];
        }

        processQuery('saveAppointment', sql, params, function(err, results){
            if (err) callback(err);
            else {
                if(results.insertId) appointment.id = results.insertId;
                callback(null, appointment);
            }
        });
    }
}

exports.deleteAppointment = function(appointmentId, callback) {
    if(!appointmentId) {
        logger.error('deleteAppointment appointmentId is undefined');
        callback(new Error(' appointmentId is undefined'));
    } else {
        var sql = 'DELETE FROM pantax.appointments WHERE ID = ?';
        processQuery('deleteAppointment', sql, [appointmentId], function(err, results) {
            if(err) callback(err);
            else {
                callback(null, 'OK');
            }
        })
    }
}






