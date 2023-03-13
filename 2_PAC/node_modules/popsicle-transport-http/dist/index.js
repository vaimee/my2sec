"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transport = exports.AbortError = exports.NegotiateHttpVersion = exports.ALPNError = exports.ConnectionError = exports.CausedByTimeoutError = exports.CausedByEarlyCloseError = exports.defaultHttp2Connect = exports.defaultTlsConnect = exports.defaultNetConnect = exports.Http2ConnectionManager = exports.SocketConnectionManager = exports.SocketSet = exports.Http2Response = exports.HttpResponse = void 0;
const url_1 = require("url");
const http_1 = require("http");
const https_1 = require("https");
const make_error_cause_1 = require("make-error-cause");
const net_1 = require("net");
const tls_1 = require("tls");
const http2_1 = require("http2");
const stream_1 = require("stream");
const dns_1 = require("dns");
const node_1 = require("servie/dist/node");
const common_1 = require("servie/dist/common");
/**
 * HTTP responses implement a node.js body.
 */
class HttpResponse extends node_1.Response {
    constructor(body, options) {
        super(body, options);
        this.url = options.url;
        this.connection = options.connection;
        this.httpVersion = options.httpVersion;
    }
}
exports.HttpResponse = HttpResponse;
class Http2Response extends HttpResponse {
}
exports.Http2Response = Http2Response;
/**
 * Set of connections for HTTP pooling.
 */
class SocketSet {
    constructor() {
        // Tracks number of sockets claimed before they're created.
        this.creating = 0;
        // Tracks free sockets.
        this.free = new Set();
        // Tracks all available sockets.
        this.sockets = new Set();
        // Tracks pending requests for a socket.
        this.pending = [];
    }
    // Get number of sockets available + creating.
    size() {
        return this.creating + this.sockets.size;
    }
    // Check if the pool is empty and can be cleaned up.
    isEmpty() {
        return this.size() === 0 && this.pending.length === 0;
    }
}
exports.SocketSet = SocketSet;
/**
 * Get the value of an iterator.
 */
function value(iterator) {
    return iterator.next().value;
}
/**
 * Manage socket reuse.
 */
