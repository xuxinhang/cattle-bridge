const gulp = require("gulp");
const ts = require("gulp-typescript");
const tsProject = ts.createProject("./src/tsconfig.json");
const rollup = require('rollup');
const rollupConfig = require('./rollup.config.js');

gulp.task('build:lib', function() {
  return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest('./lib'));
});

gulp.task('build:umd', async function () {
  const bundle = await rollup.rollup(rollupConfig);

  await bundle.write({
    file: './dist/cattle-bridge.umd.min.js',
    format: 'umd',
    name: 'library',
  });
});

gulp.task('default', ['build:lib', 'build:umd']);

