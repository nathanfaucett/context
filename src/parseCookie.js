var Cookie = require("cookie");


module.exports = parseCookie;


function parseCookie(unparsed) {
    var index, name, value;

    if (unparsed && (index = unparsed.indexOf("=")) !== -1) {
        try {
            name = decodeURIComponent(unparsed.substring(0, index));
            value = decodeURIComponent(unparsed.substring(index + 1));
            return new Cookie(name, value, unparsed);
        } catch (e) {
            return undefined;
        }
    } else {
        return undefined;
    }
}
