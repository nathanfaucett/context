var trim = require("trim"),
    parseCookie = require("./parseCookie");


module.exports = parseCookies;


function parseCookies(cookie) {
    var cookies = {},
        header = (cookie || "").split(";"),
        i = header.length,
        unparsed, value;

    while (i--) {
        unparsed = header[i];

        if (unparsed) {
            unparsed = trim(unparsed);
            value = parseCookie(unparsed);

            if (value) {
                cookies[name] = value;
            }
        }
    }

    return cookies;
}
