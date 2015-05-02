var http = require("http"),
    urls = require("urls"),
    has = require("has"),
    isObject = require("is_object"),
    isArray = require("is_array"),
    isString = require("is_string"),
    mime = require("mime"),
    Cookie = require("cookie"),
    safeDefineProperty = require("./safe_define_property");


var Request = module.exports = http.IncomingMessage,
    SPLITER = /[, ]+/;


Request.prototype.init = function(res, config) {
    var headers = this.headers,
        fullUrl = urls.parse(
            (this.protocol || (this.secure ? "https" : "http")) + "://" + headers.host + this.url,
            true,
            false
        ),
        locals = res.locals || (res.locals = {});

    this.res = this.response = res;
    this.config = config || {};

    this.fullUrl = fullUrl;
    this.pathname = fullUrl.pathname;
    this.query = fullUrl.query;

    headers.referer = headers.referrer = (headers.referer || headers.referrer || "");
    this.locale = (headers["accept-language"] || "").split(SPLITER)[0].split("-")[0] || "en";

    locals.locale = this.locale;
    locals.referer = this.referer;

    this.accept = parseAcceptTypes(headers);
    this.acceptLanguage = parseAcceptLanguages(headers);
    this.acceptEncoding = parseAcceptEncodings(headers);

    return this;
};

Request.prototype.param = function(name, defaultValue) {
    var params = this.params,
        body = this.body,
        query = this.query;

    if (params && params[name] != null) {
        return params[name];
    } else if (body && body[name] != null) {
        return body[name];
    } else if (query && query[name] != null) {
        return query[name];
    } else {
        return defaultValue;
    }
};

Request.prototype.getHeader = Request.prototype.header = function(name) {
    return this.headers[name.toLowerCase()];
};

Request.prototype.setHeader = function(name, value) {
    return (this.headers[name.toLowerCase()] = value);
};

Request.prototype.setHeaders = function(values) {
    var headers, key;

    if (isObject(values)) {
        headers = this.headers;

        for (key in values) {
            if (has(values, key)) {
                headers[key.toLowerCase()] = values[key];
            }
        }
    }
    return this;
};

Request.prototype.deleteHeader = function(name) {
    delete this.headers[name.toLowerCase()];
    return this;
};

Request.prototype.removeHeader = Request.prototype.deleteHeader;

safeDefineProperty(Request.prototype, "charset", {
    get: function() {
        var type, charset, index, tmp;

        if (this._charset != null) {
            return this._charset;
        } else {
            type = this.headers["content-type"];
            charset = "utf-8";

            if (type && (index = type.indexOf(";")) !== -1) {
                if ((tmp = type.substring(index).split("=")[1])) {
                    this._charset = tmp;
                }
            }

            return (this._charset = charset);
        }
    },
    set: function(value) {
        value = value || "utf-8";

        if (value !== this._charset) {
            this.headers["content-type"] = (this._contentType || this.contentType) + "; charset=" + value;
        }
        this._charset = value;
    }
});

safeDefineProperty(Request.prototype, "contentType", {
    get: function() {
        var type, charset, index;

        if (this._contentType != null) {
            return this._contentType;
        } else {
            type = this.headers["content-type"];

            if (!type) {
                this._contentType = "application/octet-stream";
            } else {
                if ((index = type.indexOf(";")) === -1) {
                    this._contentType = type;
                } else {
                    this._contentType = type.substring(0, index);
                    if ((charset = type.substring(index).split("=")[1])) {
                        this._charset = charset;
                    }
                }

                if ((index = (type = this._contentType).indexOf(",")) !== -1) {
                    this._contentType = type.substring(0, index);
                }
            }

            return this._contentType;
        }
    },
    set: function(value) {
        var charset = this._charset || (this._charset = "utf-8"),
            contentType, index;

        if ((index = value.indexOf(";")) === -1) {
            contentType = value;
        } else {
            contentType = value.substring(0, index);
            if ((charset = value.substring(index).split("=")[1])) {
                this._charset = charset;
            }
        }

        this.headers["content-type"] = contentType + "; charset=" + this._charset;
        this._contentType = contentType;
    }
});

