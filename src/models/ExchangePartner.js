import Sequelize from 'sequelize';
import sequelize from '../db/sqliteInstance.js';

export default sequelize.define('exchangePartner', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  targetLanguage: {
    type: Sequelize.STRING,
    required: true,
  },
  offerLanguage: {
    type: Sequelize.STRING,
    required: true,
  },
  introduction: {
    type: Sequelize.STRING,
    required: true,
  },
});
