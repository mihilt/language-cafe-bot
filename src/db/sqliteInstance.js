import Sequelize from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  host: 'localhost',

  storage: './src/db/data/database.sqlite',
  logging: (msg) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(msg);
    }
  },
});

export default sequelize;
