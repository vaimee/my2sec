"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tlsServer = exports.server = void 0;
const http_1 = require("http");
const fs_1 = require("fs");
const url_1 = require("url");
const https_1 = require("https");
const fs_2 = require("fs");
const path_1 = require("path");
const app = (req, res) => {
    var _a;
    const url = new url_1.URL((_a = req.url) !== null && _a !== void 0 ? _a : "", "http://localhost");
    if (url.pathname === "/echo") {
        for (const [key, value] of Object.entries(req.headers)) {
            if (value)
                res.setHeader(key, value);
        }
        req.pipe(res);
        return;
    }
    if (/\/status\/\d+/.test(url.pathname)) {
        res.statusCode = Number(url.pathname.substr(8));
        res.end();
        return;
    }
    if (url.pathname === "/urandom") {
        fs_1.createReadStream("/dev/urandom").pipe(res);
        return;
    }
    if (url.pathname === "/download") {
        res.setHeader("Content-Length", 12);
        res.write("hello ");
        setTimeout(function () {
            res.write("world!");
            res.end();
        }, 200);
        return;
    }
    if (url.pathname === "/url") {
        res.end(req.url);
        return;
    }
    if (url.pathname === "/close") {
        res.destroy();
        return;
    }
    if (url.pathname === "/timeout") {
        return;
    }
    res.end("Success");
    return;
};
exports.server = http_1.createServer(app);
exports.tlsServer = https_1.createServer({
    key: fs_2.readFileSync(path_1.join(__dirname, "support/server-key.pem")),
    cert: fs_2.readFileSync(path_1.join(__dirname, "support/server-crt.pem")),
    ca: fs_2.readFileSync(path_1.join(__dirname, "support/ca-crt.pem")),
}, app);
//# sourceMappingURL=http.js.map