import { TypeOrmModuleOptions } from '@nestjs/typeorm'

try {
  process.loadEnvFile()
} catch {}

export const dataSourceConfig: TypeOrmModuleOptions = {
  type: 'postgres',

  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: 'kyunggi',

  entities: [__dirname + '/entity/*.entity{.ts,.js}'],
  logging: true,

  synchronize: process.env.MIGRATE_DB === '1',
}
