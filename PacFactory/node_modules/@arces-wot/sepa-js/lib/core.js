const defaults = require('./defaults');
const SEPA = require('./sepa');
const SECSEPA = require('./secure')
const jsap = require('./jsap');
const bench = require("./querybench")

const client = new SEPA(defaults)
client.secure = SECSEPA
module.exports = {
  SEPA : SEPA,
  client : client,
  Jsap : jsap,
  bench : bench
}
