'use strict';


const gulp = require('gulp');
const watch = require('gulp-watch');
const runSequence = require('run-sequence');

const lazypipe = require('lazypipe');
const filter = require('gulp-filter');
const empty = require('gulp-empty-pipe');
const plumber = require('gulp-plumber');

const path = require('path');
const del = require('del');

const log = require('fancy-log');


let simple = {
    init: (config) => {
        const that = simple;

        that.config = JSON.parse(JSON.stringify(config));
        that.config.clean = that.config.clean || that.config.dest;


        function errorHandler(error) { log.error(error.message) }

        function createPipe(pipesRaw) {
            if (!pipesRaw || !pipesRaw.length) return empty;

            let result = lazypipe();
            pipesRaw.forEach(pipeRaw => {
                let pipeData = JSON.parse(JSON.stringify(pipeRaw));
                pipeData[0] = require(pipeData[0]);
                result = result.pipe.apply(result, pipeData);
            });
            return result;
        }

        function executeGulpTask({ src, dest, pipe, minify }, filePath) {
            return gulp.src(src, { dot: true })
                .pipe(filter(file => !filePath || file.path === filePath))
                .pipe(plumber({ errorHandler }))
                .pipe(pipe())
                .pipe(that.minify ? minify() : empty())
                .pipe(gulp.dest(dest));
        }


        Object.keys(that.config.types).forEach(typeName => {
            let type = that.config.types[typeName];
            type.src = path.resolve(that.config.src, type.src);
            type.dest = path.resolve(that.config.dest, type.dest || '');
            type.pipe = createPipe(type.pipe);
            type.minify = createPipe(type.minify);
        });

        that.config.types.etc = {
            src: [ path.resolve(that.config.src, '**/*') ].concat(Object.keys(that.config.types).map(typeName => '!' + path.resolve(that.config.src, that.config.types[typeName].src))),
            dest: that.config.dest,
            pipe: empty,
            minify: empty,
        };


        //=========================
        //  Gulp tasks
        //=========================

        Object.keys(that.config.types).forEach(typeName => {
            let type = that.config.types[typeName];
            that.pipes = [];
            gulp.task(that.prefix + typeName, () => {
               let pipe = executeGulpTask(type);
               that.pipes.push(pipe);
               return pipe;
            });
        });

        gulp.task(that.prefix + 'build', callback => runSequence(
            Object.keys(that.config.types).map(typeName => that.prefix + typeName),
            callback
        ));

        gulp.task(that.prefix + 'clean', callback => del(that.config.clean, callback));

        gulp.task(that.prefix + 'watch', callback => {
            Object.keys(that.config.types).forEach(typeName => {
                let type = that.config.types[typeName];
                watch(type.src, vinyl => {
                    switch (vinyl.event) {
                        case 'add':
                        case 'change':
                            executeGulpTask(type, that.incrementalWatch ? vinyl.path : null).on('end', () => {
                                log(`File "${path.relative('.', vinyl.path)}": ${vinyl.event} as "${typeName}"`);
                                that.onWatch();
                            });
                            break;

                        case 'unlink':
                            log(`Уou must restart gulp to delete file "${path.relative(that.config.src, vinyl.path)}"`);
                            break;
                    }
                }).on('error', errorHandler);
            });
        });
    },
    prefix: 'gulp-simple-',
    minify: false,
    onWatch: () => {},
    incrementalWatch: true,
}

module.exports = simple;