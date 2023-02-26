"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = runContentfulImport;
var _cliTable = _interopRequireDefault(require("cli-table3"));
var _differenceInSeconds = _interopRequireDefault(require("date-fns/differenceInSeconds"));
var _formatDistance = _interopRequireDefault(require("date-fns/formatDistance"));
var _listr = _interopRequireDefault(require("listr"));
var _listrUpdateRenderer = _interopRequireDefault(require("listr-update-renderer"));
var _listrVerboseRenderer = _interopRequireDefault(require("listr-verbose-renderer"));
var _lodash = require("lodash");
var _pQueue = _interopRequireDefault(require("p-queue"));
var _logging = require("contentful-batch-libs/dist/logging");
var _listr2 = require("contentful-batch-libs/dist/listr");
var _initClient = _interopRequireDefault(require("./tasks/init-client"));
var _getDestinationData = _interopRequireDefault(require("./tasks/get-destination-data"));
var _pushToSpace = _interopRequireDefault(require("./tasks/push-to-space/push-to-space"));
var _transformSpace = _interopRequireDefault(require("./transform/transform-space"));
var _validations = require("./utils/validations");
var _parseOptions = _interopRequireDefault(require("./parseOptions"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
const ONE_SECOND = 1000;
function createListrOptions(options) {
  if (options.useVerboseRenderer) {
    return {
      renderer: _listrVerboseRenderer.default
    };
  }
  return {
    renderer: _listrUpdateRenderer.default,
    collapse: false
  };
}
async function runContentfulImport(params) {
  const log = [];
  const options = await (0, _parseOptions.default)(params);
  const listrOptions = createListrOptions(options);
  const requestQueue = new _pQueue.default({
    interval: ONE_SECOND,
    intervalCap: options.rateLimit,
    carryoverConcurrencyCount: true
  });

  // Setup custom log listener to store log messages for later
  (0, _logging.setupLogging)(log);
  const infoTable = new _cliTable.default();
  infoTable.push([{
    colSpan: 2,
    content: 'The following entities are going to be imported:'
  }]);
  Object.keys(options.content).forEach(type => {
    if (options.skipLocales && type === 'locales') {
      return;
    }
    if (options.skipContentModel && ['contentTypes', 'editorInterfaces'].indexOf(type) >= 0) {
      return;
    }
    if (options.contentModelOnly && !(['contentTypes', 'editorInterfaces', 'locales'].indexOf(type) >= 0)) {
      return;
    }
    infoTable.push([(0, _lodash.startCase)(type), options.content[type].length]);
  });
  console.log(infoTable.toString());
  const tasks = new _listr.default([{
    title: 'Validating content-file',
    task: ctx => {
      (0, _validations.assertPayload)(options.content);
    }
  }, {
    title: 'Initialize client',
    task: (0, _listr2.wrapTask)(async ctx => {
      ctx.client = (0, _initClient.default)(_objectSpread(_objectSpread({}, options), {}, {
        content: undefined
      }));
    })
  }, {
    title: 'Checking if destination space already has any content and retrieving it',
    task: (0, _listr2.wrapTask)(async (ctx, task) => {
      const destinationData = await (0, _getDestinationData.default)({
        client: ctx.client,
        spaceId: options.spaceId,
        environmentId: options.environmentId,
        sourceData: options.content,
        skipLocales: options.skipLocales,
        skipContentModel: options.skipContentModel,
        requestQueue
      });
      ctx.sourceDataUntransformed = options.content;
      ctx.destinationData = destinationData;
      (0, _validations.assertDefaultLocale)(ctx.sourceDataUntransformed, ctx.destinationData);
    })
  }, {
    title: 'Apply transformations to source data',
    task: (0, _listr2.wrapTask)(async ctx => {
      const transformedSourceData = (0, _transformSpace.default)(ctx.sourceDataUntransformed, ctx.destinationData);
      ctx.sourceData = transformedSourceData;
    })
  }, {
    title: 'Push content to destination space',
    task: (ctx, task) => {
      return (0, _pushToSpace.default)({
        sourceData: ctx.sourceData,
        destinationData: ctx.destinationData,
        client: ctx.client,
        spaceId: options.spaceId,
        environmentId: options.environmentId,
        contentModelOnly: options.contentModelOnly,
        skipLocales: options.skipLocales,
        skipContentModel: options.skipContentModel,
        skipContentPublishing: options.skipContentPublishing,
        timeout: options.timeout,
        retryLimit: options.retryLimit,
        uploadAssets: options.uploadAssets,
        assetsDirectory: options.assetsDirectory,
        listrOptions,
        requestQueue
      });
    }
  }], listrOptions);
  return tasks.run({
    data: {}
  }).then(ctx => {
    console.log('Finished importing all data');
    const resultTypes = Object.keys(ctx.data);
    if (resultTypes.length) {
      const resultTable = new _cliTable.default();
      resultTable.push([{
        colSpan: 2,
        content: 'Imported entities'
      }]);
      resultTypes.forEach(type => {
        resultTable.push([(0, _lodash.startCase)(type), ctx.data[type].length]);
      });
      console.log(resultTable.toString());
    } else {
      console.log('No data was imported');
    }
    const endTime = new Date();
    const durationHuman = (0, _formatDistance.default)(endTime, options.startTime);
    const durationSeconds = (0, _differenceInSeconds.default)(endTime, options.startTime);
    console.log(`The import took ${durationHuman} (${durationSeconds}s)`);
    return ctx.data;
  }).catch(err => {
    log.push({
      ts: new Date().toJSON(),
      level: 'error',
      error: err
    });
  }).then(data => {
    const errorLog = log.filter(logMessage => logMessage.level !== 'info' && logMessage.level !== 'warning');
    const displayLog = log.filter(logMessage => logMessage.level !== 'info');
    (0, _logging.displayErrorLog)(displayLog);
    if (errorLog.length) {
      return (0, _logging.writeErrorLogFile)(options.errorLogFile, errorLog).then(() => {
        const multiError = new Error('Errors occurred');
        multiError.name = 'ContentfulMultiError';
        multiError.errors = errorLog;
        throw multiError;
      });
    }
    console.log('The import was successful.');
    return data;
  });
}
module.exports = exports.default;