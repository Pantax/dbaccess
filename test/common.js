/**
 * Created by ozlevka on 3/21/14.
 */

var dbmanager = require('../lib/dbmanager');
var util = require('util');
var config = require('../config/config');
var mysql = require('mysql');



function moreTestFormat()
{
    var pool = mysql.createPool(config.mysql);
};



moreTestFormat();