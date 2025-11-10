require('reflect-metadata');
require('dotenv').config();
const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: process.env.NODE_ENV !== 'production', // Auto-create tables in development
  logging: process.env.NODE_ENV === 'development',
  entities: ['entities/*.js'],
  migrations: ['migrations/*.js'],
  subscribers: [],
});

module.exports = { AppDataSource };

