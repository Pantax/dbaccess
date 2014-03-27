/**
 * Created by ozlevka on 3/21/14.
 */

var dbmanager = require('../lib/dbmanager');
var util = require('util');
var config = require('../config/config');
var mysql = require('mysql');
var fs = require('fs');

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

findDoctorByNameTest();

//updateDoctorTest();
//insertDoctorTest();
//getAllCategoriesTest();
//createCategory('Cardiologist');
//insertDoctorsFromExample();
//processCreate();

