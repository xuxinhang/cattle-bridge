// Cattile Bridge - rollup config file

import babel from 'rollup-plugin-babel';
import typescript from 'rollup-plugin-typescript2';
import cjs from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify';
import replace from 'rollup-plugin-replace';

export default {
  // input: 'src/index.js',
  input: 'src/main.ts',
  output: {
    file: 'dist/cattle-bridge.umd.js',
    format: 'umd',
    name: 'CattleBridge',
    sourcemap: true,
  },
  plugins: [
    typescript({exclude: 'node_modules/**'}),
    babel({exclude: 'node_modules/**'}),
    cjs(),
    uglify(),
    replace({
      "EVN.BUILD_EVN": JSON.stringify(process.env.NODE_ENV || 'development'),
    }),
  ],
}; 

/* uglify({
  output: {
    comments: function(node, comment) {
        var text = comment.value;
        var type = comment.type;
        if (type == "comment2") {
            // multiline comment
            return /@preserve|@license|@cc_on/i.test(text);
        }
    }
  }
}); */



