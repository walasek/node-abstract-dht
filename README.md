# [node-abstract-dht](https://github.com/walasek/node-abstract-dht) [![Package Version](https://img.shields.io/npm/v/udp-messaging.svg?style=flat-square)](https://www.npmjs.com/walasek/node-abstract-dht) ![License](https://img.shields.io/npm/l/udp-messaging.svg?style=flat-square) [![Dependencies](https://david-dm.org/walasek/node-abstract-dht.svg)](https://david-dm.org/walasek/node-abstract-dht.svg)  [![codecov](https://codecov.io/gh/walasek/node-abstract-dht/branch/master/graph/badge.svg)](https://codecov.io/gh/walasek/node-abstract-dht)

An implementation of Kademlia-based DHT protocol with abstract networking.

---

## Goal

...

## Installation

Node `>=8.9.0` is required.

```bash
npm install --save udp-messaging
```

To perform tests use:

```bash
cd node_modules/udp-messaging
npm i
npm t
```

## Contributing

The source is documented with JSDoc. To generate the documentation use:

```bash
npm run docs
```

Extra debugging information is printed using the `debug` module:

```bash
DEBUG=udp-messaging:* npm t
```

The documentation will be put in the new `docs` directory.

To introduce an improvement please fork this project, commit changes in a new branch to your fork and add a pull request on this repository pointing at your fork. Please follow these style recommendations when working on the code:

* Use tabs (yup).
* Use `async`/`await` and/or `Promise` where possible.
* Features must be properly tested.
* New methods must be properly documented with `jscode` style comments.