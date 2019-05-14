# puppeteer-pool

Resource pool based on [generic-pool](https://github.com/coopernurse/node-pool) for [Puppeteer](https://github.com/GoogleChrome/puppeteer).

Creating new phantom instances with `puppeteer.launch()` can be slow. If
you are frequently creating new instances and destroying them, as a
result of HTTP requests for example, this module can help by keeping a
pool of puppeteer instances alive and making it easy to re-use them across
requests.

## Install

```bash
npm install --save puppeteer-pool
```

Requires Node v6+

## Usage

```javascript
const createPuppeteerPool = require('puppeteer-pool')

// Returns a generic-pool instance
const pool = createPuppeteerPool({
  max: 10, // default
  min: 2, // default
  // how long a resource can stay idle in pool before being removed
  idleTimeoutMillis: 30000, // default.
  // maximum number of times an individual resource can be reused before being destroyed; set to 0 to disable
  maxUses: 50, // default
  // function to validate an instance prior to use; see https://github.com/coopernurse/node-pool#createpool
  validator: () => Promise.resolve(true), // defaults to always resolving true
  // validate resource before borrowing; required for `maxUses and `validator`
  testOnBorrow: true, // default
  // For all opts, see opts at https://github.com/coopernurse/node-pool#createpool
  puppeteerArgs: []
})

// Automatically acquires a puppeteer instance and releases it back to the
// pool when the function resolves or throws
pool.use(async (browser) => {
  const page = await browser.newPage()
  const status = await page.goto('http://google.com')
  if (!status.ok) {
    throw new Error('cannot open google.com')
  }
  const content = await page.content()
  await page.close()
  return content
}).then((content) => {
  console.log(content)
})

// Destroying the pool:
pool.drain().then(() => pool.clear())

// For more API doc, see https://github.com/coopernurse/node-pool#generic-pool
```

## Security

When using puppeteer-pool, you should be aware that the puppeteer instance
you are getting might not be in a completely clean state. It could have
browser history, cookies or other persistent data from a previous use.

If that is an issue for you, make sure you clean up any sensitive data
on the puppeteer instance before returning it to the pool.

## Credits

This module is forked from [phantom-pool](https://github.com/binded/phantom-pool) and all phantom related code
has been sustituted with puppeteer.
