import Sequelize from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  host: 'localhost',

  storage: './src/db/data/database.sqlite',
  logging: process.env.NODE_ENV !== 'production',
});

export default sequelize;
