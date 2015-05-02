var http = require("http"),
    has = require("has"),
    isObject = require("is_object"),
    escapeTextContent = require("escape_text_content"),
    HttpError = require("http_error"),
    safeDefineProperty = require("./safe_define_property");


var Response = module.exports = http.ServerResponse,
    STATUS_CODES = http.STATUS_CODES,

    JSONP_RESTRICT_CHARSET = /[^\[\]\w$.]/g,
    LINE_U2028 = /\u2028/g,
    PARAGRAPH_U2028 = /\u2028/g;


Response.prototype.init = function(req, config) {
    var referer = this.getHeader("Referer") || this.getHeader("Referrer");

    if (referer) {
        this.setHeader("Referer", referer);
        this.setHeader("Referrer", referer);
    }

    this.req = this.request = req;
    this.config = config || {};

    this.locals = this.locals || {};

    return this;
};

Response.prototype.JSONstringify = function(body) {
    var config = this.config;
    return JSON.stringify(body, config["json replacer"], config["json spaces"]);
};

Response.prototype.send = function(code, body, headers) {
    var isHead = this.request.method === "HEAD",
        contentType = (headers && (headers["content-type"] || headers["Content-Type"])) || this.contentType;

    if (code instanceof Error) {
        if (code instanceof HttpError) {
            body = code.message;
            code = code.statusCode;
        } else {
            body = code.message;
            code = 500;
        }
    }
    if (typeof(code) !== "number") {
        headers = body;
        body = code;
        code = this.statusCode;
    }
    this.statusCode = code;

    if (body) {
        if (Buffer.isBuffer(body)) {
            if (!contentType) {
                contentType = "application/octet-stream";
            }
            this.setHeader("Content-Length", body.length);
        } else {
            if (typeof(body) === "object") {
                body = this.JSONstringify(body);
                if (!contentType) {
                    contentType = "application/json";
                }
            } else {
                body = body.toString(this.charset);
                if (!contentType) {
                    contentType = "text/html";
                }
            }
            this.setHeader("Content-Length", Buffer.byteLength(body, this.charset));
        }
    }

    if (!this.request.accepts(contentType).length) {
        contentType = "text/html";
        code = 406;
        body = "Not Acceptable";
    }
    this.contentType = contentType;
    if (headers) {
        this.setHeaders(headers);
    }

    this.emit("send", code, body, headers);

    this.writeHead(this.statusCode);
    if (body && !(isHead || code === 204 || code === 304)) {
        this.write(body, this.charset);
    }

    return this.end();
};

Response.prototype.json = function(code, obj) {
    var body;

    if (typeof(code) !== "number") {
        obj = code;
        code = this.statusCode;
    }

    body = this.JSONstringify(obj);
    this.contentType = "application/json";

    return this.send(code, body);
};

Response.prototype.jsonp = function(code, obj) {
    var body, callback, callbackName;

    if (typeof(code) !== "number") {
        callbackName = obj;
        obj = code;
        code = this.statusCode;
    }

    body = this.JSONstringify(obj);
    callback = this.req.param((this.config["jsonp callback name"] || "callback"));

    this.setHeader("x-content-type-options", "nosniff");
    this.contentType = "application/json";
    this.charset = "utf-8";

    if (typeof(callback) === "string" && callback.length !== 0) {
        callback = callback.replace(JSONP_RESTRICT_CHARSET, "");

        body = body.replace(LINE_U2028, "\\u2028").replace(PARAGRAPH_U2028, "\\u2029");
        body = "/**/ typeof " + callback + " === \"function\" && " + callback + "(" + body + ");";
    }

    return this.send(code, body);
};

Response.prototype.location = function(url) {

    if (url === "back") {
        url = this.request.getHeader("referrer") || "/";
    }
    this.setHeader("Location", url);

    return this;
};

