/**
 * Copyright 2017, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}


var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : '35.190.133.29',
  user     : 'root',
  database : 'truckanddriverIDs'
});

// var connection = mysql.createConnection({
//   host     : '127.0.0.1',
//   port     : '3306',
//   user     : 'root',
//   database : 'truckanddriverIDs'
// });

connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }

  console.log('connected as id ' + connection.threadId);
});

const express = require('express');
const bodyParser = require('body-parser');
const Buffer = require('safe-buffer').Buffer;

const app = express();
app.use(bodyParser.json());

app.post('/echo', (req, res) => {
  console.log(req.body);
  res.status(200).json({message: req.body.message});
});

app.get('/truckGps', (req, res) => {


  res.status(200).json([{id: 123, long: 40.123, lat: 20.123},{id: 123, long: 40.123, lat: 20.123},{id: 123, long: 40.123, lat: 20.123}]);
});

app.get('/driverGps', (req, res) => {

  res.status(200).json([{id: 123, long: 40.123, lat: 20.123},{id: 123, long: 40.123, lat: 20.123},{id: 123, long: 40.123, lat: 20.123}]);
});

app.post('/link', (req, res) => {

  const { truckID, driverID } = req.body;

  connection.query(`select * from linkTable where driverID='${driverID}';`, function (error, results, fields) {
    if(error) res.status(400).json({ message: error });
    if(!results) res.status(400).json({ message: 'no such driverID' });
    connection.query(`update linkTable set truckID=${truckID} where driverID='${driverID}';`, function (error, results, fields) {
      if(error) res.status(400).json({ message: error });
      res.status(200).json({ message: 'updated' });
    });
  });

});

app.post('/truckApi', (req, res) => {

  

});

if (module === require.main) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
  });
}

module.exports = app;
