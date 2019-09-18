/**
 * @param qjscOutput {string}
 * @returns {Uint8Array}
*/
export default function text2bytes(qjscOutput) {
    const [, bytesText] = /\{((?:.|\r|\n)+?)\}/.exec(qjscOutput);
    return new Uint8Array(
        bytesText
            .split(',')
            .filter(text => !!text.trim())
            .map(text => parseInt(text.trim()))
    );
}
