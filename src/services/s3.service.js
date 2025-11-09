import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 client
let s3Client = null;

function getS3Client() {
  if (!s3Client) {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
      throw new Error('AWS credentials are not configured. Please check your .env file.');
    }
    s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
}

/**
 * Sanitize filename by removing special characters
 */
function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
}

/**
 * Upload base64 image to S3
 * @param {string} base64Image - Base64 encoded image string
 * @param {string} originalName - Original filename (optional)
 * @returns {Promise<{Location: string, Key: string, fileType: string}>}
 */
export async function uploadBase64ToS3(base64Image, originalName = 'generated-image.png') {
  if (!process.env.AWS_S3_BUCKET) {
    throw new Error('AWS_S3_BUCKET is not set in environment variables');
  }

  const s3 = getS3Client();
  
  // Convert base64 to buffer
  const imageBuffer = Buffer.from(base64Image, 'base64');
  
  // Generate unique filename
  const sanitizedName = sanitizeFileName(originalName);
  const fileName = `${Date.now()}-${sanitizedName}`;
  
  // Determine content type from filename or default to PNG
  const contentType = originalName.toLowerCase().endsWith('.jpg') || originalName.toLowerCase().endsWith('.jpeg')
    ? 'image/jpeg'
    : 'image/png';

  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileName,
    Body: imageBuffer,
    ContentType: contentType,
    // Make the file publicly readable (optional - remove if you want private)
    // ACL: 'public-read',
  };

  try {
    await s3.send(new PutObjectCommand(params));
    
    // Construct the public URL
    const location = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    
    return {
      Location: location,
      Key: fileName,
      fileType: contentType,
    };
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload image to S3');
  }
}

