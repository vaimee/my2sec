const ontologies = [
    {'../Ontologies/OWL files/opo.ttl':"http://vaimee.it/template#opo"},
    {'../Ontologies/OWL files/jsap.ttl':"http://vaimee.it/template#jsap"},
    {'../Ontologies/OWL files/pac.ttl':"http://vaimee.it/template#pac"},
    {'../Ontologies/OWL files/sw.ttl':"http://vaimee.it/template#sw"}];
    
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
