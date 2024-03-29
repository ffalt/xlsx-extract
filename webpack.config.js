const path = require('path');
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
				loader: 'ts-loader',
				exclude: /node_modules/
			}
		]
	},
	resolve: {
		extensions: ['.ts']
	},
	output: {
		filename: 'index.min.js',
		path: path.resolve(__dirname, 'dist'),
		library: 'library',
		libraryTarget: 'umd',
		umdNamedDefine: true
	}
};
