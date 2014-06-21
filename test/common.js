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
    dbmanager.doctorsearch(['hello'], 0, 10,function(err, results) {
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

function getPatientAppointmentHistoryTest() {
    dbmanager.getpatientapphistory(1,0,10,function(err, results) {
        if(err) console.error(err);
        else console.log(results);

        dbmanager.releasePool();
    });

}

function getPatientAppointmentHistoryTestNull() {
    dbmanager.getpatientapphistory(1,null,null,function(err, results) {
        if(err) console.error(err);
        else console.log(results);

        dbmanager.releasePool();
    });

}

function getPatientPersonalInfoTest() {
    dbmanager.getpatientpersonalinfo(1,function(err, results) {
        if(err) console.error(err);
        else console.log(results);

        dbmanager.releasePool();
    });

}

function updatePatientInfoExecutionTest() {
    var test_object = {
        "patient_id":"1",
        "name": "John Smith",
        "birthday": "20/05/1977",
        "marital_status": "Married",
        "occupation": "Engineer",
        "address": "DDD St., Moscow",
        "picture_url": "example.com/pictures/pict1.jpg"
    }

    dbmanager.updatepatientinfo(test_object, function(err, results) {
        if(err) console.error(err);
        else console.log(results);

        dbmanager.releasePool();
    })
}


function testArrayToSqlStatement() {
    var arr = ['patient_id', 'weight', 'height', 'blood_pressure', 'temperature', 'appointment_reason', 'additional_info', 'appointment_option_ids', 'id'];

    console.log(dbmanager.forTest([arr,"'"]));
}


function saveAppointmentTest() {
    var app_info = {
        "id" : 6,
        "patient_id": "1",
        "weight": "77.5",
        "height": "177",
        "blood_pressure": "90x120",
        "temperature": "36.8",
        "appointment_reason": "SsSs",
        "additional_info": "sSS",
        "appointment_option_ids" : [1, 15]

    };

    dbmanager.saveappointment(app_info, function(err, results){
        if(err) console.error(err);
        else console.log(results);

        dbmanager.releasePool();
    })
}

function getappointmentTest() {
    dbmanager.getappointment(1, function(err, res) {
        if(err) console.error(err);
        else console.log(res);

        dbmanager.releasePool();
    });
}

function getpatientdetailsTest() {
    dbmanager.getpatientdetails(1, function(err, res) {
        if(err) console.error(err);
        else console.log(res);

        dbmanager.releasePool();
    });
}

function getcategoriesTest() {
    dbmanager.getcategories(2,10,function(err, results){
        if(err) console.error(err);
        else console.log(results);

        dbmanager.releasePool();
    })
}


function insertdocumentTest() {
    var document = {
        "name" : "Spravka",
        "subject" : "Blood glucose test",
        "file_url" : "http://aaa.com/asassa/ssss/qwqq.cf"
    };

    dbmanager.insertdocument(document, 'patient', 1, function(err, results) {
        if(err) console.error(err);
        else console.log(results);

        dbmanager.releasePool();
    });
}

insertdocumentTest();
//getcategoriesTest();
//getpatientdetailsTest();
//getappointmentTest();
//saveAppointmentTest();
//testArrayToSqlStatement();
//updatePatientInfoExecutionTest();
//getPatientPersonalInfoTest();
//getPatientAppointmentHistoryTest();
//getPatientAppointmentHistoryTestNull();
//getAppointmentInfoTest();
/// /getPatientTest();
//test_login();
//userbytokenTest();
//getUserStatusTest();
//updateUserStatusTest();
//doctorAppOptionsTest();
//doctorSearchTest();
//getDoctorTest();


