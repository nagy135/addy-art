import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, extname, basename } from 'path';
import { auth } from '@/app/api/auth/[...nextauth]/route';

export const runtime = 'nodejs';

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed image file extensions
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'];

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
];

function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts and get just the basename
  const base = basename(filename);
  // Remove any characters that could be dangerous
  return base.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function isValidImageFile(file: File): boolean {
  // Check file extension
  const ext = extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return false;
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return false;
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return false;
  }

  return true;
}

export async function POST(request: NextRequest) {
  // Require authentication - only admins can upload
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type and size
    if (!isValidImageFile(file)) {
      return NextResponse.json(
        { error: 'Invalid file type or file too large. Only images up to 10MB are allowed.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename to prevent path traversal
    const sanitizedOriginalName = sanitizeFilename(file.name);
    const ext = extname(sanitizedOriginalName);
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const filename = `${timestamp}-${randomSuffix}${ext}`;
    
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const filepath = join(uploadDir, filename);

    // Ensure the filepath is within the uploads directory (prevent path traversal)
    const resolvedPath = join(uploadDir, filename);
    if (!resolvedPath.startsWith(uploadDir)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      );
    }

    await mkdir(uploadDir, { recursive: true });
    await writeFile(filepath, buffer);

    return NextResponse.json({ path: `/uploads/${filename}` });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

