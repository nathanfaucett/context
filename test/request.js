var assert = require("assert"),
    http = require("http"),
    request = require("request"),
    ri = require("../src/index");


function createServer(callback) {
    var server = new http.Server(function(req, res) {
        ri.init(req, res);

        if (callback) {
            callback(req, res);
        }
        res.end();
        server.close();
    });

    server.listen(8080);
}

function makeRequest(done) {
    request.get("http://localhost:8080/time?id=1", {
        headers: {
            "Content-Type": "application/json",
            "Content-Length": "0"
        },
        success: function() {
            done();
        },
        error: function(response) {
            done(response.data);
        }
    });
}

describe("#Request", function() {
    describe("#param(name : String)", function() {
        it("it should return param from request object", function(done) {
            createServer(function(req) {
                assert(req.param("id") === 1);
            });

            makeRequest(done);
        });
    });

    describe("#charset", function() {
        it("it should return charset from request object", function(done) {
            createServer(function(req) {
                assert(req.charset === "utf-8");
                assert(req.charset === "utf-8");
            });

            makeRequest(done);
        });
    });

    describe("#contentType", function() {
        it("it should return Content Type from request object", function(done) {
            createServer(function(req) {
                assert(req.contentType === "application/json");
                assert(req.contentType === "application/json");
            });

            makeRequest(done);
        });
    });

    describe("#contentLength", function() {
        it("it should return Content Length from request object", function(done) {
            createServer(function(req) {
                assert(req.contentLength === 0);
                assert(req.contentLength === 0);
            });

            makeRequest(done);
        });
    });
});
