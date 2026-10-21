import { readFile, stat } from 'node:fs/promises';
const path = new URL('../media/portal-walkthrough-audio.mp4', import.meta.url);
const bytes = await readFile(path);
if (!bytes.subarray(0, 32).includes(Buffer.from('ftyp'))) throw new Error('Walkthrough is not an MP4');
if (!bytes.includes(Buffer.from('soun'))) throw new Error('Walkthrough is missing its audio track');
if (!bytes.includes(Buffer.from('vide'))) throw new Error('Walkthrough is missing its video track');
if ((await stat(path)).size > 3000000) throw new Error('Walkthrough exceeds the 3 MB video budget');
console.log('Video and audio tracks verified:', bytes.length, 'bytes');
