import {terser} from 'rollup-plugin-terser';
import commonjs from 'rollup-plugin-commonjs';
import OMT from '@surma/rollup-plugin-off-main-thread';
import replace from 'rollup-plugin-replace';
import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript';

export default {
  input: 'src/service-worker.ts',
  output: {
    sourcemap: true,
    format: 'amd',
    name: 'workbox',
    dir: 'build'
  },
  manualChunks: (id) => {
    const chunkNames = ['workbox', 'nunjucks'];
    for (const chunkName of chunkNames) {
      if (id.includes(chunkName)) {
        return chunkName;
      }
    }
  },
  plugins: [
    resolve(),
    commonjs(),
    replace({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    }),
    typescript(),
    OMT(),
    terser(),
  ],
};
