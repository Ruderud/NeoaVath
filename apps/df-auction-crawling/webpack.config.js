const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, 'dist'),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: {
        minimize: true,
        sideEffects: true,
        concatenateModules: true,
      },
      outputHashing: 'none',
      generatePackageJson: true,
      externalDependencies: 'none',
    }),
  ],
};
