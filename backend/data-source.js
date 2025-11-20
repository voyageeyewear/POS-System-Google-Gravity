require('reflect-metadata');
require('dotenv').config();
const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'database.sqlite',
  synchronize: true, // Auto-create tables (enabled for initial setup)
  logging: true, // Enable logging to see what's happening
  entities: ['entities/*.js'],
  migrations: ['migrations/*.js'],
  subscribers: [],
});

module.exports = { AppDataSource };

