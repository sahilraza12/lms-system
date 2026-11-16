import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role?.toUpperCase() !== 'CENTER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = (user as any)?.id || (user as any)?.userId;
    if (!currentUserId) {
      return NextResponse.json({ error: 'User ID missing in session' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file size (max 5MB) & type
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 5MB' }, { status: 400 });
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only PNG, JPEG, or WebP allowed' }, { status: 400 });
    }

    // Save locally inside public/uploads/logos
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'logos');
    await mkdir(uploadDir, { recursive: true });

    const ext = file.name.split('.').pop() || 'png';
    const fileName = `center-${currentUserId}-${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);
    const logoUrl = `/uploads/logos/${fileName}`;

    // Update database
    const updatedCenter = await db.center.update({
      where: { userId: currentUserId },
      data: { logoUrl },
    });

    return NextResponse.json({
      success: true,
      logoUrl: updatedCenter.logoUrl,
    });
  } catch (error: any) {
    console.error('Center Logo Update Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update center logo' },
      { status: 500 }
    );
  }
}