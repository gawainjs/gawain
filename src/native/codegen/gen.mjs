// converts from:
//
//     {|
//         function capitalize(v) {
//             return v[0].toUpperCase() + v.substr(1);
//         }
//     |}
//     #include <stdio.h>
//     int main() {
//         | for (let a of ["apple", "banana", "cherry"]) {
//             printf("<|capitalize(a)|>");
//             printf("\n");
//         | }
//         | console.log("return 0;");
//     }
//
// to:
//
//     #line 1 "input.c.in"
//     #line 6
//     #include <stdio.h>
//     #line 7
//     int main() {
//     #line 8
//     #line 9
//             printf("Apple");
//     #line 10
//             printf("\n");
//     #line 11
//     #line 9
//             printf("Banana\n");
//     #line 10
//             printf("\n");
//     #line 11
//     #line 9
//             printf("Cherry\n");
//     #line 10
//             printf("\n");
//     #line 11
//     #line 12
//     return 0;
//     #line 13
//     }
//
// three kinds of JS blocks are supported: `|` (linewise statements,
// should only be preceded with spaces, can't be followed by `|` or `=`),
// `{| ... |}` (multi-line statements, `{|` and `|}` should be their own lines)
// and `<| ... |>` (expressions, should fit in a single line).
// note that there is no automatic escape for `<|...|>`.
//
// you can't omit braces around C codes right after `if`, `for` or other
// JS statements that expect nested statement(s), this is actively enforced.
//
// `#line` directive is automatically generated to quickly determine
// the originating input line on error. it gets generated for each `|` lines
// and the beginning of `{| ... |}` blocks.
//
// the resulting code should be an ES6 module, but as the default QuickJS
// interpreter doesn't support module eval it gets generated and invoked
// separately. each non-JS line and generated `#line` directive is converted
// to `console.log` calls (which the intepreter exposes by default).

import * as std from "std";

function error(s) {
    std.err.puts(s);
    std.exit(1);
}

let inputFile = scriptArgs[1];
if (!inputFile) {
    error(`Usage: qjs -m ${scriptArgs[0]} <input> > <output>\n`);
}

function escapeJs(s) {
    return "`" + s.replace(/[`$\\]/g, m => "\\" + m[0]) + "`";
}

function lineDirective(lineno) {
    let line = '#line ' + lineno;
    if (lineno === 1) { // should be the first line ever printed
        line += ' "' + inputFile + '"';
    }
    // `let {} = {};` doesn't have any effect, except that it can't be used
    // in the single statement context so the mistake can be quickly caught.
    return `let {} = {}; console.log(${escapeJs(line)}); `;
}

let f = std.open(inputFile, "rb");
let inBlock = false;
let line;
for (let lineno = 1; (line = f.getline()) !== null; ++lineno) {
    let trimmed = line.trim();
    if (trimmed === '{|' && !inBlock) {
        inBlock = true;
        console.log(lineDirective(lineno));
    } else if (trimmed === '|}' && inBlock) {
        inBlock = false;
        console.log();
    } else if (trimmed.match(/\{\||\|\}/)) {
        error(`\`{|\` or \`|}\` can't be used except as the JS block delimiter in line ${lineno}`);
    } else if (trimmed[0] === '|' && !(trimmed[1] == '|' || trimmed[1] == '=')) {
        console.log(lineDirective(lineno) + trimmed.substr(1));
    } else if (inBlock) {
        console.log(line);
    } else {
        let parts = line.split(/(<\||\|>)/g);
        if (parts.length % 4 !== 1) error(`unclosed \`<|\` and \`|>\` pairs in line ${lineno}`);
        let expr = [];
        for (let i = 0; i < parts.length - 1; i += 2) {
            let inExpr = i % 4 != 0;
            if (parts[i + 1] !== (inExpr ? '|>' : '<|')) {
                error(`mismatching \`<|\` and \`|>\` pairs in line ${lineno}`);
            }
            if (inExpr) {
                expr.push('(' + parts[i] + ')');
            } else {
                expr.push(escapeJs(parts[i]));
            }
        }
        expr.push(escapeJs(parts[parts.length - 1]));
        console.log(lineDirective(lineno) + 'console.log(' + expr.join(' + ') + ');');
    }
}