class SocketConnectionManager {
    constructor(maxFreeConnections = 256, maxConnections = Infinity) {
        this.maxFreeConnections = maxFreeConnections;
        this.maxConnections = maxConnections;
        this.pools = new Map();
    }
    /**
     * Creates a connection when available.
     */
    async ready(key, onReady) {
        const pool = this.pool(key);
        // Add to "pending" queue when over max connections.
        if (pool.size() >= this.maxConnections) {
            return new Promise((resolve) => pool.pending.push(resolve)).then(onReady);
        }
        return onReady(this.free(key));
    }
    async creating(key, onCreate) {
        const pool = this.pool(key);
        try {
            pool.creating++;
            const socket = await onCreate();
            return socket;
        }
        finally {
            pool.creating--;
        }
    }
    pool(key) {
        const pool = this.pools.get(key);
        if (!pool) {
            const pool = new SocketSet();
            this.pools.set(key, pool);
            return pool;
        }
        return pool;
    }
    used(key, socket) {
        socket.ref();
        const pool = this.pool(key);
        pool.free.delete(socket);
        pool.sockets.add(socket);
    }
    freed(key, socket) {
        const pool = this.pools.get(key);
        if (!pool || !pool.sockets.has(socket))
            return false;
        // Immediately reuse for a pending connection.
        const onReady = pool.pending.shift();
        if (onReady) {
            onReady(socket);
            return false;
        }
        // Remove reference to freed sockets.
        socket.unref();
        // Save freed connections for reuse.
        if (pool.free.size < this.maxFreeConnections) {
            pool.free.add(socket);
            return false;
        }
        this._delete(pool, key, socket);
        return true;
    }
    _delete(pool, key, socket) {
        pool.free.delete(socket);
        pool.sockets.delete(socket);
        if (pool.isEmpty())
            this.pools.delete(key);
    }
    get(key) {
        const pool = this.pools.get(key);
        if (pool)
            return value(pool.sockets.values());
    }
    free(key) {
        const pool = this.pools.get(key);
        if (pool)
            return value(pool.free.values());
    }
    delete(key, socket) {
        const pool = this.pools.get(key);
        if (!pool || !pool.sockets.has(socket))
            return;
        // Remove the socket from the pool before calling a new `onReady`.
        this._delete(pool, key, socket);
        // Create a new pending socket when an old socket is removed.
        // If a socket was removed we MUST be below `maxConnections`.
        // We also MUST have already used our `free` connections up otherwise we
        // wouldn't have a pending callback.
        const onReady = pool.pending.shift();
        if (onReady)
            onReady(undefined);
    }
}
exports.SocketConnectionManager = SocketConnectionManager;
class Http2ConnectionManager {
    constructor() {
        this.sessions = new Map();
        this.refs = new WeakMap();
    }
    async ready(key, onReady) {
        return onReady(this.sessions.get(key));
    }
    async creating(key, create) {
        return create();
    }
    used(key, session) {
        const count = this.refs.get(session) || 0;
        if (count === 0)
            session.ref();
        this.refs.set(session, count + 1);
        this.sessions.set(key, session);
    }
    freed(key, session) {
        const count = this.refs.get(session);
        if (!count)
            return false;
        if (count === 1)
            session.unref();
        this.refs.set(session, count - 1);
        return false;
    }
    get(key) {
        return this.sessions.get(key);
    }
    free(key) {
        return this.sessions.get(key);
    }
    delete(key, session) {
        if (this.sessions.get(key) === session) {
            this.refs.delete(session);
            this.sessions.delete(key);
        }
    }
}
exports.Http2ConnectionManager = Http2ConnectionManager;
exports.defaultNetConnect = net_1.connect;
exports.defaultTlsConnect = tls_1.connect;
const defaultHttp2Connect = (authority, socket) => {
    return http2_1.connect(authority, { createConnection: () => socket });
};
exports.defaultHttp2Connect = defaultHttp2Connect;
function pipelineRequest(req, stream, onError) {
    let bytesTransferred = 0;
    const onData = (chunk) => {
        req.signal.emit("requestBytes", (bytesTransferred += chunk.length));
    };
    const requestStream = new stream_1.PassThrough();
    requestStream.on("data", onData);
    req.signal.emit("requestStarted");
    stream_1.pipeline(requestStream, stream, (err) => {
        requestStream.removeListener("data", onData);
        if (err)
            req.signal.emit("error", err);
        req.signal.emit("requestEnded");
    });
    const body = common_1.useRawBody(req);
    if (body instanceof ArrayBuffer) {
        return requestStream.end(new Uint8Array(body));
    }
    if (Buffer.isBuffer(body) || typeof body === "string" || body === null) {
        return requestStream.end(body);
    }
    stream_1.pipeline(body, requestStream, (err) => {
        if (err)
            return onError(err);
    });
}
function pipelineResponse(req, stream, onEnd) {
    let bytesTransferred = 0;
    const onData = (chunk) => {
        req.signal.emit("responseBytes", (bytesTransferred += chunk.length));
    };
    const responseStream = new stream_1.PassThrough();
    stream.on("data", onData);
    req.signal.emit("responseStarted");
    return stream_1.pipeline(stream, responseStream, (err) => {
        stream.removeListener("data", onData);
        onEnd();
        if (err)
            req.signal.emit("error", err);
        req.signal.emit("responseEnded");
    });
}
/**
 * Used as a cause for the connection error.
 */
class CausedByEarlyCloseError extends Error {
    constructor() {
        super("Connection closed too early");
    }
}
exports.CausedByEarlyCloseError = CausedByEarlyCloseError;
/**
 * Used as a cause for the connection error.
 */
class CausedByTimeoutError extends Error {
    constructor() {
        super("Connection timeout");
    }
}
exports.CausedByTimeoutError = CausedByTimeoutError;
/**
 * Expose connection errors.
 */
class ConnectionError extends make_error_cause_1.BaseError {
    constructor(request, message, cause) {
        super(message, cause);
        this.request = request;
        this.code = "EUNAVAILABLE";
    }
}
exports.ConnectionError = ConnectionError;
/**
 * Execute HTTP request.
 */
