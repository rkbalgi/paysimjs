/**

Some basic tests to drive transactions in to the ISO8583 server

@author - Raghavendra Balgi
@date 07/16/2015
*/

var port = 6767;
var host = "localhost";

var net = require('net');
var Hex = require('./hex_utils.js');
var util = require('util');
var specDef = require('./iso_test_spec.json');
var IsoMessage = require('./iso8583_message.js');
var assert = require('assert');

testAmount330 = function () {

    var socket = net.createConnection(port, host, function () {

        var requestData = Hex.fromString('0043F1F1F0F070200000000002013135313131313131313131313131313131002000F0F0F0F0F0F0F0F0F0F3F3F0F1F2F3F4F5F60005A2000000110102030404050607');
        console.log('connected to server.');
        socket.on('data', function (data) {

            console.log('response received from the server: ' + Hex.toString(data));
            var mli = data.slice(0, 2).readUInt16BE();
            var dataLen = mli - 2;
            if (data.length >= mli) {
                var isoMsg = new IsoMessage(specDef);
                isoMsg.parse(data.slice(2, data.length));
                var f39 = isoMsg.get('Bitmap').get(39);
                if (f39.str() != '000') {
                    assert.fail('Action Code. Expected 000. Found: ' + f39.str());
                }

            } else {
                //do what? is it possible that the current chunk 
                //doesn't have the full message??
                throw 'do something!';
            }

            socket.end();


        });

        socket.write(requestData, function () {
            console.log('data was written to the server.');
        });


    })


}
testAmount330();
