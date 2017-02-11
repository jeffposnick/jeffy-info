import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/jekyll-behavior-import.js',
  dest: 'build/jekyll-behavior-import.js',
  format: 'iife',
  plugins: [
    json(),
    resolve({
      preferBuiltins: false,
      jsnext: true,
      main: true,
      browser: true,
    }),
    commonjs(),
    babel({
      exclude: 'node_modules/**',
    }),
  ],
};
