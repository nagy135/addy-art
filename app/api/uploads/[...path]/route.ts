import { NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join, normalize, extname } from 'path';

export const runtime = 'nodejs';

function getContentType(filePath: string): string {
	const extension = extname(filePath).toLowerCase();
	switch (extension) {
		case '.jpg':
		case '.jpeg':
			return 'image/jpeg';
		case '.png':
			return 'image/png';
		case '.webp':
			return 'image/webp';
		case '.gif':
			return 'image/gif';
		case '.svg':
			return 'image/svg+xml';
		case '.avif':
			return 'image/avif';
		default:
			return 'application/octet-stream';
	}
}

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ path: string[] }> }
) {
	try {
		const { path } = await params;
		if (!Array.isArray(path) || path.length === 0) {
			return NextResponse.json({ error: 'File path required' }, { status: 400 });
		}

		const joined = path.join('/');
		const safeRelative = normalize(joined).replace(/^(\.\.(\/|\\|$))+/, '');
		const absolutePath = join(process.cwd(), 'public', 'uploads', safeRelative);

		const fileStat = await stat(absolutePath).catch(() => null);
		if (!fileStat || !fileStat.isFile()) {
			return NextResponse.json({ error: 'Not found' }, { status: 404 });
		}

		const fileBuffer = await readFile(absolutePath);
		const contentType = getContentType(absolutePath);

		return new NextResponse(fileBuffer, {
			headers: {
				'Content-Type': contentType,
				'Content-Length': fileBuffer.byteLength.toString(),
			},
		});
	} catch (error) {
		console.error('Serve upload error:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}


