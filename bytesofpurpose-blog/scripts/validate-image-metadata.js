#!/usr/bin/env node

/**
 * validate-image-metadata.js: no picture on the site carries hidden data.
 *
 * A picture file can carry more than its pixels: the camera that took it, the date and time, the
 * GPS place, the app that made it, or free text. A macOS screenshot or a phone photo usually does;
 * anyone can read it back out of the published file. This check fails on any committed picture
 * that carries it, and --fix takes it out in place, leaving the pixels byte for byte the same.
 *
 * Read from the file's own bytes, with no image library:
 *   PNG   the text chunks (tEXt, zTXt, iTXt), the Exif chunk (eXIf) and the time stamp (tIME).
 *   JPEG  the APP1 segment (Exif, which holds camera, date and GPS place, or XMP) and APP13 (IPTC).
 * The size and colour chunks a picture needs to show (IHDR, PLTE, IDAT, gAMA, sRGB, pHYs...) stay.
 * Other formats (SVG, GIF, WebP) are not read.
 *
 * Ported from social-presence-hub's scripts/lib/picture-hidden-data.mjs (backlog #270), which
 * checks the LinkedIn pictures the same way.
 *
 * One greppable line per picture:
 *
 *   ev=image_hidden_data file=<path> found="<what>" msg="..."
 *
 * Usage:  node scripts/validate-image-metadata.js [--staged] [--fix] [file-or-dir ...]
 *           (default: every committed picture in the repo; --staged: only staged ones)
 *         node scripts/validate-image-metadata.js --selftest
 * Exit:   1 when a picture carries hidden data (and --fix was not given), 0 otherwise.
 *
 * Plain CommonJS so it runs on whatever node the pre-commit hook finds (v18 included).
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PNG_HIDDEN = { tEXt: 'text', zTXt: 'text', iTXt: 'text', eXIf: 'Exif (camera, date, place)', tIME: 'a time stamp' };
const JPEG_HIDDEN = { 0xe1: 'Exif or XMP (camera, date, place)', 0xed: 'IPTC (captions, names, place)' };
const PICTURE = /\.(png|jpe?g)$/i;

function pngChunks(b) {
  const out = [];
  let i = 8;
  while (i + 12 <= b.length) {
    const len = b.readUInt32BE(i);
    const type = b.toString('ascii', i + 4, i + 8);
    const end = i + 12 + len;
    if (end > b.length) break;
    out.push({ type, start: i, end });
    i = end;
    if (type === 'IEND') break;
  }
  return out;
}

/** JPEG segments before the image data starts (SOS), each { marker, start, end }. */
function jpegSegments(b) {
  const out = [];
  let i = 2;
  while (i + 4 <= b.length && b[i] === 0xff) {
    const marker = b[i + 1];
    if (marker === 0xda) break;
    const end = i + 2 + b.readUInt16BE(i + 2);
    out.push({ marker, start: i, end });
    i = end;
  }
  return { segments: out, rest: i };
}

const isPng = (b) => b.length >= 8 && b.subarray(0, 8).equals(PNG_SIG);
const isJpeg = (b) => b.length >= 2 && b[0] === 0xff && b[1] === 0xd8;

/** What hidden data the picture carries, in plain words; [] when there is none. */
function hiddenData(bytes) {
  const b = Buffer.from(bytes);
  const found = new Set();
  if (isPng(b)) {
    for (const c of pngChunks(b)) if (PNG_HIDDEN[c.type]) found.add(PNG_HIDDEN[c.type]);
  } else if (isJpeg(b)) {
    for (const s of jpegSegments(b).segments) if (JPEG_HIDDEN[s.marker]) found.add(JPEG_HIDDEN[s.marker]);
  }
  return [...found];
}

/** The same picture with that hidden data taken out; the pixels are byte-for-byte the same. */
function stripHiddenData(bytes) {
  const b = Buffer.from(bytes);
  if (isPng(b)) {
    const keep = pngChunks(b).filter((c) => !PNG_HIDDEN[c.type]).map((c) => b.subarray(c.start, c.end));
    return Buffer.concat([PNG_SIG, ...keep]);
  }
  if (isJpeg(b)) {
    const { segments, rest } = jpegSegments(b);
    const keep = segments.filter((s) => !JPEG_HIDDEN[s.marker]).map((s) => b.subarray(s.start, s.end));
    return Buffer.concat([b.subarray(0, 2), ...keep, b.subarray(rest)]);
  }
  return b;
}

function pngChunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'ascii');
  return Buffer.concat([head, data, Buffer.alloc(4)]); // the CRC is not checked here
}

function selftest() {
  let bad = 0;
  const check = (what, ok) => {
    if (!ok) {
      bad++;
      console.log(`selftest FAIL: ${what}`);
    }
  };
  const ihdr = pngChunk('IHDR', Buffer.alloc(13));
  const idat = pngChunk('IDAT', Buffer.from([1, 2, 3]));
  const iend = pngChunk('IEND', Buffer.alloc(0));
  const clean = Buffer.concat([PNG_SIG, ihdr, idat, iend]);
  const dirty = Buffer.concat([PNG_SIG, ihdr, pngChunk('tEXt', Buffer.from('Software\0Shot')), pngChunk('tIME', Buffer.alloc(7)), idat, iend]);
  check('a clean PNG carries nothing', hiddenData(clean).length === 0);
  check('a PNG with text and a time stamp is found', hiddenData(dirty).join(',') === 'text,a time stamp');
  check('stripping a PNG leaves the clean one', stripHiddenData(dirty).equals(clean));
  const seg = (marker, data) => {
    const h = Buffer.from([0xff, marker, 0, 0]);
    h.writeUInt16BE(data.length + 2, 2);
    return Buffer.concat([h, data]);
  };
  const soi = Buffer.from([0xff, 0xd8]);
  const app0 = seg(0xe0, Buffer.from('JFIF\0'));
  const scan = Buffer.from([0xff, 0xda, 0, 2, 9, 9, 0xff, 0xd9]);
  const jclean = Buffer.concat([soi, app0, scan]);
  const jdirty = Buffer.concat([soi, app0, seg(0xe1, Buffer.from('Exif\0\0GPS')), scan]);
  check('a JPEG with Exif is found', hiddenData(jdirty).length === 1);
  check('stripping a JPEG leaves the clean one', stripHiddenData(jdirty).equals(jclean));
  check('a clean JPEG carries nothing', hiddenData(jclean).length === 0);
  console.log(bad ? `selftest: ${bad} failure(s)` : 'selftest: 6 cases ok');
  return bad ? 1 : 0;
}

function gitFiles(repo, args) {
  return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).split('\0').filter(Boolean);
}

function walk(target, acc) {
  const st = fs.statSync(target);
  if (st.isDirectory()) {
    for (const e of fs.readdirSync(target)) if (e !== 'node_modules' && e !== '.git' && e !== 'build') walk(path.join(target, e), acc);
  } else if (PICTURE.test(target)) acc.push(target);
}

function main(argv) {
  if (argv.includes('--selftest')) return selftest();
  const fix = argv.includes('--fix');
  const repo = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: __dirname, encoding: 'utf8' }).trim();
  const args = argv.filter((a) => !a.startsWith('--'));
  let files;
  if (args.length) {
    files = [];
    for (const a of args) walk(path.resolve(a), files);
  } else if (argv.includes('--staged')) {
    files = gitFiles(repo, ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z']).filter((f) => PICTURE.test(f)).map((f) => path.join(repo, f));
  } else {
    files = gitFiles(repo, ['ls-files', '-z']).filter((f) => PICTURE.test(f)).map((f) => path.join(repo, f));
  }
  let found = 0;
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const bytes = fs.readFileSync(file);
    const hidden = hiddenData(bytes);
    if (!hidden.length) continue;
    found++;
    const rel = path.relative(repo, file);
    if (fix) {
      fs.writeFileSync(file, stripHiddenData(bytes));
      console.log(`ev=image_hidden_data_stripped file=${rel} found="${hidden.join(', ')}"`);
    } else {
      console.log(`ev=image_hidden_data file=${rel} found="${hidden.join(', ')}" msg="it carries hidden data a reader can pull out. Take it out with: make image-strip FILE=${rel}"`);
    }
  }
  if (found && !fix) {
    console.log(`ev=image_hidden_data_summary pictures=${files.length} with_hidden_data=${found}`);
    return 1;
  }
  console.log(`ev=image_hidden_data_ok pictures=${files.length}${fix ? ` stripped=${found}` : ''}`);
  return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));

module.exports = { hiddenData, stripHiddenData };
