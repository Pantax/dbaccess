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
            });
        }
    })
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