function execHttp1(req, url, socket, config) {
    return new Promise((resolve, reject) => {
        const encrypted = url.protocol === "https:";
        const request = encrypted ? https_1.request : http_1.request;
        const arg = {
            protocol: url.protocol,
            hostname: url.hostname,
            port: url.port,
            defaultPort: encrypted ? 443 : 80,
            method: req.method,
            path: url.pathname + url.search,
            headers: req.headers.asObject(),
            auth: url.username || url.password
                ? `${url.username}:${url.password}`
                : undefined,
            createConnection: () => socket,
        };
        const rawRequest = request(arg);
        rawRequest.on("timeout", () => {
            rawRequest.destroy();
            return reject(new ConnectionError(req, `Connection timed out to ${url.host}`, new CausedByTimeoutError()));
        });
        // Timeout when no activity, pick minimum as request is using the entire socket.
        rawRequest.setTimeout(config.idleSocketTimeout > 0
            ? Math.min(config.idleRequestTimeout, config.idleSocketTimeout)
            : config.idleRequestTimeout);
        // Reuse HTTP connections where possible.
        if (config.keepAlive > 0) {
            rawRequest.shouldKeepAlive = true;
            rawRequest.setHeader("Connection", "keep-alive");
        }
        // Trigger unavailable error when node.js errors before response.
        const onRequestError = (err) => {
            return reject(new ConnectionError(req, `Unable to connect to ${url.host}`, err));
        };
        // Track the node.js response.
        const onResponse = (rawResponse) => {
            var _a, _b;
            // Trailers are populated on "end".
            let resolveTrailers;
            const trailer = new Promise((resolve) => (resolveTrailers = resolve));
            rawRequest.removeListener("response", onResponse);
            rawRequest.removeListener("error", onRequestError);
            const { address: localAddress, port: localPort, } = ((_b = (_a = rawRequest.socket) === null || _a === void 0 ? void 0 : _a.address()) !== null && _b !== void 0 ? _b : {});
            const { address: remoteAddress, port: remotePort, } = rawResponse.socket.address();
            // Force `end` to be triggered so the response can still be piped.
            // Reference: https://github.com/nodejs/node/issues/27981
            const onAborted = () => {
                rawResponse.push(null);
            };
            rawResponse.on("aborted", onAborted);
            const res = new HttpResponse(pipelineResponse(req, rawResponse, () => {
                req.signal.off("abort", onAbort);
                rawResponse.removeListener("aborted", onAborted);
                resolveTrailers(rawResponse.trailers);
            }), {
                status: rawResponse.statusCode,
                statusText: rawResponse.statusMessage,
                url: req.url,
                headers: rawResponse.headers,
                omitDefaultHeaders: true,
                trailer,
                connection: {
                    localAddress,
                    localPort,
                    remoteAddress,
                    remotePort,
                    encrypted,
                },
                httpVersion: rawResponse.httpVersion,
            });
            return resolve(res);
        };
        const onAbort = () => {
            rawRequest.destroy();
        };
        // Clean up lingering request listeners on close.
        const onClose = () => {
            req.signal.off("abort", onAbort);
            rawRequest.removeListener("error", onRequestError);
            rawRequest.removeListener("response", onResponse);
            rawRequest.removeListener("close", onClose);
        };
        req.signal.on("abort", onAbort);
        rawRequest.once("error", onRequestError);
        rawRequest.once("response", onResponse);
        rawRequest.once("close", onClose);
        return pipelineRequest(req, rawRequest, reject);
    });
}
/**
 * ALPN validation error.
 */
class ALPNError extends Error {
    constructor(request, message) {
        super(message);
        this.request = request;
        this.code = "EALPNPROTOCOL";
    }
}
exports.ALPNError = ALPNError;
/**
 * Execute a HTTP2 connection.
 */
