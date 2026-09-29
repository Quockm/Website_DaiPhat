import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    try {
        const { courseId, imagesDict } = await req.json();
        
        if (!courseId || !imagesDict) {
            return NextResponse.json({ success: false, message: "Missing data" }, { status: 400 });
        }
        
        const dir = path.join(process.cwd(), 'public', 'uploads', 'xml_images');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        const filePath = path.join(dir, `${courseId}.json`);
        // Write the huge JSON file
        fs.writeFileSync(filePath, JSON.stringify(imagesDict), 'utf-8');
        
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get('courseId');
        const checkOnly = searchParams.get('checkOnly') === 'true';
        
        if (!courseId) {
            return NextResponse.json({ success: false, message: "Missing courseId" }, { status: 400 });
        }
        
        const filePath = path.join(process.cwd(), 'public', 'uploads', 'xml_images', `${courseId}.json`);
        
        const exists = fs.existsSync(filePath);
        
        if (checkOnly) {
            return NextResponse.json({ success: true, exists });
        }
        
        if (exists) {
            const data = fs.readFileSync(filePath, 'utf-8');
            return NextResponse.json({ success: true, data: JSON.parse(data) });
        }
        
        return NextResponse.json({ success: true, data: {} });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message, data: {} }, { status: 500 });
    }
}
