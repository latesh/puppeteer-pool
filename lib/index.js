'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _puppeteer = require('puppeteer');

var _puppeteer2 = _interopRequireDefault(_puppeteer);

var _genericPool = require('generic-pool');

var _genericPool2 = _interopRequireDefault(_genericPool);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var debug = (0, _debug2.default)('puppeteer-pool');

var initPuppeteerPool = function initPuppeteerPool() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var _ref$max = _ref.max,
      max = _ref$max === undefined ? 10 : _ref$max,
      _ref$min = _ref.min,
      min = _ref$min === undefined ? 2 : _ref$min,
      _ref$idleTimeoutMilli = _ref.idleTimeoutMillis,
      idleTimeoutMillis = _ref$idleTimeoutMilli === undefined ? 30000 : _ref$idleTimeoutMilli,
      _ref$maxUses = _ref.maxUses,
      maxUses = _ref$maxUses === undefined ? 50 : _ref$maxUses,
      _ref$testOnBorrow = _ref.testOnBorrow,
      testOnBorrow = _ref$testOnBorrow === undefined ? true : _ref$testOnBorrow,
      _ref$puppeteerArgs = _ref.puppeteerArgs,
      puppeteerArgs = _ref$puppeteerArgs === undefined ? [] : _ref$puppeteerArgs,
      _ref$validator = _ref.validator,
      validator = _ref$validator === undefined ? function () {
    return Promise.resolve(true);
  } : _ref$validator,
      otherConfig = _objectWithoutProperties(_ref, ['max', 'min', 'idleTimeoutMillis', 'maxUses', 'testOnBorrow', 'puppeteerArgs', 'validator']);

  // TODO: randomly destroy old instances to avoid resource leak?
  var factory = {
    create: function create() {
      return _puppeteer2.default.launch.apply(_puppeteer2.default, _toConsumableArray(puppeteerArgs)).then(function (instance) {
        instance.useCount = 0;
        return instance;
      });
    },
    destroy: function destroy(instance) {
      instance.close();
    },
    validate: function validate(instance) {
      return validator(instance).then(function (valid) {
        return Promise.resolve(valid && (maxUses <= 0 || instance.useCount < maxUses));
      });
    }
  };
  var config = _extends({
    max: max,
    min: min,
    idleTimeoutMillis: idleTimeoutMillis,
    testOnBorrow: testOnBorrow
  }, otherConfig);
  var pool = _genericPool2.default.createPool(factory, config);
  var genericAcquire = pool.acquire.bind(pool);
  pool.acquire = function () {
    return genericAcquire().then(function (instance) {
      instance.useCount += 1;
      return instance;
    });
  };
  pool.use = function (fn) {
    var resource = void 0;
    return pool.acquire().then(function (r) {
      resource = r;
      return resource;
    }).then(fn).then(function (result) {
      pool.release(resource);
      return result;
    }, function (err) {
      pool.release(resource);
      throw err;
    });
  };

  return pool;
};

// To avoid breaking backwards compatibility
// https://github.com/binded/phantom-pool/issues/12
initPuppeteerPool.default = initPuppeteerPool;

exports.default = initPuppeteerPool;
module.exports = exports['default'];