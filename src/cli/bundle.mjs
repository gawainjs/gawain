import { promises as fs } from 'fs';
import path from 'path';

import rollup from 'rollup';

export default async function bundle(input, bundlePath) {
    const bundle = await rollup.rollup({ input });
    const { output } = await bundle.generate({ format: 'esm' });
    const chunks = output.filter(chunkOrAsset => chunkOrAsset.type === 'chunk');
    await Promise.all(chunks.map(async chunk => {
        const fileName = chunk.isEntry ? 'entrypoint.js' : chunk.fileName;
        await fs.writeFile(path.join(bundlePath, fileName), chunk.code);
    }));
}
