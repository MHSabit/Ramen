import { Injectable } from '@nestjs/common';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';

@Injectable()
export class FileUploadService {
  constructor() {
    // Initialize SojebStorage with local configuration
    SojebStorage.config({
      driver: 'local',
      connection: {
        rootUrl: appConfig().storageUrl.rootUrl + appConfig().storageUrl.productImage,
      },
    });
  }

  async uploadProductImage(file: Express.Multer.File): Promise<string> {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      // Generate unique filename
      const fileExtension = file.originalname.split('.').pop();
      const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileExtension}`;

      // Upload file using SojebStorage
      await SojebStorage.put(uniqueFileName, file.buffer);

      // Return the file path/URL
      return uniqueFileName;
    } catch (error) {
      throw new Error(`Failed to upload product image: ${error.message}`);
    }
  }

  async deleteProductImage(imagePath: string): Promise<boolean> {
    try {
      if (!imagePath) {
        return false;
      }

      // Extract filename from path
      const fileName = imagePath.split('/').pop();
      if (!fileName) {
        return false;
      }

      // Delete file using SojebStorage
      return await SojebStorage.delete(fileName);
    } catch (error) {
      console.error('Failed to delete product image:', error);
      return false;
    }
  }
}
