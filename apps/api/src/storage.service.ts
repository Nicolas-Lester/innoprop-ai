import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_KEY || ''
    );
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const fileName = `${Date.now()}-${file.originalname}`;
    
    const { data, error } = await this.supabase.storage
      .from('ticket-images') // El nombre del bucket que creaste
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) throw error;

    // Generamos la URL pública
    const { data: { publicUrl } } = this.supabase.storage
      .from('ticket-images')
      .getPublicUrl(fileName);

    return publicUrl;
  }
}