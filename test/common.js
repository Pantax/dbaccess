/**
 * Created by ozlevka on 3/21/14.
 */
require('date-utils');
var dbmanager = require('../lib/dbmanager');
var util = require('util');
var config = require('../config/config');
var mysql = require('mysql');
var fs = require('fs');
var async = require('async');


function test_login() {
    dbmanager.login('kala', 'mala', function(err, res) {
        if(err) console.error(err);
        else console.log(util.inspect(res));

        dbmanager.releasePool();
    });
}


function userbytokenTest() {
    dbmanager.userbytoken('b0dbdc67-db77-11e3-8a5f-0800278eff10', function(err, result) {
        if(err) console.error(err);
        else console.log(result);

        dbmanager.releasePool();
    })
}


function getUserStatusTest() {
    dbmanager.getuserstatus(1, function(err, results) {
        if(err) console.error(err);
        else console.log(results);

        dbmanager.releasePool();
    });
}

function updateUserStatusTest() {
    dbmanager.updateuserstatus(4, function(err, results) {
        if(err) console.error(err);
        else console.log(results);

        dbmanager.releasePool();
    });
}

function doctorAppOptionsTest () {
    dbmanager.doctorappoptions(1, function(err, results) {
        if(err) console.error(err);
        else console.log(results);

        dbmanager.releasePool();
    });
}


function doctorSearchTest() {
    dbmanager.doctorsearch(['hello'],function(err, results) {
        if(err) console.error(err);
        else console.log(results);

        dbmanager.releasePool();
    });
}


function getDoctorTest() {
    dbmanager.getdoctor(1,function(err, results) {
        if(err) console.error(err);
        else console.log(results);

        dbmanager.releasePool();
    });
}

function getPatientAppointmentsTest() {
    dbmanager.getpatientappointments(1, function(err, results) {
        if(err) console.error(err);
        else console.log(results);

        dbmanager.releasePool();
    });
}


function getPatientTest() {
    dbmanager.getpatient(1,function(err, results) {
        if(err) console.error(err);
        else console.log(results);

        getPatientAppointmentsTest()
    });
}


function getAppointmentInfoTest() {
    dbmanager.getappointmentinfo(1,function(err, results) {
        if(err) console.error(err);
        else console.log(results);

        dbmanager.releasePool();
    });
}



getAppointmentInfoTest();
/// /getPatientTest();
//test_login();
//userbytokenTest();
//getUserStatusTest();
//updateUserStatusTest();
//doctorAppOptionsTest();
//doctorSearchTest();
//getDoctorTest();


