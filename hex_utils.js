/**


@author - Raghavendra Balgi (rkbalgi at gmail dot com)
@date - 07/15/2015
*/


function Hex() {};
Hex.fromString = function (str) {
    var buf = new Buffer(str, 'hex');
    return (buf);
}

Hex.toString = function (buf) {
    return (buf.toString('hex'));
}
module.exports = Hex;
