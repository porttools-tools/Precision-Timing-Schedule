'use strict';
/* Regenerates ../delay-codes-data.js from ../Delay Code Summary.csv (run: node scripts/gen-delay-codes.js).
   If Node is unavailable, use Python: py -3 -c "import csv,json; ..." with encoding cp1252 on the CSV. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const csvPath = path.join(root, 'Delay Code Summary.csv');
const outPath = path.join(root, 'delay-codes-data.js');
const content = fs.readFileSync(csvPath, 'utf8');
const lines = content.split(/\r?\n/).filter(function (l) {
  return l.trim();
});

function parseLine(line) {
  var row = [];
  var i = 0;
  var field = '';
  var inQ = false;
  while (i < line.length) {
    var c = line[i];
    if (inQ) {
      if (c === '"') inQ = false;
      else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') {
        row.push(field);
        field = '';
      } else field += c;
    }
    i++;
  }
  row.push(field);
  return row;
}

var codes = [];
for (var li = 0; li < lines.length; li++) {
  var parts = parseLine(lines[li]);
  if (parts.length >= 3) {
    codes.push({
      code: parts[0].trim(),
      description: parts[1].trim(),
      category: parts[2].trim()
    });
  }
}

fs.writeFileSync(outPath, 'window.DELAY_CODES = ' + JSON.stringify(codes) + ';\n');
console.log('Wrote', codes.length, 'codes to delay-codes-data.js');