function execHttp2(key, client, req, url, config) {
    return new Promise((resolve, reject) => {
        // HTTP2 formatted headers.
        const headers = Object.assign({
            [http2_1.constants.HTTP2_HEADER_METHOD]: req.method,
            [http2_1.constants.HTTP2_HEADER_AUTHORITY]: url.host,
            [http2_1.constants.HTTP2_HEADER_SCHEME]: url.protocol.slice(0, -1),
            [http2_1.constants.HTTP2_HEADER_PATH]: url.pathname + url.search,
        }, req.headers.asObject());
        const http2Stream = client.request(headers, { endStream: false });
        let cause = new CausedByEarlyCloseError();
        // Handle socket timeouts more gracefully.
        const onSocketTimeout = () => {
            cause = new CausedByTimeoutError();
        };
        // Timeout after no activity.
        http2Stream.setTimeout(config.idleRequestTimeout, () => {
            cause = new CausedByTimeoutError();
            http2Stream.close(http2_1.constants.NGHTTP2_CANCEL);
        });
        // Trigger unavailable error when node.js errors before response.
        const onRequestError = (err) => {
            return reject(new ConnectionError(req, `Unable to connect to ${url.host}`, err));
        };
        const onResponse = (headers) => {
            const encrypted = client.socket.encrypted === true;
            const { localAddress = "", localPort = 0, remoteAddress = "", remotePort = 0, } = client.socket;
            let resolveTrailers;
            const trailer = new Promise((resolve) => (resolveTrailers = resolve));
            const onTrailers = (headers) => {
                resolveTrailers(headers);
            };
            http2Stream.once("trailers", onTrailers);
            const res = new Http2Response(pipelineResponse(req, http2Stream, () => {
                req.signal.off("abort", onAbort);
                http2Stream.removeListener("trailers", onTrailers);
                resolveTrailers({}); // Resolve in case "trailers" wasn't emitted.
            }), {
                status: Number(headers[http2_1.constants.HTTP2_HEADER_STATUS]),
                statusText: "",
                url: req.url,
                httpVersion: "2.0",
                headers,
                omitDefaultHeaders: true,
                trailer,
                connection: {
                    localAddress,
                    localPort,
                    remoteAddress,
                    remotePort,
                    encrypted,
                },
            });
            return resolve(res);
        };
        const onAbort = () => {
            http2Stream.destroy();
        };
        // Release the HTTP2 connection claim when the stream ends.
        const onClose = () => {
            var _a;
            // Clean up all lingering event listeners on final close.
            req.signal.off("abort", onAbort);
            http2Stream.removeListener("error", onRequestError);
            http2Stream.removeListener("response", onResponse);
            http2Stream.removeListener("close", onClose);
            (_a = client.socket) === null || _a === void 0 ? void 0 : _a.removeListener("timeout", onSocketTimeout);
            const shouldDestroy = config.http2Sessions.freed(key, client);
            if (shouldDestroy)
                client.destroy();
            // Handle when the server closes the stream without responding.
            return reject(new ConnectionError(req, `Connection closed without response from ${url.host}`, cause));
        };
        req.signal.on("abort", onAbort);
        http2Stream.once("error", onRequestError);
        http2Stream.once("response", onResponse);
        http2Stream.once("close", onClose);
        client.socket.once("timeout", onSocketTimeout);
        config.http2Sessions.used(key, client);
        return pipelineRequest(req, http2Stream, reject);
    });
}
/**
 * Configure HTTP version negotiation.
 */
var NegotiateHttpVersion;
(function (NegotiateHttpVersion) {
    NegotiateHttpVersion[NegotiateHttpVersion["HTTP1_ONLY"] = 0] = "HTTP1_ONLY";
    NegotiateHttpVersion[NegotiateHttpVersion["HTTP2_FOR_HTTPS"] = 1] = "HTTP2_FOR_HTTPS";
    NegotiateHttpVersion[NegotiateHttpVersion["HTTP2_ONLY"] = 2] = "HTTP2_ONLY";
})(NegotiateHttpVersion = exports.NegotiateHttpVersion || (exports.NegotiateHttpVersion = {}));
/**
 * Custom abort error instance.
 */
class AbortError extends Error {
    constructor(request, message) {
        super(message);
        this.request = request;
        this.code = "EABORT";
    }
}
exports.AbortError = AbortError;
const DEFAULT_KEEP_ALIVE = 5000; // 5 seconds.
const DEFAULT_IDLE_REQUEST_TIMEOUT = 30000; // 30 seconds.
const DEFAULT_IDLE_SOCKET_TIMEOUT = 300000; // 5 minutes.
function optionsToConfig(options) {
    const { keepAlive = DEFAULT_KEEP_ALIVE, idleSocketTimeout = DEFAULT_IDLE_SOCKET_TIMEOUT, idleRequestTimeout = DEFAULT_IDLE_REQUEST_TIMEOUT, tlsSockets = new SocketConnectionManager(), netSockets = new SocketConnectionManager(), http2Sessions = new Http2ConnectionManager(), } = options;
    return {
        keepAlive,
        idleSocketTimeout,
        idleRequestTimeout,
        tlsSockets,
        netSockets,
        http2Sessions,
    };
}
/**
 * Forward request over HTTP1/1 or HTTP2, with TLS support.
 */
