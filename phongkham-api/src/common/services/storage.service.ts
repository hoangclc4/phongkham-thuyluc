import { Global, Injectable, Module } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';

@Injectable()
export class StorageService {
  private readonly s3 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  async uploadFile(
    entityType: string,
    entityId: string,
    buffer: Buffer,
    mimeType: string,
    ext: string,
  ): Promise<string> {
    const key = `${entityType}/${entityId}/${randomUUID()}.${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );

    return `${process.env.R2_PUBLIC_URL}/${key}`;
  }
}

@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
