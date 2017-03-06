# Simple gulp


## Gulp tasks

#### build

Build project

#### watch

Watch for changes

#### clean

Clean destination folder


## API

### init(config);

#### config

Type: `Object`

Required

#### config.src

Type: `String`

Required

Source directory

#### config.dest

Type: `String`

Required

Destination directory

#### config.types

Type: `Object`

Required

List of types

#### config.types[type].src

Type: `String`

Required

Filter souce relative `config.src`

#### config.types[type].dest

Type: `String`

Default: `''`

Destination folder relative `config.dest`

#### config.types[type].pipe

Type: `Array`

Default: empty pipe

List of pipes

#### config.types[type].pipe[n]

Type: `Array of String`

Required

First is name of npm module, Following are arguments

#### config.types[type].minify

See `config.types[type].pipe`

Uses when `minify` is `true`

#### config.clean

Type: `String` `Array of String`

Default: `config.dest`

Argument for [del](https://www.npmjs.com/package/del)

### prefix

Type: `String`

Default: `gulp-simple-`

Prefix for gulp tasks

### minify

Type: `Boolean`

Default: `false`

Enable minify. See `config.types[type].minify`

### onWatch

Type: `Function`

Default: `() => {}`

`watch.on('change')` callback

### fullWatch

Type: `Boolean`

Default: `false`

Disable incremental watch

### config

Type: `Object`

Object after parse

### pipes

Type: `Array`

Pipes, generated in `build`


## Sample

Add to your project `gulpfile.js`:

```js
const gulp = require('gulp');
const runSequence = require('run-sequence');
const minimist = require('minimist');

require('gulp-simple')({
    src: 'source',
    dest: 'build',
    types: [
        css: {
            src: 'css/**/*.css',
            dest: 'css',
            pipe: [
                [ "gulp-autoprefixer", "last 2 versions" ]
            ,
            minify: [
                [ "gulp-cssnano" ]
            ]
        },
        less: {
            src: '**/*.less',
            dest: 'css',
            pipe: [
                [ "gulp-less" ],
                [ "gulp-autoprefixer", "last 2 versions" ]
            ],
            minify: [
                [ "gulp-cssnano" ]
            ]
        },
        js: {
            src: '**/*.js',
            dest: 'js',
            minify: [
                [ "gulp-uglify" ]
            ]
        }
    ],
    clean: [ 'build/**', '!build', '!build/uploads' ]
}, {
    minify: minimist(process.argv.slice(2)).release,
});

gulp.task('default', callback => runSequence(
    'gulp-simple-clean',
    'gulp-simple-build',
    callback
));

gulp.task('watch', callback => runSequence(
    'gulp-simple-clean',
    'gulp-simple-build',
    'gulp-simple-watch',
    callback
));

```