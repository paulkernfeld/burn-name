var isValidName = require('..').isValidName
var tape = require('tape')

tape('isValidName', function (t) {
  t.ok(!isValidName())
  t.ok(!isValidName(''))
  t.ok(isValidName('x'))
  t.ok(!isValidName('Xdfas'))
  t.ok(isValidName('a-b-c-d-e'))
  t.ok(!isValidName('a--e'))
  t.ok(!isValidName('-a'))
  t.ok(!isValidName('a-'))
  t.ok(isValidName('0123456789abcdef'))
  t.ok(!isValidName('0123456789abcdefg'))
  t.end()
})
