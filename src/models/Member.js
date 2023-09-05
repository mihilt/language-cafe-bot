import Sequelize from 'sequelize';
import sequelize from '../db/sqliteInstance.js';

export default sequelize.define('member', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
});
