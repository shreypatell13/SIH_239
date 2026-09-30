const fs = require('fs');
const zlib = require('zlib');

const files = [
  'demo-st-caste-certificate.pdf',
  'demo-income-certificate.pdf'
];

for (const file of files) {
  const buf = fs.readFileSync('tests/fixtures/documents/' + file);
  const str = buf.toString('latin1');
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  console.log('====================================================');
  console.log('FILE:', file);
  console.log('====================================================');
  while ((match = streamRegex.exec(str)) !== null) {
    const raw = Buffer.from(match[1], 'latin1');
    try {
      const text = zlib.inflateSync(raw).toString('utf8');
      const tmRegex = /1 0 0 1 ([\d\.]+) ([\d\.]+) Tm[\s\S]*?\[<(.*?)>\]TJ/g;
      let tmatch;
      while ((tmatch = tmRegex.exec(text)) !== null) {
        const x = parseFloat(tmatch[1]);
        const y = parseFloat(tmatch[2]);
        const hex = tmatch[3];
        const strVal = Buffer.from(hex, 'hex').toString('utf8');
        const normX = Number((x / 595).toFixed(4));
        const normY = Number(((842 - y) / 842).toFixed(4));
        console.log(`  TEXT [${normX}, ${normY}] (x=${x}, y=${y}): "${strVal}"`);
      }
      const reRegex = /([\d\.]+) ([\d\.]+) ([\d\.]+) ([\d\.]+) re/g;
      let rmatch;
      while ((rmatch = reRegex.exec(text)) !== null) {
        const rx = parseFloat(rmatch[1]);
        const ry = parseFloat(rmatch[2]);
        const rw = parseFloat(rmatch[3]);
        const rh = parseFloat(rmatch[4]);
        const normRX = Number((rx / 595).toFixed(4));
        const normRY = Number(((842 - (ry + rh)) / 842).toFixed(4));
        const normRW = Number((rw / 595).toFixed(4));
        const normRH = Number((rh / 842).toFixed(4));
        console.log(`  RECT [normX=${normRX}, normY=${normRY}, normW=${normRW}, normH=${normRH}] (x=${rx}, y=${ry}, w=${rw}, h=${rh})`);
      }
    } catch (e) {}
  }
}
