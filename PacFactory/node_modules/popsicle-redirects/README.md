# Popsicle Redirects

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]
[![Build status][build-image]][build-url]
[![Build coverage][coverage-image]][coverage-url]

> Popsicle middleware for following HTTP redirects.

## Installation

```
npm install popsicle-redirects --save
```

## Usage

```js
import { redirects } from "popsicle-redirects";

const middleware = redirects(transport());
```

### Options

- `fn` Wrap a [`throwback`](https://github.com/serviejs/throwback) compatible middleware function in redirect behavior
- `maxRedirects` Set the maximum number of redirects to attempt before throwing an error (default: `5`)
- `confirmRedirect` Confirmation function for following 307 and 308 non-idempotent redirects (default: `() => false`)

## TypeScript

This project is written using [TypeScript](https://github.com/Microsoft/TypeScript) and publishes the definitions directly to NPM.

## License

MIT

[npm-image]: https://img.shields.io/npm/v/popsicle-redirects
[npm-url]: https://npmjs.org/package/popsicle-redirects
[downloads-image]: https://img.shields.io/npm/dm/popsicle-redirects
[downloads-url]: https://npmjs.org/package/popsicle-redirects
[build-image]: https://img.shields.io/github/workflow/status/serviejs/popsicle-redirects/CI/main
[build-url]: https://github.com/serviejs/popsicle-redirects/actions/workflows/ci.yml?query=branch%3Amain
[coverage-image]: https://img.shields.io/codecov/c/gh/serviejs/popsicle-redirects
[coverage-url]: https://codecov.io/gh/serviejs/popsicle-redirects
