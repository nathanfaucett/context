ri
=======

request and response interface


```javascript
var ri = require("ri"),
    config = {
        "json spaces": 4
    };

server.on("request", function(req, res) {
    ri.init(req, res, config);
});
```
