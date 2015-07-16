/**
This module defines multiple functions that handle messages for various specDefs

@author - Raghavendra Balgi (rkbalgi at gmail dot com)
@date - 07/15/2015
*/

var Hex = require('./hex_utils.js');
handleTestSpecMessage = function (isoMsg) {

    isoMsg.get('Message Type').setString('1110');
    var bmp = isoMsg.get('Bitmap');
    bmp.setOff(55);
    //bmp.setOff(2);

    //This can possibly be very complex based on amount, pan numbers etc
    //the rules might also be read out from a database or a file

    var amount = bmp.get(4).str();
    if (amount > 200 && amount < 400) {
        bmp.setOnWithValue(39, '000');
    } else {

        bmp.setOnWithValue(39, '100');
    }
    var responseBuf = isoMsg.assemble();

    return (responseBuf);

}

exports.handleTestSpecMessage = handleTestSpecMessage;
