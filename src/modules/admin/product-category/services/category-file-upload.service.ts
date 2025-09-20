import { Injectable } from '@nestjs/common';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CategoryFileUploadService {
  constructor() {
    // Ensure category directory exists
    const storagePath = appConfig().storageUrl.rootUrl + appConfig().storageUrl.category;
    // console.log('Category storage path:', storagePath);
    
    if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath, { recursive: true });
      // console.log('Created category directory:', storagePath);
    }
    
    // Don't reconfigure SojebStorage - use the global config from main.ts
    // We'll include the category folder in the filename instead
  }

  async uploadCategoryImage(file: Express.Multer.File): Promise<string> {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      // console.log('Uploading category image:', file.originalname);

      // Generate unique filename with category folder path
      const fileExtension = file.originalname.split('.').pop();
      const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileExtension}`;
      const categoryFileName = uniqueFileName;

      // console.log('Generated filename:', categoryFileName);

      // Upload file using SojebStorage with category folder in path
      await SojebStorage.put(categoryFileName, file.buffer);
      // console.log('File uploaded successfully to:', categoryFileName);

      // Return the filename with category folder
      return categoryFileName;
    } catch (error) {
      // console.error('Upload error:', error);
      throw new Error(`Failed to upload category image: ${error.message}`);
    }
  }

  async deleteCategoryImage(imagePath: string): Promise<boolean> {
    try {
      if (!imagePath) {
        return false;
      }

      // Use the full path for deletion (includes category/ folder)
      return await SojebStorage.delete(imagePath);
    } catch (error) {
      // console.error('Failed to delete category image:', error);
      return false;
    }
  }
}
