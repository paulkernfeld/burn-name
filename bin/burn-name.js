#!/usr/bin/env node
var BurnStream = require('burn-stream')
var Networks = require('bitcore-lib').Networks
var Node = require('webcoin').Node
var constants = require('webcoin').constants
var argv = require('minimist')(process.argv.slice(2))
var assert = require('assert')
var BurnName = require('..')
var config = require('../config').testnet
var path = require('path')

assert(argv.t, 'You must set the -t flag')

// Hackily set the node's checkpoint
constants.checkpoints[config.networkName] = BurnStream.checkpointToConstant(config.checkpoint)

// Create and start a node
var node = new Node({
  network: Networks[config.networkName],
  path: path.join(__dirname, '../webcoin-test-data'),
  acceptWeb: true
})
node.on('error', console.log)
config.node = node

var burnName = new BurnName(config)
burnName.getData(argv.name, function (err, data) {
  assert.ifError(err)

  data.forEach(function (d) {
    console.log(d.toString('hex'))
  })
  node.close()
})

node.start()
