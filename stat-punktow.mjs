
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as process from 'node:process';

let globalOutput = [['Plik', 'Liczba pikseli', 'Srednia']];

async function prompt() {
    let l = '';
    process.stdin.setEncoding('utf8');
    do {
        process.stdin.pause();
        let v = process.stdin.read();
        if (v === null) {
            await new Promise(resolve => setTimeout(resolve, 100));
        } else {
            l += v;
        }
    } while (l.indexOf('\n') < 0 && l.indexOf('\r') < 0);
    return l;
}

function calcPoint(out, arr, width, height, startX, startY, black, avgCount)
{
    let stack = [startX, startY];
    let values = [];
    while (stack.length) {
        let y = stack.pop();
        let x = stack.pop();
        let color = arr[width * y + x];
        if (color <= black || color === undefined) continue;
        values.push(arr[width * y + x]);
        arr[width * y + x] = 0;
        stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
    }
    if (values.length < avgCount) {
        return;
    }
    values.sort((a, b) => b - a);
    let avg = values.slice(0, avgCount).reduce((p, x) => p + x, 0) / avgCount;
    out.push([values.length, avg]);
}


function liczStat(inputFile, outputFile, avgCount) {

    let out = [];
    let csv = fs.readFileSync(inputFile, 'utf8');

    let tab = csv
        .split(/\r?\n/)
        .filter(line => line)
        .filter((line, index) => index > 0)
        .map(line => line
            .split(',')
            .filter((cell, index) => index > 1)
            .map(cell => parseInt(cell.trim()))
        );

    let height = tab.length;
    let width = tab.reduce((p, row) => Math.max(p, row.length), 0);

    let black = tab.reduce((p, row) => Math.min(p, row.reduce((p2, cell) => Math.min(p2, cell), Infinity)), Infinity);

    let arr = new Uint32Array(width * height);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            arr[width * y + x] = tab[y][x];
        }
    }

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (arr[width * y + x] > black) {
                calcPoint(out, arr, width, height, x, y, black, avgCount);
            }
        }
    }

    for (let x of out) {
        globalOutput.push([path.basename(inputFile), ...x]);
    }

    /*out = out
        .map(row => row.join(';'))
        .join('\r\n');
    fs.writeFileSync(outputFile, out, 'utf-8');*/
}

function toCSV(file, data) {
    let out = data
        .map(row => row.map(x => typeof(x) == 'string' ? x : x.toString().replace('.', ',')).join(';'))
        .join('\r\n');
    fs.writeFileSync(file, out, 'utf-8');
}

async function main() {
    console.log('Pikseli do średniej:');
    let avgCount = parseInt((await prompt()).trim());

    for (let f of fs.readdirSync('in')) {
        if (!f.startsWith('.')) {
            liczStat(`in/${f}`, `out/${f}`, avgCount);
            console.log(f);
        }
    }

    toCSV('wynik.csv', globalOutput);
}


main();
