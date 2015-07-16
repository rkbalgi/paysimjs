/**
The main file that will start the ISO8583 server. The ISO8583 server will use a message handler function defined in (iso8583_message_handler.js)

@author - Raghavendra Balgi (rkbalgi at gmail dot com)
@date - 07/15/2015
*/

var Bitmap = require('./iso8583_bitmap.js');
var Hex = require('./hex_utils.js');
var IsoField = require('./iso8583_field.js');
var IsoMessage = require('./iso8583_message.js');
var net = require('net');
var util = require('util');
var messageHandler = require('./iso8583_message_handler.js');


//if you need to change the spec and the handler, change it here .. 
//i.e point it to a different json and a different function from the
//messageHandler module
var specDef = require('./iso_test_spec.json');
var handlerFunc = messageHandler.handleTestSpecMessage;

//some basic tests
var test1 = function () {
    str = "f1f1f0f0723c240128428000f1f5f3f7f5f7f2f2f6f5f8f7f0f9f2f3f9f0f0f4f0f0f0f0f0f0f0f0f0f0f0f0f8f0f2f0f4f2f1f1f0f2f4f5f1f1f1f0f6f0f2f0f5f1f0f1f8f1f9f4f3f1f2f0f5f0f3f0f9f0f1f8f4f0f2f6f1f1f0f1f1f0f1f1f4f0f0f1f0f3f7f3f7f5f7f2f2f6f5f8f7f0f9f2f3f9c4f0f8f0f8f1f0f1f0f4f0f1f3f6f6f7f2f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f1f5f4f3f4f5f0f1f3f6f74040404040f2f4f9";


    var f2 = new IsoField('pan', 'variable', 2, 'ebcdic', 'ebcdic');
    offset = f2.read(Hex.fromString(str), 12);
    console.log('new offset = ' + offset);

}



var test2 = function () {

    var msgData = Hex.fromString('F1F1F0F060200000000002013135313131313131313131313131313131002000F1F2F3F4F5F60005A2000000110102030404050607');
    isoMsg = new IsoMessage(specDef);
    isoMsg.parse(msgData);

}

//the 'main' of the server program

server = net.createServer();
server.on('connection', function (sock) {

    util.log('client connected :' + sock.remoteAddress);
    sock.on('data', function (data) {

        //MLI is 2I, so just read the first two bytes and compute
        //the data length
        var lenBuf = data.slice(0, 2);
        var dataLen = lenBuf.readUInt16BE(0);
        if (data.length >= (dataLen - 2)) {

            var msgData = data.slice(2, dataLen);
            util.log('received request: ' + msgData.toString('hex'));
            var isoMsg = new IsoMessage(specDef);
            isoMsg.parse(msgData);
            var respMsgData = handlerFunc(isoMsg);

            var responseBuf = new Buffer(2 + respMsgData.length);
            respMsgData.copy(responseBuf, 2, 0, respMsgData.length);
            responseBuf.writeUInt16BE(respMsgData.length + 2, 0);
            util.log('writing response : ' + responseBuf.toString('hex'));
            sock.write(responseBuf);

        }

    })

    sock.on('error', function () {

        util.log('client closed connection.');
        sock.end();
    });

    sock.on('end', function () {
        util.log('client closed connected :' + sock.remoteAddress);
    });

});

server.listen(6767);
console.log('ISO8583 server listening at: ' + 6767);
