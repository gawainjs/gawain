import {
    promises as fs,
    createReadStream,
    createWriteStream,
} from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import os from 'os';
import path from 'path';

import cpx from 'cpx';
import tar from 'tar';
import makeDir from 'make-dir';
import request from 'request';

const pipelineAsync = promisify(pipeline);
const copyAsync = promisify(cpx.copy);

const gawainBinaryNames = {
    macos: 'gawain.app.tar',
    windows: 'gawain.exe',
};

/**
 * @param tmpDir {string}
 * @param platform {'macos' | 'windows'}
 * @param version {string | undefined}
*/
export async function checkGawainBinaryAlreadyExists(tmpDir, platform, version) {
    try {
        await fs.access(getGawainBinaryInstallPath(tmpDir, platform, version));
        return true;
    } catch {
        return false;
    }
}

/**
 * @param tmpDir {string}
 * @param platform {'macos' | 'windows'}
 * @param version {string | undefined}
*/
export async function installGawainBinary(tmpDir, platform, version) {
    const downloadUrl = getGawainBinaryDownloadUrl(platform, version);
    const installDirectory = getGawainBinaryInstallDirectory(tmpDir, version);
    const installPath = getGawainBinaryInstallPath(tmpDir, platform, version);
    await makeDir(installDirectory);
    await pipelineAsync(
        request(downloadUrl),
        createWriteStream(installPath),
    );
}

/**
 * @param distDir {string}
 * @param tmpDir {string}
 * @param platform {'macos' | 'windows'}
 * @param version {string | undefined}
*/
export async function publishGawainBinary(distDir, tmpDir, platform, version) {
    const binaryName = gawainBinaryNames[platform];
    const installPath = getGawainBinaryInstallPath(tmpDir, platform, version);
    const targetPath = path.join(distDir, binaryName);
    const archivePath = path.join(tmpDir, 'archive.zip');
    await copyAsync(installPath, distDir, { clean: true });
    if (platform === 'macos') {
        await tar.replace({
            file: targetPath,
            cwd: tmpDir,
            prefix: 'gawain.app/Contents/Resources',
        }, ['archive.zip']);
        if (os.platform() !== 'win32') {
            await tar.extract({
                file: targetPath,
                cwd: distDir,
            });
        }
    } else { // windows
        await pipelineAsync(
            createReadStream(archivePath),
            createWriteStream(targetPath, { flags: 'a' }),
        );
    }
}

/**
 * @param platform {'macos' | 'windows'}
 * @param version {string | undefined}
*/
function getGawainBinaryDownloadUrl(platform, version) {
    return getGawainBinaryDownloadUrlPrefix(version) + gawainBinaryNames[platform];
}

/**
 * @param tmpDir {string}
 * @param platform {'macos' | 'windows'}
 * @param version {string | undefined}
*/
function getGawainBinaryInstallPath(tmpDir, platform, version) {
    const installDirectory = getGawainBinaryInstallDirectory(tmpDir, version);
    return path.join(installDirectory, gawainBinaryNames[platform]);
}

/**
 * @param version {string | undefined}
*/
function getGawainBinaryDownloadUrlPrefix(version) {
    if (!version) return 'https://github.com/gawainjs/gawain/releases/latest/download/';
    return `https://github.com/gawainjs/gawain/releases/download/${version}/`;
}

/**
 * @param tmpDir {string}
 * @param version {string | undefined}
*/
function getGawainBinaryInstallDirectory(tmpDir, version) {
    if (!version) return path.join(tmpDir, 'gawain-binary', 'latest');
    return path.join(tmpDir, 'gawain-binary', version);
}
