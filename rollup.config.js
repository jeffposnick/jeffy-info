import {terser} from 'rollup-plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import OMT from '@surma/rollup-plugin-off-main-thread';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
const workboxInjectManifest = require('rollup-plugin-workbox-inject');

const SRC_DIR = 'src';
const BUILD_DIR = 'build';

export default {
  input: `${SRC_DIR}/service-worker.ts`,
  manualChunks: (id) => {
    if (!id.includes('/node_modules/')) {
      return undefined;
    }

    const chunkNames = ['workbox', 'nunjucks'];
    return chunkNames.find((chunkName) => id.includes(chunkName)) || 'misc';
  },
  plugins: [
    resolve({
      browser: true,
    }),
    commonjs(),
    replace({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    }),
    typescript(),
    OMT(),
    workboxInjectManifest({
      swSrc: `${SRC_DIR}/service-worker.ts`,
      swDest: `${BUILD_DIR}/service-worker.js`,
      globDirectory: BUILD_DIR,
      globPatterns: [
        '**/*.{json,njk}',
        'index.html',
      ],
    }),
    terser(),
  ],
  output: {
    sourcemap: true,
    format: 'amd',
    dir: BUILD_DIR,
  },
};
