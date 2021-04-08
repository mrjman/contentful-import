# Contentful import tool

[![npm](https://img.shields.io/npm/v/contentful-import.svg)](https://www.npmjs.com/package/contentful-import)
[![Build Status](https://travis-ci.org/contentful/contentful-import.svg?branch=master)](https://travis-ci.org/contentful/contentful-import)
[![codecov](https://codecov.io/gh/contentful/contentful-import/branch/master/graph/badge.svg)](https://codecov.io/gh/contentful/contentful-import)
[![Dependency Status](https://img.shields.io/david/contentful/contentful-import.svg)](https://david-dm.org/contentful/contentful-import)
[![devDependency Status](https://img.shields.io/david/dev/contentful/contentful-import.svg)](https://david-dm.org/contentful/contentful-import#info=devDependencies)

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

[Contentful](https://www.contentful.com) provides a content infrastructure for digital teams to power content in websites, apps, and devices. Unlike a CMS, Contentful was built to integrate with the modern software stack. It offers a central hub for structured content, powerful management and delivery APIs, and a customizable web app that enable developers and content creators to ship digital products faster.

This library helps you to import files generated by [contentful-export](https://github.com/contentful/contentful-export) to a destination space.

## :exclamation: Usage as CLI
> We moved the CLI version of this tool into our [Contentful CLI](https://github.com/contentful/contentful-cli). This allows our users to use and install only one single CLI tool to get the full Contentful experience.
>
> Please have a look at the [Contentful CLI import command documentation](https://github.com/contentful/contentful-cli/tree/master/docs/space/import) to learn more about how to use this as command line tool.

## :cloud: Pre-requisites && Installation

### Pre-requisites

- Node LTS

### Installation

```bash
npm install contentful-import
```

## :hand: Usage

```javascript
const contentfulImport = require('contentful-import')

const options = {
  content: {entries:..., contentTypes:..., locales:...},
  spaceId: '<space_id>',
  managementToken: '<content_management_api_key>',
  ...
}

contentfulImport(options)
  .then(() => {
    console.log('Data imported successfully')
  })
  .catch((err) => {
    console.log('Oh no! Some errors occurred!', err)
  })
```

or

```javascript
const contentfulImport = require('contentful-import')

const options = {
  contentFile: '/path/to/result/of/contentful-export.json',
  spaceId: '<space_id>',
  managementToken: '<content_management_api_key>',
  ...
}

contentfulImport(options)
  .then(() => {
    console.log('Data imported successfully')
  })
  .catch((err) => {
    console.log('Oh no! Some errors occurred!', err)
  })
```

#### Import an environment

```javascript
const contentfulImport = require('contentful-import')

const options = {
  contentFile: '/path/to/result/of/contentful-export.json',
  spaceId: '<space_id>',
  managementToken: '<content_management_api_key>',
  environmentId: '<environment_id>',
  ...
}

contentfulImport(options)
...
```

## :gear: Configuration options

### Basics

#### `spaceId` [string] [required]
ID of the space to import into

#### `environmentId` [string] [default: 'master']
ID of the environment in the destination space

#### `managementToken` [string] [required]
Contentful management API token for the space to be imported to

#### `contentFile` [string]
Path to JSON file that contains data to be import to your space

#### `content` [object]
Content to import. Needs to match the expected structure (See below)

### Filtering

#### `contentModelOnly` [boolean] [default: false]
Import content types only

#### `skipContentModel` [boolean] [default: false]
Skip importing of content types and locales

#### `skipLocales` [boolean] [default: false]
Skip importing of locales

#### `skipContentPublishing` [boolean] [default: false]
Skips content publishing. Creates content but does not publish it

## Assets

#### `uploadAssets` [boolean] [default: false]
Upload local asset files downloaded via the [downloadAssets](https://github.com/contentful/contentful-export#downloadassets-boolean) option of the export. Requires `assetsDirectory`

#### `assetsDirectory` [string]
Path to a directory with an asset export made using the [downloadAssets](https://github.com/contentful/contentful-export#downloadassets-boolean) option of the export. Requires `uploadAssets`

### Connection

#### `host` [string] [default: 'api.contentful.com']
The Management API host

#### `proxy` [string]
Proxy configuration in HTTP auth format: `host:port` or `user:password@host:port`

#### `rawProxy` [boolean]
Pass proxy config to Axios instead of creating a custom httpsAgent

#### `rateLimit` [number] [default: 7]
Maximum requests per second used for API requests

#### `headers` [object]
Additional headers to attach to the requests. 

### Other

#### `errorLogFile` [string]
Full path to the error log file

#### `useVerboseRenderer` [boolean] [default: false]
Display progress in new lines instead of displaying a busy spinner and the status in the same line. Useful for CI.

## :rescue_worker_helmet: Troubleshooting

Unable to connect to Contentful through your Proxy? Try to set the `rawProxy` option to `true`.

```javascript
contentfulImport({
  proxy: 'https://cat:dog@example.com:1234',
  rawProxy: true,
  ...
})
```

## :card_file_box: Expected input data structure

The data to import should be structured like this:

```json
{
  "contentTypes": [],
  "entries": [],
  "assets": [],
  "locales": [],
  "webhooks": [],
  "roles": [],
  "tags": [],
  "editorInterfaces": []
}
```

Note: `tags` are not available for all users. If you do not have access to this feature, any tags included in your import data will be skipped.


## :bulb: Importing to a space with existing content

- Both source space and destination space must share the same content model structure. In order to achieve that, please use [contentful-migration](https://www.npmjs.com/package/contentful-migration).
- Content transformations are also not supported, please use [contentful-migration](https://www.npmjs.com/package/contentful-migration).
- Entities existence are determined based on their ID:
  * If an entity does not exist in the destination space, it will be created.
  * If an entity already exists in the destination space, it will be updated.
- Publishing strategy:
  * If an entity is in draft, it will be created as draft in the destination space.
  * If an entity is published and has pending changes (updated) in the source space, it will be published with the latest changes in the destination space.

## :warning: Limitations

- This tool currently does **not** support the import of space memberships.
- This tool currently does **not** support the import of roles.
- This tool is expecting the target space to have the same default locale as your previously exported space.
- Imported webhooks with credentials will be imported as normal webhooks. Credentials should be added manually afterwards.
- Imported webhooks with secret headers will be imported without these headers. Secret headers should be added manuall afterwards.
- If you have custom UI extensions, you need to reinstall them manually in the new space.

## :memo: Changelog

Read the [releases](https://github.com/contentful/contentful-import/releases) page for more information.

## :scroll: License

This project is licensed under MIT license

[1]: https://www.contentful.com
