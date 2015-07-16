/**
IsoMessage class holds all of the parsed data that belongs to a 'specDef'. The 'specDef' is itself
defined in a .json file (Example - iso_test_spec.json)

@author - Raghavendra Balgi (rkbalgi at gmail dot com)
@date - 07/15/2015
*/

var IsoField = require('./iso8583_field.js');
var util = require('util');

function IsoMessage(specDef) {

    this.bitmap = null; //bitmap of the message for quicker access
    this.fields = []; //array of IsoField objects

    //initialize data structures based on specDef
    for (var i in specDef.fields) {
        var fieldDef = specDef.fields[i];
        //console.log('fieldDef =' + fieldDef);
        var isoField = new IsoField(fieldDef.name, fieldDef.type, fieldDef.length,
            fieldDef.dataEncoding, fieldDef.lengthEncoding);
        this.fields.push(isoField);


        //TODO:for now we will only support children on bitmap fields
        if (isoField.type == 'bitmap') {
            this.bitmap = isoField;
            for (var j in fieldDef.children) {
                var childFieldDef = fieldDef.children[j];
                //console.log('childFieldDef - ' + childFieldDef);
                var isoField = new IsoField(childFieldDef.name, childFieldDef.type,
                    childFieldDef.length, childFieldDef.dataEncoding, childFieldDef.lengthEncoding);
                isoField.position = childFieldDef.position;
                //push this onto the children array of bitmap
                this.bitmap.children[isoField.position] = isoField;

            }

        }

    }



    this.parse = function (buf) {

        var offset = 0;
        for (var i in this.fields) {
            var isoField = this.fields[i];
            offset = this.parseField(buf, isoField, offset);
            //offset = offset + n;

        }
    }

    this.parseField = function (buf, isoField, offset) {
        //util.log('parsing ' + isoField.name + ' with offset ' + offset);
        var n = 0;
        n = isoField.read(buf, offset);
        offset = offset + n;
        //parse field and then parse children if any
        if (isoField.children.length > 0) {
            //util.log('parsing children of ' + isoField.name);
            for (var j in isoField.children) {
                var field = isoField.children[j];
                if (isoField.type == 'bitmap' && isoField.bmp.isOn(field.position)) {
                    offset = this.parseField(buf, field, offset);
                    //offset = offset + n;
                }
            }
        }

        return (offset);

    }

    /**
    This method returns a IsoField by its name., this is a potentially
    expensive operation and doesn't (yet!) look at child fields 
    */

    this.get = function (fieldName) {

        for (var i = 0; i < this.fields.length; i++) {
            if (this.fields[i].name === fieldName) {
                return this.fields[i];

            }
        }
        throw 'no such field present : ' + fieldName;

    }

    this.assemble = function () {

        var responseBuf = new Buffer(512);
        responseBuf.fill(0);
        var offset = 0;
        for (var i = 0; i < this.fields.length; i++) {

            var isoField = this.fields[i];

            offset = this.assembleField(isoField, responseBuf, offset);
            //offset = offset + n;


        }
        console.log(offset);
        return (responseBuf.slice(0, offset));

    }

    this.assembleField = function (isoField, buf, offset) {

        n = isoField.write(buf, offset);
        offset = offset + n;
        if (isoField.children.length > 0) {
            for (var i = 0; i < isoField.children.length; i++) {
                if (isoField.children[i] && this.bitmap.bmp.isOn(isoField.children[i].position)) {
                    offset = this.assembleField(isoField.children[i], buf, offset);
                }
            }
        }
        return (offset);


    }



}

module.exports = IsoMessage;
