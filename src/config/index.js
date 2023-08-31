import { readFile } from 'node:fs/promises';

const configUrl = process.env.NODE_ENV === 'production' ? './config_pro.json' : './config_dev.json';

const fileUrl = new URL(configUrl, import.meta.url);

export default JSON.parse(await readFile(fileUrl, 'utf8'));
