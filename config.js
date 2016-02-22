var fs = require('fs')
var path = require('path')

module.exports.testnet = JSON.parse(fs.readFileSync(path.join(__dirname, 'app-config-testnet.json')))
