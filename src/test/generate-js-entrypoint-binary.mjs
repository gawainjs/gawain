import { dirname, resolve } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import text2binary from '../text2binary.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const entrypointPath = resolve(__dirname, './generated/js-entrypoint.c');
const entrypointBinaryPath = resolve(__dirname, '../../tmp/fixture/zip/entrypoint');
const entrypointBinary = text2binary(readFileSync(entrypointPath, 'utf-8'));
writeFileSync(entrypointBinaryPath, entrypointBinary);
