import { promises as fs } from 'fs';
import path from 'path';

import rollup from 'rollup';
import nodeResolvePlugin from 'rollup-plugin-node-resolve';
import commonjsPlugin from 'rollup-plugin-commonjs';

export default async function bundle(input, bundlePath) {
    const bundle = await rollup.rollup({ input, plugins, external: gawainBuiltins });
    const { output } = await bundle.generate({ format: 'esm', plugins });
    const chunks = output.filter(chunkOrAsset => chunkOrAsset.type === 'chunk');
    await Promise.all(chunks.map(async chunk => {
        const fileName = chunk.isEntry ? 'entrypoint.js' : chunk.fileName;
        await fs.writeFile(path.join(bundlePath, fileName), chunk.code);
    }));
}

const gawainBuiltins = [
    'sdl.so',
];

const plugins = [
    nodeResolvePlugin({
        mainFields: ['gawainMain', 'module', 'main'],
        extensions: ['.mjs', '.cjs', '.js', '.json'],
        dedupe: ['gawain'],
    }),
    commonjsPlugin({
        include: /node_modules/,
        extensions: ['.js', '.cjs'],
    }),
];
