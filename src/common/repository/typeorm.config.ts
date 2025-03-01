import { TypeOrmModuleOptions } from '@nestjs/typeorm'

process.loadEnvFile()

export const dataSourceConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  url: process.env.POSTGRES_URI,

  entities: [__dirname + '/entity/*.entity{.ts,.js}'],
  logging: true,

  synchronize: process.env.MIGRATE_DB === '1',
}
