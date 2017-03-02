'use strict';


const gulp = require('gulp');
const watch = require('gulp-watch');
const runSequence = require('run-sequence');

const lazypipe = require('lazypipe');
const filter = require('gulp-filter');
const empty = require('gulp-empty-pipe');
const plumber = require('gulp-plumber');

const fs = require('fs');
const path = require('path');
const del = require('del');

const logger = require('gulplog');


module.exports = (config, options) => {
    config.clean = config.clean || config.dest;
    options.prefix = options.prefix || 'gulp-simple-';


    function errorHandler(error) { logger.error(error.message) }

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
            .pipe(options.minify ? minify() : empty())
            .pipe(gulp.dest(dest));
    }


    Object.keys(config.types).forEach(typeName => {
        let type = config.types[typeName];
        type.src = path.resolve(config.src, type.src);
        type.dest = path.resolve(config.dest, type.dest || '');
        type.pipe = createPipe(type.pipe);
        type.minify = createPipe(type.minify);
    });

    config.types.etc = {
        src: [ path.resolve(config.src, '*/**') ].concat(Object.keys(config.types).map(typeName => '!' + path.resolve(config.src, config.types[typeName].src))),
        dest: config.dest,
        pipe: empty,
        minify: empty,
    };


    //=========================
    //  Gulp tasks
    //=========================

    Object.keys(config.types).forEach(typeName => {
        let type = config.types[typeName];
        gulp.task(options.prefix + typeName, () => executeGulpTask(type));
    });

    gulp.task(options.prefix + 'build', callback => runSequence(
        Object.keys(config.types).map(typeName => options.prefix + typeName),
        callback
    ));

    gulp.task(options.prefix + 'clean', callback => del(config.clean, callback));

    gulp.task(options.prefix + 'watch', callback => {
        Object.keys(config.types).forEach(typeName => {
            let type = config.types[typeName];
            watch(type.src, vinyl => {
                switch (vinyl.event) {
                    case 'add':
                    case 'change':
                        executeGulpTask(type, vinyl.path).on('end', () => logger.info(`File "${path.relative('.', vinyl.path)}": ${vinyl.event} as "${typeName}"`));
                        break;

                    case 'unlink':
                        logger.info(`Уou must restart gulp to delete file "${path.relative(config.src, vinyl.path)}"`);
                        break;
                }
            }).on('error', errorHandler);
        });
    });
};