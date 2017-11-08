let Gemerator = require('../lib/mongoose-schemagen')

let fs = require('fs')

let jsonModel = JSON.parse( fs.readFileSync( 'test/jsons/Client.json', {encoding: 'utf8'}) )
let model = Gemerator.parseModel( jsonModel )

console.log('>>>>>>>>>', model)
