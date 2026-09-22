import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import type { AppEnv } from '@client/infra/config/env.validation';
import { IMAGE_MAX_WIDTH, mediaFileName, mediaUrl, type MediaKind } from './domain/media-rules';

export interface StoredMedia {
  id: string;
  url: string;
}

/**
 * Media fayllarni diskka yozadi.
 *
 * Rasm HAR DOIM qayta kodlanadi (webp): shu bilan bir vaqtning oʻzida
 * hajm kichrayadi va yuklangan faylning ichidagi kutilmagan narsa
 * (EXIF, notoʻgʻri kengaytma ostidagi boshqa format) yoʻqoladi —
 * `sharp` oʻqiy olmasa fayl umuman saqlanmaydi.
 *
 * Video qayta kodlanmaydi (ffmpeg kerak boʻlardi); u shundayligicha
 * yoziladi, shuning uchun tur va hajm chegarasi undan oldin tekshiriladi.
 */
@Injectable()
export class MediaStorageService {
  private readonly logger = new Logger(MediaStorageService.name);
  private readonly root: string;

  constructor(config: ConfigService<AppEnv, true>) {
    this.root = config.get('MEDIA_ROOT', { infer: true });
  }

  async save(buffer: Buffer, kind: MediaKind): Promise<StoredMedia> {
    const id = randomUUID();
    const fileName = mediaFileName(id, kind);

    await mkdir(this.root, { recursive: true });

    if (kind === 'IMAGE') {
      const data = await sharp(buffer)
        .rotate()
        .resize({ width: IMAGE_MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      await writeFile(join(this.root, fileName), data);
    } else {
      await writeFile(join(this.root, fileName), buffer);
    }

    return { id, url: mediaUrl(fileName) };
  }

  /**
   * Faylni oʻchiradi. Xato JIM yutilmaydi, lekin chaqiruvchini ham
   * toʻxtatmaydi: bazadagi yozuv oʻchgan boʻlsa, diskda qolgan fayl
   * hech kimga koʻrinmaydi va uni keyin tozalash mumkin.
   */
  async remove(url: string): Promise<void> {
    const fileName = url.split('/').pop();
    if (!fileName) return;

    try {
      await unlink(join(this.root, fileName));
    } catch (error) {
      this.logger.warn({ err: error, url }, 'Media fayli oʻchmadi');
    }
  }
}
