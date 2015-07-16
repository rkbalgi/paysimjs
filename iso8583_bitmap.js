/**
This is a class to handle the functionaity of a bitmap field
@author - Raghavendra Balgi (rkbalgi at gmail dot com)
@date - 07/14/2015
*/
var Hex = require('./hex_utils.js');
//Bitmap class
function Bitmap() {

    this.init = function (data, offset) {
        this.buf = new Buffer(16);
        this.buf.fill(0);
        //console.log(data.readUInt8(0)+' ?? ' + (data.readUInt8(0) & 0x00F0));
        if ((data.readUInt8(offset) & 0x0080) == 0x0080) {
            data.copy(this.buf, 0, offset, offset + 16);
            this.secondaryBitmapPresent = true;
        } else {
            data.copy(this.buf, 0, offset, offset + 8);
            this.secondaryBitmapPresent = false;
        }
        //console.log('bitmap data = '+Hex.toString(this.buf));


        //if you need to initialize a array of booleans to indicate
        //what positions are on, use the below commented code 
        /*var n=1;
        for(var i=0;i<this.buf.length;i++){
        
            var b=0x80;
            var j=0;
            
            while(j<8){
                //console.log('>>> '+(b>>>j && this.buf[i]))
                
                //console.log(b);
                if((b & this.buf[i]) == b){
                    console.log('position '+n+' is on');
                }
                b=b>>>1;
                j++;
                n++;
            }
            //n+=8;
            j=0;
            
            
        }*/

    }

    this.isOn = function (pos) {

        //positions 1 through 8 on the first byte, 9 through 16 on second and
        //so on - loc is the byte we're dealing with
        var loc = Math.floor((pos - 1) / 8);
        var locVal = this.buf[loc];
        var posInByte = pos - (8 * loc);

        var noOfShifts = posInByte - 1;
        var b = 0x80 >>> noOfShifts;
        if ((b & locVal) == b) {
            return true;
        } else {
            return false;
        }

    }

    this.setOn = function (pos) {

        //positions 1 through 8 on the first byte, 9 through 16 on second and
        //so on - loc is the byte we're dealing with
        var loc = Math.floor((pos - 1) / 8);
        var locVal = this.buf[loc];
        var posInByte = pos - (8 * loc);

        var noOfShifts = posInByte - 1;
        var b = 0x80 >>> noOfShifts;
        locVal = locVal | b;
        this.buf[loc] = locVal;

    }
    this.setOff = function (pos) {

        //positions 1 through 8 on the first byte, 9 through 16 on second and
        //so on - loc is the byte we're dealing with
        var loc = Math.floor((pos - 1) / 8);
        var locVal = this.buf[loc];
        var posInByte = pos - (8 * loc);

        var noOfShifts = posInByte - 1;
        var b = 0x80 >>> noOfShifts;
        locVal = locVal & (~b);
        this.buf[loc] = locVal;

    }
}

test = function () {

        var bmp = new Bitmap();
        bmp.init(Hex.fromString('0000000000000000'), 0);

        bmp.setOn(2);
        bmp.setOn(3);
        bmp.setOn(11);
        bmp.setOn(55);
        bmp.setOn(64);

        console.log(bmp.buf);



    }
    //test();
module.exports = Bitmap;
