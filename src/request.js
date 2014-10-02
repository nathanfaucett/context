var Request = module.exports = require("http").IncomingMessage;


if (!Object.prototype.hasOwnProperty.call(Request.prototype, "__context__")) {
    (function() {
        var url = require("url"),

        qs = require("qs"),
        type = require("type"),
        mime = require("mime"),
        Cookie = require("./cookie");
        
        var SPLITER = /[, ]+/,
            COLON_END = /;|$/;
        
        
        Object.defineProperty(Request.prototype, "__context__", {
            configurable: false,
            enumerable: false,
            writable: false,
            value: true
        });
        
        Request.prototype.init = function(res, config) {
            var headers = this.headers,
                fullUrl = url.parse((this.protocol || (this.secure ? "https" : "http")) + "://" + headers.host + this.url, false, false),
                locals = res.locals || (res.locals = {});
        
            fullUrl.query = qs.parse(fullUrl.query);
        
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
        
            if (params && params[name] != null) return params[name];
            if (body && body[name] != null) return body[name];
            if (query && query[name] != null) return query[name];
        
            return defaultValue;
        };
        
        Request.prototype.getHeader = Request.prototype.header = function(name) {
            return this.headers[name.toLowerCase()];
        };
        
        Request.prototype.setHeader = function(name, value) {
            return (this.headers[name.toLowerCase()] = value);
        };
        
        Request.prototype.setHeaders = function(values) {
            var headers, key;
        
            if (!type.isObject(headers)) return this;
            headers = this.headers;
        
            for (key in values) headers[key.toLowerCase()] = values[key];
            return this;
        };
        
        Request.prototype.deleteHeader = function(name) {
            delete this.headers[name.toLowerCase()];
            return this;
        };
        
        Request.prototype.removeHeader = Request.prototype.deleteHeader;
        
        Object.defineProperty(Request.prototype, "charset", {
            get: function() {
                var type, charset, index, tmp;
        
                if (this._charset !== null) return this._charset;
                type = this.headers["content-type"];
                charset = "utf-8";
        
                if (type && (index = type.indexOf(";")) !== -1) {
                    if ((tmp = type.substring(index).split("=")[1])) this._charset = tmp;
                }
        
                return (this._charset = charset);
            },
            set: function(value) {
                value || (value = "utf-8");
        
                if (value !== this._charset) {
                    this.headers["content-type"] = (this._contentType || this.contentType) + "; charset=" + value;
                }
                this._charset = value;
            }
        });
        
        Object.defineProperty(Request.prototype, "contentType", {
            get: function() {
                var type, charset, index;
        
                if (this._contentType !== null) return this._contentType;
                type = this.headers["content-type"];
        
                if (!type) {
                    this._contentType = "application/octet-stream";
                } else {
                    if ((index = type.indexOf(";")) === -1) {
                        this._contentType = type;
                    } else {
                        this._contentType = type.substring(0, index);
                        if ((charset = type.substring(index).split("=")[1])) this._charset = charset;
                    }
                }
        
                return this._contentType;
            },
            set: function(value) {
                var charset = this._charset || (this._charset = "utf-8"),
                    contentType, index;
        
                if ((index = value.indexOf(";")) === -1) {
                    contentType = value;
                } else {
                    contentType = value.substring(0, index);
                    if ((charset = value.substring(index).split("=")[1])) this._charset = charset;
                }
        
                this.headers["content-type"] = contentType + "; charset=" + this._charset;
                this._contentType = contentType;
            }
        });
        
        Object.defineProperty(Request.prototype, "contentLength", {
            get: function() {
                var length;
        
                if (this._contentLength !== null) return this._contentLength;
                length = +(this.headers["content-length"]);
        
                if (length) {
                    this._contentLength = length;
                } else {
                    this._contentLength = 0;
                }
        
                return this._contentLength;
            },
            set: function(value) {
                this._contentLength = this.headers["content-length"] = +value || 0;
            }
        });
        
        Object.defineProperty(Request.prototype, "version", {
            get: function() {
                return headers["accept-version"] || headers["x-api-version"] || "*";
            }
        });
        
        Object.defineProperty(Request.prototype, "protocol", {
            get: function() {
                return this.connection.encrypted ? "https" : "http";
            }
        });
        
        Object.defineProperty(Request.prototype, "xhr", {
            get: function() {
                var xhr = this.headers["x-requested-with"];
                return xhr ? xhr.toLowerCase() === "xmlhttprequest" : false;
            }
        });
        
        Object.defineProperty(Request.prototype, "secure", {
            get: function() {
                return this.protocol === "https";
            }
        });
        
        Request.prototype.cookie = function(name) {
            var header = (this.headers.cookie || ""),
                cookies = this._cookies || (this._cookies = {}),
                start, eq, cookie, unparsed, index, value;
        
            if (cookies[name]) return cookies[name];
        
            start = header.indexOf(name);
            eq = header.indexOf("=");
            cookie = null;
        
            if (start !== -1 && eq !== -1) {
                index = header.substr(start).search(COLON_END);
                if (index === -1) return cookie;
        
                unparsed = header.substr(start, index);
                unparsed = unparsed.trim();
        
                if ((index = unparsed.indexOf("=")) !== -1) {
                    name = unparsed.substring(0, index);
                    value = unparsed.substring(index + 1);
                } else {
                    return cookie;
                }
        
                cookie = cookies[name] = new Cookie(name, value, unparsed);
            }
        
            return cookie;
        };
        
        Request.prototype.cookies = function() {
            var header = (this.headers.cookie || "").split(";"),
                cookies = this._cookies || (this._cookies = {}),
                i = header.length,
                unparsed, index, name, value;
        
            while (i--) {
                unparsed = header[i];
                if (!unparsed) continue;
                unparsed = unparsed.trim();
        
                if ((index = unparsed.indexOf("=")) !== -1) {
                    name = unparsed.substring(0, index);
                    value = unparsed.substring(index + 1);
                } else {
                    continue;
                }
        
                cookies[name] = new Cookie(name, value, unparsed);
            }
        
            return cookies;
        };
        
        Request.prototype.accepts = function(types) {
            var accept = this.accept,
                accepts = [],
                typeObj, i, il;
        
            types = type.isArray(types) ? types : (type.isString(types) ? types.split(SPLITER) : []);
        
            for (i = 0, il = types.length; i < il; i++) {
                typeObj = parseAccepts(types[i]);
                if (acceptType(accept, typeObj)) accepts.push(typeObj.type);
            }
        
            return accepts;
        };
        
        Request.prototype.acceptsEncoding = function(types) {
            var acceptEncoding = this.acceptEncoding,
                accepts = [],
                typeObj, i, il;
        
            types = Array.isArray(types) ? types : types.split(SPLITER);
        
            for (i = 0, il = types.length; i < il; i++) {
                typeObj = parseAccepts(types[i]);
                if (acceptType(acceptEncoding, typeObj)) accepts.push(typeObj.type);
            }
        
            return accepts;
        };
        
        Request.prototype.acceptsLanguage = function(types) {
            var acceptLanguage = this.acceptLanguage,
                accepts = [],
                typeObj, i, il;
        
            types = type.isArray(types) ? types : types.split(SPLITER);
        
            for (i = 0, il = types.length; i < il; i++) {
                typeObj = parseAccepts(types[i]);
                if (acceptType(acceptLanguage, typeObj)) accepts.push(typeObj.type);
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
                if (typeObj.type === "*/*" || mime.lookUpExt(typeObj.type, false)) accepts.push(typeObj);
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
                if (value.type === "*/*" || (typeObj.type === value.type && typeObj.q >= value.q)) return true;
            }
        
            return false;
        }
    }());
};
