import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from './db/sqliteInstance.js';

sequelize.sync({ force: true });
sequelize.sync({ alter: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelsPath = path.join(__dirname, 'models');
const modelFiles = fs.readdirSync(modelsPath).filter((file) => file.endsWith('.js'));

// eslint-disable-next-line no-restricted-syntax
for (const file of modelFiles) {
  const filePath = path.join(modelsPath, file);

  (async () => {
    const model = (await import(filePath)).default;
    model.sync({ force: true });
    model.sync({ alter: true });
  })();
}