function transport(options = {}) {
    const config = optionsToConfig(options);
    const { netSockets, tlsSockets, http2Sessions } = config;
    const { lookup = dns_1.lookup, createNetConnection = exports.defaultNetConnect, createTlsConnection = exports.defaultTlsConnect, createHttp2Connection = exports.defaultHttp2Connect, negotiateHttpVersion = NegotiateHttpVersion.HTTP2_FOR_HTTPS, } = options;
    return async (req, next) => {
        const url = new url_1.URL(req.url, "http://localhost");
        const { hostname, protocol } = url;
        if (req.signal.aborted) {
            throw new AbortError(req, "Request has been aborted");
        }
        if (protocol === "http:") {
            const port = Number(url.port) || 80;
            const connectionKey = `${hostname}:${port}:${negotiateHttpVersion}`;
            if (negotiateHttpVersion === NegotiateHttpVersion.HTTP2_ONLY) {
                const existingClient = http2Sessions.free(connectionKey);
                if (existingClient) {
                    return execHttp2(connectionKey, existingClient, req, url, config);
                }
            }
            const socket = await netSockets.ready(connectionKey, (socket) => {
                if (socket)
                    return socket;
                return netSockets.creating(connectionKey, async () => {
                    const socket = await createNetConnection({
                        host: hostname,
                        port,
                        lookup,
                    });
                    setupSocket(netSockets, connectionKey, socket, config);
                    return socket;
                });
            });
            claimSocket(netSockets, connectionKey, socket, config);
            // Use existing HTTP2 session in HTTP2-only mode.
            if (negotiateHttpVersion === NegotiateHttpVersion.HTTP2_ONLY) {
                const client = await http2Sessions.ready(connectionKey, (existingClient) => {
                    if (existingClient) {
                        freeSocket(netSockets, connectionKey, socket, config);
                        return existingClient;
                    }
                    return http2Sessions.creating(connectionKey, async () => {
                        const client = await createHttp2Connection(url, socket);
                        setupHttp2Client(connectionKey, client, config);
                        return client;
                    });
                });
                return execHttp2(connectionKey, client, req, url, config);
            }
            return execHttp1(req, url, socket, config);
        }
        // Optionally negotiate HTTP2 connection.
        if (protocol === "https:") {
            const { ca, cert, key, secureProtocol, secureContext, secureOptions, } = options;
            const port = Number(url.port) || 443;
            const servername = options.servername ||
                calculateServerName(hostname, req.headers.get("host"));
            const rejectUnauthorized = options.rejectUnauthorized !== false;
            const connectionKey = `${hostname}:${port}:${negotiateHttpVersion}:${servername}:${rejectUnauthorized}:${ca || ""}:${cert || ""}:${key || ""}:${secureProtocol || ""}`;
            // Use an existing HTTP2 session before making a new attempt.
            if (negotiateHttpVersion === NegotiateHttpVersion.HTTP2_ONLY ||
                negotiateHttpVersion === NegotiateHttpVersion.HTTP2_FOR_HTTPS) {
                const existingSession = http2Sessions.free(connectionKey);
                if (existingSession) {
                    return execHttp2(connectionKey, existingSession, req, url, config);
                }
            }
            // Use an existing TLS session to speed up handshake.
            const existingSocket = tlsSockets.get(connectionKey);
            const session = existingSocket ? existingSocket.getSession() : undefined;
            const ALPNProtocols = negotiateHttpVersion === NegotiateHttpVersion.HTTP2_ONLY
                ? ["h2"]
                : negotiateHttpVersion === NegotiateHttpVersion.HTTP2_FOR_HTTPS
                    ? ["h2", "http/1.1"]
                    : undefined;
            const socketOptions = {
                host: hostname,
                port,
                servername,
                rejectUnauthorized,
                ca,
                cert,
                key,
                session,
                secureProtocol,
                secureContext,
                ALPNProtocols,
                lookup,
                secureOptions,
            };
            const socket = await tlsSockets.ready(connectionKey, (socket) => {
                if (socket)
                    return socket;
                return tlsSockets.creating(connectionKey, async () => {
                    const socket = await createTlsConnection(socketOptions);
                    setupSocket(tlsSockets, connectionKey, socket, config);
                    return socket;
                });
            });
            claimSocket(tlsSockets, connectionKey, socket, config);
            if (negotiateHttpVersion === NegotiateHttpVersion.HTTP1_ONLY) {
                return execHttp1(req, url, socket, config);
            }
            if (negotiateHttpVersion === NegotiateHttpVersion.HTTP2_ONLY) {
                const client = await http2Sessions.ready(connectionKey, (existingClient) => {
                    if (existingClient) {
                        freeSocket(tlsSockets, connectionKey, socket, config);
                        return existingClient;
                    }
                    return http2Sessions.creating(connectionKey, async () => {
                        const client = await createHttp2Connection(url, socket);
                        setupHttp2Client(connectionKey, client, config);
                        return client;
                    });
                });
                return execHttp2(connectionKey, client, req, url, config);
            }
            return new Promise((resolve, reject) => {
                const onClose = () => {
                    socket.removeListener("error", onError);
                    socket.removeListener("connect", onConnect);
                    return reject(new ALPNError(req, "TLS connection closed early"));
                };
                const onError = (err) => {
                    socket.removeListener("connect", onConnect);
                    socket.removeListener("close", onClose);
                    return reject(new ConnectionError(req, `Unable to connect to ${hostname}:${port}`, err));
                };
                // Execute HTTP connection according to negotiated ALPN protocol.
                const onConnect = () => {
                    socket.removeListener("error", onError);
                    socket.removeListener("close", onClose);
                    // Workaround for https://github.com/nodejs/node/pull/32958/files#r418695485.
                    socket.secureConnecting = false;
                    // Successfully negotiated HTTP2 connection.
                    if (socket.alpnProtocol === "h2") {
                        return resolve(http2Sessions
                            .ready(connectionKey, (existingClient) => {
                            if (existingClient) {
                                freeSocket(tlsSockets, connectionKey, socket, config);
                                return existingClient;
                            }
                            return http2Sessions.creating(connectionKey, async () => {
                                const client = await createHttp2Connection(url, socket);
                                setupHttp2Client(connectionKey, client, config);
                                return client;
                            });
                        })
                            .then((client) => execHttp2(connectionKey, client, req, url, config)));
                    }
                    if (socket.alpnProtocol === "http/1.1" || !socket.alpnProtocol) {
                        return resolve(execHttp1(req, url, socket, config));
                    }
                    return reject(new ALPNError(req, `Unknown ALPN protocol negotiated: ${socket.alpnProtocol}`));
                };
                // Existing socket may already have negotiated ALPN protocol.
                // Can be `null`, a string, or `false` when no protocol negotiated.
                if (socket.alpnProtocol != null)
                    return onConnect();
                socket.once("secureConnect", onConnect);
                socket.once("error", onError);
                socket.once("close", onClose);
            });
        }
        return next();
    };
}
exports.transport = transport;
/**
 * Set socket config for usage, and configure for issues between assigning a socket and making the request.
 */
