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
//
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

  connection.query('select * from truckGPSTable;', (error, results, fields) => {
    if(error) res.status(400).json({ message: error });
    var results2 = results.map(({ driverID, latGPS, longGPS }) => ({
      id: driverID,
      lat: latGPS,
      long: longGPS,
    })
    );
    res.status(200).json(results2);
  });

});

app.get('/driverGps', (req, res) => {

  connection.query('select * from driverGPSTable;', (error, results, fields) => {
    if(error) res.status(400).json({ message: error });
    var results2 = results.map(({ driverID, latGPS, longGPS }) => ({
        id: driverID,
        lat: latGPS,
        long: longGPS,
      })
    );
    res.status(200).json(results2);
  });

});

app.post('/link', (req, res) => {

  const { truckID, driverID } = req.body;

  connection.query(`select * from driverGPSTable where driverID='${driverID}';`, function (error, results, fields) {
    if(error) res.status(400).json({ message: error });
    if(results.length === 0) res.status(400).json({ message: 'no such driverID' });
    // INSERT INTO table (id, name, age) VALUES(1, "A", 19) ON DUPLICATE KEY UPDATE
    // name="A", age=19
    connection.query(`insert into linkTable (truckID, driverID) values ('${truckID}', '${driverID}') on duplicate key update truckID='${truckID}', driverID='${driverID}';`, function (error, results, fields) {
      if(error) res.status(400).json({ message: error });
      res.status(200).json({ message: 'updated' });
    });
  });

});

app.post('/truckApi', (req, res) => {

  const { DeviceSerial, Vin, MessageType, ReportType, TripState, ReceivedTimestamp, Latitude, Longitude, CollectionTimestamp } = req.body;

  if (Latitude && Longitude && DeviceSerial) {
    // `insert into linkTable (truckID, driverID) values ('${truckID}', '${driverID}') on duplicate key update truckID='${truckID}', driverID='${driverID}';`
    connection.query(`update truckGPSTable set latGPS=${Latitude}, longGPS=${Longitude} where truckID='${DeviceSerial}';`, function (error, results, fields) {
      if(error) res.status(400).json({ message: error });
    });
  }

  if(
    (MessageType === 'GPS' && (ReportType === 'StartedMove' || ReportType === 'Heading')) ||
    (MessageType === 'Acceleration')
  ) {

    connection.query(`select * from linkTable where truckID='${DeviceSerial}';`, function (error, results, fields) {
      if(error) res.status(400).json({ message: error });

      if(results.length === 0) {
        // TODO redalert
        console.log('redalert outer');
        res.status(200).json({ message: "redalert outer" });

      } else {
        const { driverID } = results[0];
        connection.query(`select * from driverGPSTable where driverID='${driverID}';`, function (error, results, fields) {
          if(error) res.status(400).json({ message: error });

          const { latGPS, longGPS } = results[0];

          if ( (latGPS - Latitude)*(latGPS - Latitude) + (longGPS - Longitude)*(longGPS - Longitude) > 1000 ) {
            // TODO redalert
            console.log('redalert inner');
            res.status(200).json({ message: "redalert inner" });

          } else {
            res.status(200).json({ message: "no change inner" });
          }

        })
      }

    });

  } else {
    res.status(200).json({ message: "no change outer" });
  }

});

app.post('/driverApi', (req, res) => {
  const { driverID, lat, lon } = req.body;

  if (driverID && lat && lon) {

    connection.query(`update driverGPSTable set latGPS=${lat}, longGPS=${lon} where driverID='${driverID}';`, (error, result, fields) => {
      if(error) res.status(400).json({ message: error });
      res.status(200).json({ message: "inserted" });
    })

  } else {
    res.status(400).json({ message: "missing params" });
  }

});

if (module === require.main) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
  });
}

module.exports = app;
