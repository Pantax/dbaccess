/**
 * Created by ozlevka on 3/21/14.
 */

var dbmanager = require('../lib/dbmanager');
var util = require('util');
//dbmanager.createSchema();


/*dbmanager.saveDoctor({name:'levka pururjns', degree:'Doctor of mmmmmmmmm', id : 7}, function(err, result){
    if(err) console.error(err);
    else {
        console.log('OK');
    }

    dbmanager.releasePool();
});*/

/* dbmanager.deleteDoctor(7, function(err, results){
     if(err) console.error(err);
     else console.log(results);
    dbmanager.releasePool();
 })*/

/*
dbmanager.savePatient({name : 'Hello morkovka', id : 2}, function(err, patient){
    if(!err) {
        console.log(patient);
    }

    dbmanager.releasePool();
})*/

dbmanager.deletePatient(2, function(err, result) {
    if(!err) {
        console.log(result);
    }

    dbmanager.releasePool();
})