function claimSocket(manager, key, socket, config) {
    socket.setTimeout(config.idleSocketTimeout);
    manager.used(key, socket);
}
/**
 * Free a socket in the manager.
 */
function freeSocket(manager, key, socket, config) {
    socket.setTimeout(config.idleSocketTimeout);
    const shouldDestroy = manager.freed(key, socket);
    if (shouldDestroy)
        socket.destroy();
}
/**
 * Setup the socket with the connection manager.
 *
 * Ref: https://github.com/nodejs/node/blob/531b4bedcac14044f09129ffb65dab71cc2707d9/lib/_http_agent.js#L254
 */
function setupSocket(manager, key, socket, config) {
    const onFree = () => freeSocket(manager, key, socket, config);
    const cleanup = () => {
        manager.delete(key, socket);
        socket.removeListener("free", onFree);
        socket.removeListener("close", cleanup);
        socket.removeListener("error", cleanup);
        socket.removeListener("timeout", onTimeout);
    };
    const onTimeout = () => {
        socket.destroy();
        return cleanup();
    };
    socket.on("free", onFree);
    socket.once("close", cleanup);
    socket.once("error", cleanup);
    socket.once("timeout", onTimeout);
    if (config.keepAlive > 0)
        socket.setKeepAlive(true, config.keepAlive);
}
/**
 * Set up a HTTP2 working session.
 */
function setupHttp2Client(key, client, config) {
    const cleanup = () => {
        client.removeListener("error", cleanup);
        client.removeListener("goaway", cleanup);
        client.removeListener("close", cleanup);
        config.http2Sessions.delete(key, client);
    };
    client.once("error", cleanup);
    client.once("goaway", cleanup);
    client.once("close", cleanup);
}
/**
 * Ref: https://github.com/nodejs/node/blob/5823938d156f4eb6dc718746afbf58f1150f70fb/lib/_http_agent.js#L231
 */
function calculateServerName(hostname, hostHeader) {
    if (!hostHeader)
        return hostname;
    if (hostHeader.charAt(0) === "[") {
        const index = hostHeader.indexOf("]");
        if (index === -1)
            return hostHeader;
        return hostHeader.substr(1, index - 1);
    }
    return hostHeader.split(":", 1)[0];
}
//# sourceMappingURL=index.js.map