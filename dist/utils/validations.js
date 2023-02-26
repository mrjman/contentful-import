"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.assertPayload = exports.assertDefaultLocale = void 0;
var _schema = require("./schema");
var _getEntityName = _interopRequireDefault(require("contentful-batch-libs/dist/get-entity-name"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const attachEntityName = (details, payload) => {
  details.map(detail => {
    if (detail.path.length >= 2) {
      detail.entity = (0, _getEntityName.default)(payload[detail.path[0]][detail.path[1]]);
    }
    return detail;
  });
};
const countInvalidEntities = validationData => {
  const entityCount = validationData.reduce((entities, currentDetail) => {
    if (!entities[currentDetail.path[0]]) {
      entities[currentDetail.path[0]] = 1;
    } else {
      entities[currentDetail.path[0]]++;
    }
    return entities;
  }, {});
  return Object.keys(entityCount).map(key => `${key}:${entityCount[key]}`);
};
const assertPayload = payload => {
  const result = _schema.payloadSchema.validate(payload, {
    allowUnknown: true,
    abortEarly: false
  });
  if (result.error) {
    attachEntityName(result.error.details, payload);
    const invalidEntityCount = countInvalidEntities(result.error.details).join(', ');
    result.error.message = `${invalidEntityCount} - Get further details in the error log file`;
    delete result.error._object;
    throw result.error;
  }
};
exports.assertPayload = assertPayload;
const assertDefaultLocale = (source, destination) => {
  const sourceDefaultLocale = source.locales.find(locale => locale.default === true);
  const destinationDefaultLocale = destination.locales.find(locale => locale.default === true);
  if (!sourceDefaultLocale || !destinationDefaultLocale) {
    return;
  }
  if (sourceDefaultLocale.code !== destinationDefaultLocale.code) {
    throw new Error(`
      Please make sure the destination space have the same default locale as the source\n
      Default locale for source space : ${sourceDefaultLocale.code}\n
      Default locale for destination space: ${destinationDefaultLocale.code}\n
    `);
  }
};
exports.assertDefaultLocale = assertDefaultLocale;