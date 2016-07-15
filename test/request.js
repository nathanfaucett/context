var tape = require("tape"),
    http = require("http"),
    request = require("@nathanfaucett/request"),
    ri = require("..");


function createServer(callback) {
    var server = new http.Server(function(req, res) {
        ri.init(req, res);

        if (callback) {
            callback(req, res);
        }
        res.end();
        server.close();
    });

    server.listen(9999);
}

function makeRequest(done) {
    request.get("http://localhost:9999/time?id=1", {
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

tape("Request #param(name : String) - it should return param from request object", function(assert) {
    createServer(function(req) {
        assert.equal(req.param("id"), 1);
    });

    makeRequest(assert.end);
});

tape("Request #charset - it should return charset from request object", function(assert) {
    createServer(function(req) {
        assert.equal(req.charset, "utf-8");
    });

    makeRequest(assert.end);
});

tape("Request #contentType - it should return Content Type from request object", function(assert) {
    createServer(function(req) {
        assert.equal(req.contentType, "application/json");
    });

    makeRequest(assert.end);
});

tape("Request #contentLength - it should return Content Length from request object", function(assert) {
    createServer(function(req) {
        assert.equal(req.contentLength, 0);
    });

    makeRequest(assert.end);
});
