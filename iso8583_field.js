/**
This is a class to handle the parsing and assembling of fixed, variable and bitmapped fields
@author - Raghavendra Balgi (rkbalgi at gmail dot com)
@date - 07/15/2015
*/

var util = require('util');
var Hex = require('./hex_utils');
var Ebcdic = require('./ebcdic.js');
var Bitmap = require('./iso8583_bitmap.js');


function IsoField(name, type, fieldLength, dataEncoding, lengthEncoding) {

    this.name = name;
    this.type = type;
    this.fieldLength = fieldLength;
    this.dataEncoding = dataEncoding;
    this.lengthEncoding = lengthEncoding;
    this.children = [];

    /**
    This method reads 'fieldLength' number of bytes from
    'buf' starting at 'offset'
    */
    this.read = function (buf, offset) {

        //util.log('buf =' + buf.toString('hex') + ", offset = " + offset);
        //util.log(util.format('parsing field - [%s]', this.name));

        if (this.type == 'fixed') {
            this.fieldData = new Buffer(this.fieldLength);
            buf.copy(this.fieldData, 0, offset, offset + this.fieldLength);
            //console.log(this.fieldData);
            util.log(util.format(
                'parsed fixed field [%s] = data length: %d, value: %s ', this.name, this.fieldLength, this.toString()));
            return (this.fieldLength);
        } else if (this.type == 'variable') {
            //the fieldLength indicates the number of bytes in the length indicator
            var lenBuf = new Buffer(this.fieldLength);
            buf.copy(lenBuf, 0, offset, offset + this.fieldLength);

            //now based on encoding, convert lenBuf into a number
            var dataLen = 0;
            switch (this.lengthEncoding) {
                case 'bcd':
                    dataLen = Number(lenBuf.toString('hex'));
                    break;
                case 'ascii':
                    {
                        dataLen = Number(lenBuf.toString('ascii'));
                        break;
                    }
                case 'ebcdic':
                    {
                        dataLen = Number(Ebcdic.toAsciiString(lenBuf));
                        break;
                    }
                case 'binary':
                    {
                        //TODO::we can for now only support bytes, shorts, ints
                        //we don't expect length indicators larger than these for ISO8583 and its variations
                        if (this.fieldLength == 1) {
                            dataLen = lenBuf.readUInt8(0);
                        } else if (this.fieldLength == 2) {
                            dataLen = lenBuf.readUInt16BE(0);
                        } else if (this.fieldLength == 4) {
                            dataLen = lenBuf.readUInt32BE(0);
                        } else {
                            throw 'unsupported length field for binary -' + this.fieldLength;
                        }

                    }
            } //end switch

            this.fieldData = new Buffer(dataLen);
            buf.copy(this.fieldData, 0, offset + this.fieldLength, offset + this.fieldLength + dataLen);
            util.log(util.format(
                'parsed variable field [%s] = data length: %d, value: %s ', this.name, dataLen, this.toString()));

            return (this.fieldLength + dataLen);

        } else if (this.type = 'bitmap') {

            //for bitmap fields we will keep the data encapsulated inside
            //a Bitmap object with some additional methods on them
            this.bmp = new Bitmap();
            this.bmp.init(buf, offset);
            //this.getBitmap = function () {
            //    return (this.bmp);
            //}
            this.setOn = function (position) {
                this.bmp.setOn(position);
            }
            this.setOff = function (position) {
                this.bmp.setOff(position);
            }
            this.setOnWithValue = function (position, value) {
                this.bmp.setOn(position);
                this.children[position].setString(value);
            }
            this.get = function (position) {
                //this.bmp.setOn(position);
                return (this.children[position]);
            }


            util.log(util.format(
                'parsed bitmap field [%s] = data length: %d, value: %s ', this.name, this.bmp.secondaryBitmapPresent ? 16 : 8, this.bmp.buf.toString('hex')));
            if (this.bmp.secondaryBitmapPresent) {
                return (16);
            } else {
                return (8);
            }

        } else {
            throw 'unknown field type -' + this.type;
        }

    }

    /**
    This method writes the field data into 'buf' at 'offset'
    and returns the numbers of bytes written into 'buf'
    */
    this.write = function (buf, offset) {



        if (this.type == 'fixed') {
            //it's possible that the data is short and may need to be padded,
            //so, lets create a buf of size 'fieldLength' and go from there.
            //in future, different padding types may be supported
            var tmpBuf = new Buffer(this.fieldLength);
            //util.log('writing field ' + this.name + ' value = ' + Hex.toString(this.fieldData) + ' field length = ' + this.fieldLength + ' offset =' + offset);
            this.fieldData.copy(buf, offset, 0, this.fieldLength);

            //util.log(util.format('buffer after writing %s field = %s', this.name, buf.toString('hex')));
            return this.fieldLength;
        } else if (this.type == 'variable') {
            var lenBuf = null;
            //lenBuf.fill(0);
            var dataLen = this.fieldData.length;

            switch (this.lengthEncoding) {
                case 'ebcdic':
                case 'ascii':
                    {
                        var dataLenStr = dataLen.toString();
                        while (dataLenStr.length < this.fieldLength) {
                            dataLenStr = "0" + dataLenStr;
                        }

                        if (this.lengthEncoding == 'ascii') {
                            lenBuf = new Buffer(dataLenStr, 'ascii');
                        } else {
                            lenBuf = Ebcdic.fromAsciiString(dataLenStr);
                        }
                        break;

                    }
                case 'bcd':
                    {
                        var digitsRequired = this.fieldLength * 2;
                        var dataLenStr = dataLen.toString();
                        while (dataLenStr.length < digitsRequired) {
                            dataLenStr = "0" + dataLenStr;
                        }
                        lenBuf = new Buffer(dataLenStr, 'hex');
                        break;

                    }
                case 'binary':
                    {
                        lenBuf = new Buffer(this.fieldLength);
                        if (this.fieldLength == 1) {
                            lenBuf.writeUInt8BE(0, dataLen);
                        } else if (this.fieldLength == 2) {
                            lenBuf.writeUInt16BE(0, dataLen);
                        } else if (this.fieldLength == 4) {
                            lenBuf.writeUInt32BE(0, dataLen);
                        }
                        break;
                    }

            }
            //copy the length and data part into the responseBuf
            lenBuf.copy(buf, offset, 0, this.fieldLength);
            this.fieldData.copy(buf, offset + this.fieldLength, 0, dataLen);
            //util.log(util.format('buffer after writing %s field = %s', this.name, buf.toString('hex')));
            return (lenBuf.length + dataLen);


        } else if (this.type = 'bitmap') {

            var secondaryBmp = true;
            if (this.bmp.buf.readUInt32BE(8) == 0 && this.bmp.buf.readUInt32BE(12) == 0) {
                //i.e. secondary bitmap is empty
                secondaryBmp = false;
            }

            if (secondaryBmp) {
                this.bmp.buf.copy(buf, offset, 0, 16);
            } else {
                this.bmp.buf.copy(buf, offset, 0, 8);
            }
            //util.log(util.format('buffer after writing %s field = %s', this.name, buf.toString('hex')));

            if (secondaryBmp) {
                return (16);
            } else {
                return (8);
            }


        }

    }

    /**
    Sets the data for this field i.e copies from 'buf' into 'this.fieldData'
    */
    this.set = function (buf) {
        buf.copy(this.fieldData, 0, 0, buf.length);
    }

    /**
    Converts the 'str' to a Buffer as per 'fieldEncoding' and sets it as the 
    fieldData
    */
    this.setString = function (str) {
        switch (this.dataEncoding) {

            case 'ebcdic':
                {
                    this.fieldData = Ebcdic.fromAsciiString(str);
                    break;
                }

            case 'ascii':
                {
                    this.fieldData = new Buffer(str, 'ascii');
                    break;
                }
            case 'binary':
            case 'bcd':
                {
                    this.fieldData = new Buffer(str, 'hex');
                    break;
                }
        }

    }

    this.toString = function () {
        switch (this.dataEncoding) {

            case 'ebcdic':
                {
                    return Ebcdic.toAsciiString(this.fieldData);
                }
            case 'ascii':
                {
                    return (this.fieldData.toString('ascii'));
                }
            case 'binary':
            case 'bcd:':
                {
                    return (this.fieldData.toString('hex'));
                }
        }
    }
    this.str = function () {
        return (this.toString())
    }



}

test = function () {

    trace = Hex.fromString('313233340001020304');
    isoField = new IsoField('A', 'fixed', 4, 'binary', null);
    isoField.read(trace);
    console.log(isoField.toString());


};

module.exports = IsoField;
