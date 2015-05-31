var trim = require("trim"),
    Cookie = require("cookie");


module.exports = parseCookies;


function parseCookies(cookie) {
    var cookies = {},
        header = (cookie || "").split(";"),
        i = header.length,
        unparsed, index, name, value;

    while (i--) {
        unparsed = header[i];

        if (unparsed) {
            unparsed = trim(unparsed);

            if ((index = unparsed.indexOf("=")) !== -1) {
                try {
                    name = decodeURIComponent(unparsed.substring(0, index));
                    value = decodeURIComponent(unparsed.substring(index + 1));
                } catch (e) {
                    continue;
                }
            } else {
                continue;
            }

            cookies[name] = new Cookie(name, value, unparsed);
        }
    }

    return cookies;
}
