import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'app_calculos',
  password: process.env.DB_PASSWORD ?? 'app_calculos',
  database: process.env.DB_DATABASE ?? 'app_calculos',
  ssl: process.env.DB_SSL === 'true',
}));
