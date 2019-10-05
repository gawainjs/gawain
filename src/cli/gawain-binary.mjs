import { promises as fs, createWriteStream } from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import path from 'path';

import makeDir from 'make-dir';
import request from 'request';
import unzipper from 'unzipper';

const pipelineAsync = promisify(pipeline);

const gawainBinaryNames = {
    macos: 'gawain.app',
    windows: 'gawain.exe',
};

const zipMap = {
    macos: true,
    windows: false,
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
    if (zipMap[platform]) {
        await pipelineAsync(
            request(downloadUrl),
            unzipper.Extract({ path: installDirectory }),
        );
    } else {
        await pipelineAsync(
            request(downloadUrl),
            createWriteStream(installPath),
        );
    }
}

/**
 * @param platform {'macos' | 'windows'}
 * @param version {string | undefined}
*/
function getGawainBinaryDownloadUrl(platform, version) {
    return getGawainBinaryDownloadUrlPrefix(version) + gawainBinaryNames[platform] + (zipMap[platform] ? '.zip' : '');
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
