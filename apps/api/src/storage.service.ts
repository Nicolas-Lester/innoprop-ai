import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private supabase: SupabaseClient | null = null;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      console.warn('⚠️ SUPABASE_URL o SUPABASE_KEY no definidas. StorageService deshabilitado.');
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    if (!this.supabase) {
      throw new Error('StorageService no está configurado. Agrega SUPABASE_URL y SUPABASE_KEY al .env');
    }
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