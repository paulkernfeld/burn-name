#!/usr/bin/env node
var BurnStream = require('burn-stream')
const EventEmitter = require('events')
var inherits = require('inherits')
var assert = require('assert')
var debug = require('debug')('burn-name')
var constants = require('./constants')
var timers = require('timers')

// The longest inter-block gap ever was 1 h 39 minutes
// http://bitcoin.stackexchange.com/questions/2324
var MAX_DELAY_SECONDS = 60 * 60 * 3

function BurnName (config) {
  if (!(this instanceof BurnName)) return new BurnName(config)
  EventEmitter.call(this)

  this.burnStream = BurnStream(config)
  this.node = config.node
  this.nameToBids = {}
  this.ownerToData = {}

  this.burnStream.stream.on('data', this.onData.bind(this))
}
inherits(BurnName, EventEmitter)

BurnName.prototype.onData = function (burnStreamData) {
  if (burnStreamData.message[0] === constants.MESSAGE_BID) {
    this.handleBidMessage(burnStreamData)
  } else if (burnStreamData.message[0] === constants.MESSAGE_DATA) {
    this.handleDataMessage(burnStreamData)
  } else {
    this.emit('error', 'Unrecognized message type')
  }
}

BurnName.prototype.handleBidMessage = function (burnStreamData) {
  // TODO is ASCII conversion a security hole?
  var name = burnStreamData.message.slice(1).toString('ascii')
  if (!isValidName(name)) {
    this.emit('error', 'Unacceptable username')
    return
  }

  var input = burnStreamData.burnieTx.tx.transaction.inputs[0]
  if (!input.script.isPublicKeyHashIn()) {
    this.emit('error', 'First input was not P2PKH')
    return
  }

  var pubkeyHex = input.script.getAddressInfo().hashBuffer.toString('hex')

  debug('bid', name, pubkeyHex)
  if (!this.nameToBids[name]) this.nameToBids[name] = []
  this.nameToBids[name].push({
    name: name,
    bidder: pubkeyHex,
    burnStream: burnStreamData
  })
}

BurnName.prototype.handleDataMessage = function (burnStreamData) {
  var self = this

  var input = burnStreamData.burnieTx.tx.transaction.inputs[0]
  if (!input.script.isPublicKeyHashIn()) {
    self.emit('error', 'First input was not P2PKH')
    return
  }

  var pubkeyHex = input.script.getAddressInfo().hashBuffer.toString('hex')

  if (!self.ownerToData[pubkeyHex]) self.ownerToData[pubkeyHex] = []
  var data = burnStreamData.message.slice(1)
  self.ownerToData[pubkeyHex].push(data)

  debug('data', data.toString('ascii'), data.toString('hex'), pubkeyHex)
}

BurnName.prototype.getData = function (name, cb) {
  var self = this

  var tryAgain = function () {
    self.getData(name, cb)
  }

  if (!this.node.chain.initialized || this.node.chain.syncing) {
    this.node.chain.once('synced', tryAgain)
    debug('Waiting for headers')
    return
  }

  var txStream = this.burnStream.burnie.txStream
  if (!txStream) {
    timers.setTimeout(tryAgain, 100)
    return
  }

  var currentTime = new Date().getTime() / 1000
  if (!txStream.last || currentTime - txStream.last.header.time > MAX_DELAY_SECONDS) {
    txStream.blocks.once('data', tryAgain)
    debug('Waiting for tx stream')
    return
  }

  // Wait longer to allow the stream to catch up more, if possible.
  timers.setTimeout(function () {
    assert(self.nameToBids[name], 'The name %s does not appear to exist' % name)
    var owner = calculateOwner(self.nameToBids[name], currentTime)
    cb(null, self.ownerToData[owner] || [])
  }, 5000)
}

var calculateOwner = function (bids, time) {
  assert(bids.length === 1, 'Am I really going to have to implement this?')
  return bids[0].bidder
}

var VALID_NAME_REGEX = /^[a-z0-9](?:-?[a-z0-9]){0,15}$/
var isValidName = function (name) {
  if (typeof name !== 'string') {
    return false
  }
  return VALID_NAME_REGEX.test(name)
}

module.exports = BurnName
module.exports.isValidName = isValidName
