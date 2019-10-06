#!/usr/bin/env node --experimental-modules

import path from 'path';
import {
    promises as fs,
    createReadStream,
    createWriteStream,
} from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';

import yargs from 'yargs';
import makeDir from 'make-dir';
import archiver from 'archiver';
import qjsc from 'quickjs-static/qjsc.js';

import text2binary from '../text2binary.mjs';
import {
    checkGawainBinaryAlreadyExists,
    installGawainBinary,
    publishGawainBinary,
} from './gawain-binary.mjs';

const pipelineAsync = promisify(pipeline);

yargs
    .scriptName('gawain')
    .usage('Usage: $0 <cmd> [args]')
    .command('build <entrypoint>', 'build gawain application', yargs => {
        yargs.positional('entrypoint', {
            type: 'string',
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
        const archivePath = path.join(tmp, 'archive.zip');
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
        await step(3, 'zip user code', async () => {
            const archive = archiver('zip', { zlib: { level: 9 } });
            archive.append(createReadStream(qjscOutBinaryPath), { name: 'entrypoint' });
            archive.finalize();
            await pipelineAsync(
                archive,
                createWriteStream(archivePath),
            );
        });
        await step(4, 'download gawain binaries', async () => {
            await Promise.all(targets.map(async targetPlatform => {
                if (await checkGawainBinaryAlreadyExists(tmp, targetPlatform, binaryVersion)) return;
                await installGawainBinary(tmp, targetPlatform, binaryVersion);
            }));
        });
        await step(5, 'merge results on dist folder', async () => {
            await Promise.all(targets.map(async targetPlatform => {
                await publishGawainBinary(out, tmp, targetPlatform, binaryVersion);
            }));
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
