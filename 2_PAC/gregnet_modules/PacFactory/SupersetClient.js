class SupersetClient{
    constructor(host,port){
        this.hostname=host;
        this.port=port;
    }

    getGuestToken(){

    }
    getToken(){
        const http = require('http');        
        const options = {
            hostname: this.host,//"openproject",//'host.docker.internal',
            port: this.port,//80,//889,
            path: "/api/v1/security/login",
            method: 'POST',
            headers: {
                "Content-Type": 'application/json'
            }
        }
        const req = http.request(options, res => {
            let data = '';
            console.log('Status: ', res.statusCode);
            //console.log('Headers: ', JSON.stringify(res.headers));
            res.setEncoding('utf8');
            res.on('data', chunk => {data += chunk;});
            res.on('end', () => {/*console.log('Body: ', JSON.parse(data))*/});
        }).on('error', e => {
            console.error(e);
        });
        
        req.write(JSON.stringify(update));
        req.end();
    }
}