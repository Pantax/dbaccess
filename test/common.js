/**
 * Created by ozlevka on 3/21/14.
 */

var dbmanager = require('../lib/dbmanager');
var util = require('util');
var config = require('../config/config');
var mysql = require('mysql');



dbmanager.deleteAppointment(1, function(err, appointment){
    if(err) console.error(err);
    else console.log(appointment);

    dbmanager.releasePool();
});