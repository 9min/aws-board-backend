export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  jwt: {
    secret: process.env.JWT_SECRET ?? '',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    region: process.env.AWS_REGION ?? 'ap-northeast-2',
    s3Bucket: process.env.AWS_S3_BUCKET ?? '',
  },
  admin: {
    emails: process.env.ADMIN_EMAILS ?? '',
  },
  database: {
    url: process.env.DATABASE_URL ?? '',
  },
});
