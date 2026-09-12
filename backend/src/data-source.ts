import 'dotenv/config';
import { DataSource } from 'typeorm';

/**
 * DataSource para el CLI de TypeORM (generar/correr migraciones) y para
 * aplicarlas en el arranque de produccion (ver migration:run:prod).
 * La app en si arranca con TypeOrmModule.forRootAsync (app.module.ts).
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'app_calculos',
  password: process.env.DB_PASSWORD ?? 'app_calculos',
  database: process.env.DB_DATABASE ?? 'app_calculos',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});
