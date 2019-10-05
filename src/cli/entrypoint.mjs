#!/usr/bin/env node --experimental-modules

import yargs from 'yargs';

yargs
    .scriptName('gawain')
    .usage('Usage: $0 <cmd> [args]')
    .command('build [entrypoint]', 'build gawain application', yargs => {
        yargs.positional('entrypoint', {
            type: 'string',
            default: './src',
            describe: 'entrypoint module of application'
        });
    }, async ({entrypoint, ...argv}) => {
        // TODO
    })
    .demandCommand(1)
    .strict()
    .help()
    .argv;
