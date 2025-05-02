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
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      externalDependencies: [
        '@nestjs/common',
        '@nestjs/core',
        '@nestjs/microservices',
        '@nestjs/websockets',
        '@nestjs/platform-express',
        'class-validator',
        'class-transformer',
        'reflect-metadata',
        'rxjs',
      ],
    }),
  ],
};
