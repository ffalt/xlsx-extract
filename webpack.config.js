const path = require('path');
const {CheckerPlugin} = require('awesome-typescript-loader');
const nodeExternals = require('webpack-node-externals');
module.exports = {
	entry: './src/index.ts',
	devtool: 'source-map',
	target: 'node',
	externals: [nodeExternals()],
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				loader: 'awesome-typescript-loader',
				exclude: /node_modules/
			}
		]
	},
	plugins: [
		new CheckerPlugin()
	],
	resolve: {
		extensions: ['.ts']
	},
	output: {
		filename: 'index.js',
		path: path.resolve(__dirname, 'dist', 'bundle')
	}
};

/**

 // const {CheckerPlugin} = require('awesome-typescript-loader');
 var webpack = require('webpack');
 const path = require('path');
 module.exports = {
	entry: './src/index.ts',
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist')
	},
	module: {
		rules: [
			// all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
			{test: /\.ts$/, loader: 'ts-loader'}
		]
	},
	devtool: "eval-source-map"
};

 module.exports = {
	entry: './src/index.ts',
	output: {
		filename: 'bundle.js'
	},
	devtool: 'source-map',
	resolve: {
		extensions: ['', '.webpack.js', '.web.js', '.ts', '.js']
	},
	plugins: [
		new webpack.optimize.UglifyJsPlugin()
	],
	module: {
		loaders: [
			{test: /\.ts$/, loader: 'ts-loader'}
		]
	}
};

 module.exports = {
	context: __dirname,

	entry: './index.ts',
	// entry: {
	// 	"index": 'src/index.ts', //path.resolve(__dirname, "./src/index.ts"),
	// "my-lib.min": "./src/index.ts"
	// },
	//
	// Currently we need to add '.ts' to the resolve.extensions array.
	resolve: {
		extensions: ['.ts', '.tsx', '.js', '.jsx']
	},

	// Source maps support ('inline-source-map' also works)
	devtool: 'source-map',

	mode: 'production',

	"output": {
		"path": path.resolve(__dirname, "_bundles"),
		"filename": "[name].js",
		"libraryTarget": "umd",
		"library": "MyLib",
		"umdNamedDefine": true
	},

	// Add the loader for .ts files.
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				loader: 'awesome-typescript-loader'
			}
		]
	},
	plugins: [
		new CheckerPlugin()
	]
};
 //
 // {
//   "entry": {
//     "my-lib": "./src/index.ts",
//     "my-lib.min": "./src/index.ts"
//   },
/   "resolve": {
//     "extensions": [".ts", ".tsx", ".js"]
//   },
//   "devtool": "source-map",
//   "plugins": [
//     "new" "webpack.optimize.UglifyJsPlugin("{
//       "minimize": true,
//       "sourceMap": true,
//       "include": "/"\".min"\".js$/",
//     }")"
//   ],
//   "module": {
//     "loaders": [{
//       "test": "/"\".tsx"?"$/",
//       "loader": "awesome-typescript-loader",
//       "exclude": "/node_modules/",
//       "query": {
//         "declaration": false,
//       }
//     }]
//   }
//   }
 **/
