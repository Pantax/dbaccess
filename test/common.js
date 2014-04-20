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

function processCreate() {
    dbmanager.createSchema(function(err) {
        dbmanager.releasePool();
    });
}

function insertDoctorsFromExample() {
    var doctors = require('../config/doctorsexample');
    dbmanager.loadDoctorsFromJson(doctors,function(err, results) {
        if(err) console.error(err);
        else console.log(results);

        dbmanager.releasePool();
    });
}

function createCategory(categoryName) {
    dbmanager.insertCategory(categoryName, function(err, results) {
        if(err) console.error(err);
        else console.log(results);

        dbmanager.releasePool();
    })
}

function addDoctorToCategoryTest() {
    dbmanager.addDoctorToCategory({id:1},{id : 1}, function(err, results){
        if(err) console.error(err);
        else console.log(results);

        dbmanager.releasePool();
    })
}

function getAllCategoriesTest() {
    dbmanager.getAllCategories({},function(err, results) {
       if(err) console.error(err);
       else console.log(results);

       dbmanager.releasePool();
    });
}

function insertDoctorTest() {
    var doctor = {
        name : 'Dr. Joseph Rahimian MD',
        prof_stat : 'Experienced physicians specializing in infections,travel medicine, STDs, HIV, and general medical care',
        pract_name : 'Village Park Medical',
        picture_url : 'http://d3o8tq2mzdhnjd.cloudfront.net/images/professionals/0ddd25d8-e005-41b1-89e9-5a89ba7431c1zoom.jpg'
    };

    dbmanager.saveDoctor(doctor,function(err, results){
        if(err) console.error(err);
        else console.log(results);

        dbmanager.releasePool();
    });
}

function updateDoctorTest() {
    var doctor = {
        id : 5,
        name : 'Dr. Joseph Rahimian MD',
        prof_stat : 'Experienced physicians specializing in infections,travel medicine, STDs, HIV, and general medical care',
        pract_name : 'Village Park Medical',
        picture_url : 'http://d3o8tq2mzdhnjd.cloudfront.net/images/professionals/0ddd25d8-e005-41b1-89e9-5a89ba7431c1zoom.jpg'
    };

    dbmanager.saveDoctor(doctor,function(err, results){
        if(err) console.error(err);
        else console.log(results);

        dbmanager.releasePool();
    });

}


function findDoctorByNameTest() {
    dbmanager.findDoctorBy('name', 'Dr.', function(err, results){
        if(err) console.error(err);
        else console.log(results);

        dbmanager.releasePool();
    });
}

function associateDoctorCategoryTest() {
    dbmanager.associateDoctorCategories(1,[1,4,5], function(err, results){
        if(err) console.error(err);
        else console.log(results);

        dbmanager.releasePool();
    });
}


function findDoctorByCategoryTest() {
    dbmanager.findDoctorByCategory(1,function(err, results){
        if(err) console.error(err);
        else console.log(results);

        dbmanager.releasePool();
    });
}


function saveDoctorAppointmentOptionsTest() {
    var options = [
        {week_day: 1,from_time:'12:00', duration:'15'},
        {week_day:1, from_time:'12:20', duration:'13'},
        {week_day: 1, from_time:'12:40', duration:'15'}
    ]

    dbmanager.saveDoctorAppointmentOptions(3, options, function(err, results){
        if(err) console.error(err);
        else console.log(results);

        dbmanager.releasePool();
    })
}

function getDoctorAppointmentOptionsTest() {
    dbmanager.getDoctorAppointmentsOptions(3, function(err, results){
        if(err) console.error(err);
        else console.log(results);

        dbmanager.releasePool();
    });
}

function deleteDoctorAppointmentOptionsTest() {
    dbmanager.deleteDoctorAppointmentsOptions([1], function(err, results){
        if(err) console.error(err);
        else console.log(results);

        dbmanager.releasePool();
    })
}


function savePatientTest() {
    dbmanager.savePatient({name:'Shmunk'}, function(err, results){
        if(err) console.error(err);
        else console.log(results);

        dbmanager.releasePool();
    });
}


function validateAppointmentTest() {
    var appointment = {
        doctor_app_options : [1],
        patient_id : 1,
        from_date : '2014-04-20 12:00',
        to_date : '2014-04-20 12:14'
    }

    dbmanager.validateAppointment(appointment, function(err, results) {
        if(err) console.error(err);
        else console.log(results);

        dbmanager.releasePool();
    });
}


function dateTimeTest() {
    var date = new Date();
    console.log(date);
    date.clearTime();
    console.log(date);
    dbmanager.getDoctorAppointmentsOptions(3, function(err, results){
        if(err) console.error(err);
        else {
            async.each(results, function(res, cb){
                console.log(res.from_time);
                var splittedTime = res.from_time.split(':');
                for(var i = 0; i < splittedTime.length; i++)
                {
                    splittedTime[i] = splittedTime[i] * 1;
                }
                d.addMinutes(splittedTime[0] * 60 + splittedTime[1]);

            }, function(err) {
                if(err) console.error(err);
            })
        }

        dbmanager.releasePool();
    });

}


function saveAppointmentTest() {
    var appointment = {
        doctor_app_options : [1],
        patient_id : 1,
        from_date : '2014-04-20 12:00',
        to_date : '2014-04-20 12:14'
    }

    dbmanager.saveAppointment(appointment, function(err, results) {
        if(err) console.error(err);
        else console.log(results);

        dbmanager.releasePool();
    });
}


function deleteAppointmentTest() {
    var appointment_id = 1;
    dbmanager.deleteAppointment(appointment_id, function(err, results){
        if(err) console.error(err);
        else console.log(results);

        dbmanager.releasePool();
    });
}

deleteAppointmentTest();
//saveAppointmentTest();
//saveDoctorAppointmentOptionsTest();
//validateAppointmentTest();
//dateTimeTest();
//savePatientTest();
//deleteDoctorAppointmentOptionsTest();
//getDoctorAppointmentOptionsTest();

//findDoctorByCategoryTest();
//associateDoctorCategoryTest();
//findDoctorByNameTest();
//updateDoctorTest();
//insertDoctorTest();
//getAllCategoriesTest();
//createCategory('Cardiologist');
//insertDoctorsFromExample();
//processCreate();

