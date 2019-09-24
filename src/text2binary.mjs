/**
 * @param qjscOutput {string}
 * @returns {Uint8Array}
*/
export default function text2binary(qjscOutput) {
    const [, binaryText] = /\{((?:.|\r|\n)+?)\}/.exec(qjscOutput);
    return new Uint8Array(
        binaryText
            .split(',')
            .filter(text => !!text.trim())
            .map(text => parseInt(text.trim()))
    );
}
