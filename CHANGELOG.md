# 0.2.0 (unreleased)

## Breaking Changes

* Node.js minimum version is now 20.0.0
* Removed `node-expat` parser support — only the `sax` parser is used; the `parser` option has been removed from `IXLSXExtractOptions` and the CLI `-p/--parser` flag has been removed
* CLI: header row option renamed from `-h` to `-n` (`-h` is conventionally reserved for `--help`)
* Package now ships as ESM default (`"type": "module"`) with dual ESM/CJS exports via `exports` field

## Features

* Dual ESM/CJS output (NodeNext compatibility) — both `import` and `require` are supported via the `exports` field
* Updated dependencies: yauzl, commander, sax

## Bug Fixes

* Missing cell filling now correctly emits the empty cell instead of the following cell
* Format array index access is now bounds-checked to avoid out-of-range reads
* Timezone offset handling in date parsing uses `Math.trunc` to correctly handle sub-hour offsets
* Errors in the zip read stream pipe are now propagated via `stream.destroy()` instead of thrown synchronously

# 0.1.3 (2019/11/27)

## Bug Fixes

* phonetic information was merged into cell string instead of being ignored

# 0.1.2 (2019/05/16)

## Features

* change unzip-library to more actively supported [yauzl](https://github.com/thejoshwolfe/yauzl)
* option to ignore timezone

# 0.1.1 (2018/12/01)

## Bug Fixes

* timezone was ignored in date parsing

# 0.1.0 (2018/07/03)

## Features

* first typescript version
* lots more test files
