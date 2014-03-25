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

addDoctorToCategoryTest();


//createCategory('Cardiologist');
//insertDoctorsFromExample();
//processCreate();

