export interface AppConfig {
  env: string;
  port: number;
  databaseUrl: string;
  dbSynchronize: boolean;
  jwtSecret: string;
  jwtExpiresIn: string;
}

export default (): { app: AppConfig } => ({
  app: {
    env: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3000', 10),
    databaseUrl:
      process.env.DATABASE_URL ?? 'postgres://farmreturn:farmreturn@localhost:5432/farmreturn',
    dbSynchronize: process.env.DB_SYNCHRONIZE === 'true',
    jwtSecret: process.env.JWT_SECRET ?? 'change-me-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
});
