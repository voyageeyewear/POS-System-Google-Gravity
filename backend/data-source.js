require('reflect-metadata');
require('dotenv').config();
const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: true, // Auto-create tables (enabled for initial setup)
  logging: process.env.NODE_ENV !== 'production', // Enable logging in development
  entities: ['entities/*.js'],
  migrations: ['migrations/*.js'],
  subscribers: [],
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

module.exports = { AppDataSource };

