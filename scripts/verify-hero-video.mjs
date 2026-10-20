import { readFile, stat } from 'node:fs/promises';
const path = new URL('../media/hero-video.mp4', import.meta.url);
const bytes = await readFile(path);
if (!bytes.subarray(0, 32).includes(Buffer.from('ftyp'))) throw new Error('Hero video is not an MP4');
if ((await stat(path)).size > 2000000) throw new Error('Hero exceeds the 2 MB background-video budget');
console.log('Local hero MP4 verified:', bytes.length, 'bytes');
