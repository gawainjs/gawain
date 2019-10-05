#!/usr/bin/env node --experimental-modules

import path from 'path';
import { promises as fs } from 'fs';

import yargs from 'yargs';
import makeDir from 'make-dir';
import qjsc from 'quickjs-static/qjsc.js';

import text2binary from '../text2binary.mjs';
import {
    checkGawainBinaryAlreadyExists,
    installGawainBinary,
} from './gawain-binary.mjs';

yargs
    .scriptName('gawain')
    .usage('Usage: $0 <cmd> [args]')
    .command('build [entrypoint]', 'build gawain application', yargs => {
        yargs.positional('entrypoint', {
            type: 'string',
            default: './src/index.js',
            describe: 'entrypoint module of application'
        });
        yargs.option('t', {
            alias: 'targets',
            type: 'array',
            choices: ['macos', 'windows'],
            default: ['macos', 'windows'],
            describe: 'target platforms',
        });
        yargs.option('o', {
            alias: 'out',
            type: 'string',
            default: './dist',
            describe: 'out directory',
        });
        yargs.option('tmp', {
            type: 'string',
            default: './tmp',
            describe: 'temporary directory',
        });
        yargs.option('binary-version', {
            type: 'string',
            describe: 'gawain binary version',
        });
    }, async ({ entrypoint, targets, out, tmp, binaryVersion }) => {
        const qjscOutPath = path.join(tmp, 'entrypoint.c');
        const qjscOutBinaryPath = path.join(tmp, 'entrypoint');
        await Promise.all([ makeDir(out), makeDir(tmp) ]);
        await step(1, 'compile user code with quickjs', async () => {
            await qjsc([ '-c', '-m', '-M', 'sdl.so,sdl', '-o', qjscOutPath, entrypoint ]);
        }, ({ stderr }) => {
            process.stderr.write(stderr);
        });
        await step(2, 'make user code binary from text', async () => {
            const qjscOutBinary = text2binary(await fs.readFile(qjscOutPath, 'utf-8'));
            await fs.writeFile(qjscOutBinaryPath, qjscOutBinary);
        });
        await step(3, 'download gawain binaries', async () => {
            await Promise.all(targets.map(async targetPlatform => {
                if (await checkGawainBinaryAlreadyExists(tmp, targetPlatform, binaryVersion)) return;
                await installGawainBinary(tmp, targetPlatform, binaryVersion);
            }));
        });
        await step(4, 'merge results on dist folder', async () => {
            // TODO
        });
    })
    .demandCommand(1)
    .strict()
    .help()
    .wrap(120)
    .argv;

async function step(step, message, task, errorHandler) {
    let dotInterval;
    try {
        process.stderr.write(`step ${step}: ${message}..`);
        dotInterval = setInterval(() => process.stderr.write('.'), 500);
        await task();
        process.stderr.write(' ok');
        console.error('');
    } catch (err) {
        process.stderr.write(' fail');
        console.error('');
        if (errorHandler) errorHandler(err);
        else console.error(err);
        process.exit(step);
    } finally {
        clearInterval(dotInterval);
    }
}