safeDefineProperty(Request.prototype, "contentLength", {
    get: function() {
        var length;

        if (this._contentLength != null) {
            return this._contentLength;
        } else {
            length = +(this.headers["content-length"]);

            if (length) {
                this._contentLength = length;
            } else {
                this._contentLength = 0;
            }

            return this._contentLength;
        }
    },
    set: function(value) {
        this._contentLength = this.headers["content-length"] = +value || 0;
    }
});

safeDefineProperty(Request.prototype, "version", {
    get: function() {
        var headers = this.headers;
        return headers["accept-version"] || headers["x-api-version"] || "*";
    }
});

safeDefineProperty(Request.prototype, "protocol", {
    get: function() {
        return this.connection.encrypted ? "https" : "http";
    }
});

safeDefineProperty(Request.prototype, "xhr", {
    get: function() {
        var xhr = this.headers["x-requested-with"];
        return xhr ? xhr.toLowerCase() === "xmlhttprequest" : false;
    }
});

safeDefineProperty(Request.prototype, "secure", {
    get: function() {
        return this.protocol === "https";
    }
});

Request.prototype.cookie = function(name) {
    return this.cookies()[name];
};

Request.prototype.cookies = function() {
    var header = (this.headers.cookie || "").split(";"),
        cookies = this._cookies || (this._cookies = {}),
        i = header.length,
        unparsed, index, name, value;

    if (cookies) {
        return cookies;
    } else {
        while (i--) {
            unparsed = header[i];

            if (unparsed) {
                unparsed = unparsed.trim();

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
};

Request.prototype.accepts = function(types) {
    var accept = this.accept,
        accepts = [],
        typeObj, i, il;

    types = isArray(types) ? types : (isString(types) ? types.split(SPLITER) : []);

    for (i = 0, il = types.length; i < il; i++) {
        typeObj = parseAccepts(types[i]);
        if (acceptType(accept, typeObj)) {
            accepts.push(typeObj.type);
        }
    }

    return accepts;
};

Request.prototype.acceptsEncoding = function(types) {
    var acceptEncoding = this.acceptEncoding,
        accepts = [],
        typeObj, i, il;

    types = isArray(types) ? types : types.split(SPLITER);

    for (i = 0, il = types.length; i < il; i++) {
        typeObj = parseAccepts(types[i]);
        if (acceptType(acceptEncoding, typeObj)) {
            accepts.push(typeObj.type);
        }
    }

    return accepts;
};

Request.prototype.acceptsLanguage = function(types) {
    var acceptLanguage = this.acceptLanguage,
        accepts = [],
        typeObj, i, il;

    types = isArray(types) ? types : types.split(SPLITER);

    for (i = 0, il = types.length; i < il; i++) {
        typeObj = parseAccepts(types[i]);
        if (acceptType(acceptLanguage, typeObj)) {
            accepts.push(typeObj.type);
        }
    }

    return accepts;
};

function parseAcceptTypes(headers) {
    var types = (headers.accept || "").split(SPLITER),
        accepts = [],
        i = types.length,
        typeObj;

    while (i--) {
        typeObj = parseAccepts(types[i]);
        if (typeObj.type === "*/*" || mime.lookUpExt(typeObj.type, false)) {
            accepts.push(typeObj);
        }
    }
    accepts.sort(sortByQValue);

    return accepts;
}

function parseAcceptEncodings(headers) {
    var types = (headers["accept-encoding"] || "").split(SPLITER),
        accept = [],
        i = types.length,
        typeObj;

    while (i--) {
        typeObj = parseAccepts(types[i]);
        accept.push(typeObj);
    }
    accept.sort(sortByQValue);

    return accept;
}

function parseAcceptLanguages(headers) {
    var types = (headers["accept-language"] || "").split(SPLITER),
        accept = [],
        i = types.length,
        typeObj;

    while (i--) {
        typeObj = parseAccepts(types[i]);
        accept.push(typeObj);
    }
    accept.sort(sortByQValue);

    return accept;
}

function sortByQValue(a, b) {
    return a.q - b.q;
}

function parseAccepts(str) {
    var parts = str.split(";"),
        value = parts[0],
        q = +((parts[1] || "q=1").split("=").pop()) || 0;

    return {
        type: value,
        q: q
    };
}

function acceptType(accepts, typeObj) {
    var i = accepts.length,
        value;

    while (i--) {
        value = accepts[i];
        if (value.type === "*/*" || (typeObj.type === value.type && typeObj.q >= value.q)) {
            return true;
        }
    }

    return false;
}