Response.prototype.redirect = function redirect(status, url) {
    var contentType = this.contentType,
        body, u;

    if (typeof(status) === "string") {
        url = status;
        status = 302;
    }

    this.location(url);
    url = this.getHeader("Location");

    if (contentType === "text/plain") {
        body = STATUS_CODES[status] + ". Redirecting to " + encodeURI(url);
    } else if (contentType === "text/html") {
        u = escapeTextContent(url);
        body = "<p>" + STATUS_CODES[status] + ". Redirecting to <a href=\"" + u + "\">" + u + "</a></p>";
    } else {
        body = "";
    }

    this.statusCode = status;
    this.contentLength = Buffer.byteLength(body);

    if (this.request.method === "HEAD") {
        this.end();
    } else {
        this.end(body);
    }

    this.writeHead(status);

    return this;
};

Response.prototype.setCookie = function(cookie) {
    if (typeof(cookie) !== "string") {
        cookie = cookie.toString();
    }

    return this.setHeader("Set-Cookie", cookie);
};

Response.prototype.modified = function(dateString) {
    var header = this.request.headers["if-modified-since"];

    if (header) {
        try {
            if (Date.parse(header) < Date.parse(dateString)) {
                return true;
            } else {
                return false;
            }
        } catch (e) {}
    }

    return true;
};

safeDefineProperty(Response.prototype, "charset", {
    get: function() {
        var type, charset, index, tmp;

        if (this._charset != null) {
            return this._charset;
        } else {
            type = this.getHeader("Content-Type");
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
            this.setHeader("Content-Type", (this._contentType || this.contentType) + "; charset=" + value);
        }

        this._charset = value;
    }
});

safeDefineProperty(Response.prototype, "contentType", {
    get: function() {
        var type, charset, index;

        if (this._contentType != null) {
            return this._contentType;
        } else {
            type = this.getHeader("Content-Type");

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

        this.setHeader("Content-Type", contentType + "; charset=" + this._charset);
        this._contentType = contentType;
    }
});

safeDefineProperty(Response.prototype, "contentLength", {
    get: function() {
        var length;

        if (this._contentLength != null) {
            return this._contentLength;
        } else {
            length = +(this.getHeader("Content-Length"));

            if (length) {
                this._contentLength = length;
            } else {
                this._contentLength = 0;
            }

            return this._contentLength;
        }
    },
    set: function(value) {
        value = +value || 0;
        this.setHeader("Content-Length", value);
        this._contentLength = value;
    }
});

safeDefineProperty(Response.prototype, "sent", {
    get: function() {
        return !!this._header;
    }
});

Response.prototype.setHeaders = function(values) {
    var key;

    if (!isObject(values)) {
        for (key in values) {
            if (has(values, key)) {
                this.setHeader(key, values[key]);
            }
        }
    }
    return this;
};

if (!has(Response.prototype, "nativeWrite")) {

    Response.prototype.nativeWrite = Response.prototype.write;

    Response.prototype.write = function(chunk, encoding) {

        this.emit("write", chunk, encoding);

        return this.nativeWrite(chunk, encoding);
    };
}

if (!has(Response.prototype, "nativeWriteHead")) {

    Response.prototype.nativeWriteHead = Response.prototype.writeHead;

    Response.prototype.writeHead = function(statusCode, reasonPhrase, headers) {
        statusCode = statusCode || this.statusCode;

        this.emit("header", statusCode, reasonPhrase, headers);

        if (statusCode === 204 || statusCode === 304) {
            this.removeHeader("Content-Length");
            this.removeHeader("Content-MD5");
            this.removeHeader("Content-Type");
            this.removeHeader("Content-Encoding");
        }

        return this.nativeWriteHead(statusCode, reasonPhrase, headers);
    };
}

if (!has(Response.prototype, "nativeEnd")) {

    Response.prototype.nativeEnd = Response.prototype.end;

    Response.prototype.end = function(data, encoding) {
        this.emit("end", data, encoding);
        return this.nativeEnd(data, encoding);
    };
}
