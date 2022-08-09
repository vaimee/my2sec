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

const ontologies = [
    '../Ontologies/OWL files/opo.ttl','../Ontologies/OWL files/jsap.ttl','../Ontologies/OWL files/pac.ttl','../Ontologies/OWL files/sw.ttl'];


console.log("Rendering ontology documentation...");
const promiseChain = ontologies.reduce((p, src) => {
    const ontologyFile = src
    const templateURI = 'http://vaimee.it/template#main'
    return p.then( _ => render(ontologyFile,templateURI,ontologyFile.replace('.ttl', '.html'))).then(() => urdf.clear())
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
