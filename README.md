BurnName
--------
BurnName is a reader for the [BurnName](https://gist.github.com/paulkernfeld/c1411466c53d4bc17f8c) decentralized name protocol.

BurnName fetches the data associated with a particular name.

To write to BurnName, see [burn-name-writer](https://github.com/paulkernfeld/burn-name-writer).

Example
-------
`bin/burn-name.js` prints out the data attached to a name. The data is printed out in hex format, separated by newlines.

To print the data attached to my name, run:

`bin/burn-name.js -t --name occupy-paul-st`

If you want to see logs, set the env var `DEBUG` to `*` (see [visionmedia/debug](https://github.com/visionmedia/debug)).

If there are no bids for a name, the program will error. If the owner of a name has not attached any data, the program will exit successfully without printing anything.

This is only guaranteed to pick up data that is more than three hours old, although it may pick up newer data.