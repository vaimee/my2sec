const ontologies = [
    {'../Ontologies/owl/opo.ttl':"http://vaimee.it/template#opo"},
    {'../Ontologies/owl/jsap.ttl':"http://vaimee.it/template#jsap"},
    {'../Ontologies/owl/pac.ttl':"http://vaimee.it/template#pac"},
    {'../Ontologies/owl/sw.ttl':"http://vaimee.it/template#sw"},
    {'../Ontologies/owl/my2sec.ttl':"http://vaimee.it/template#my2sec"}];
    
let fs = require('fs');
let sttl = require('sttl');
let urdf = require('urdf');

const tpl = fs.readFileSync('vaimee.rq', 'utf-8');

sttl.register(tpl);
sttl.connect(q => {
    return urdf.query(q)
    .then(b => ({
        results: {
            bindings: b
        }
    }));
});

console.log("Rendering ontology documentation...");
const promiseChain = ontologies.reduce((p, src) => {
    return p.then( _ => render(Object.keys(src)[0],Object.values(src)[0],Object.keys(src)[0].replace('.ttl', '.html'))).then(() => urdf.clear())
}, Promise.resolve());


function render(ontologyFile,templateURI,output) {
    let ttl = fs.readFileSync(ontologyFile, 'UTF-8');
    return Promise.resolve()
    .then(() => urdf.load(ttl, { format: 'text/turtle' }))
    .then(() => sttl.callTemplate(templateURI, ttl))
    .then(html => fs.writeFileSync(output, html))
    .then(_ => console.log("File ",output,"generated"))
    .catch((e) => {
        console.error('Error while rendering ' + ontologyFile + ': ' + e);
    });
}
