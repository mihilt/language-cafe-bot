import Keyv from 'keyv';
import { KeyvFile } from 'keyv-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default new Keyv({
  store: new KeyvFile({
    filename: `${__dirname}/data/db.json`,
    writeDelay: 100, // ms, batch write to disk in a specific duration, enhance write performance.
    encode: JSON.stringify, // serialize function
    decode: JSON.parse, // deserialize function
  }),
});
