// src/app/api/admin/roadmap/route.js (Corrected)

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jwtVerify } from 'jose'; // FIX: Import jwtVerify for custom token validation

// Helper function to get the secret key
const getSecret = () => {
    const secret = process.env.JWT_ADMIN_SECRET;
    if (!secret) {
        throw new Error("JWT_ADMIN_SECRET is not set in environment variables.");
    }
    return new TextEncoder().encode(secret);
};

// --- POST: Add a new roadmap item ---
export async function POST(req) {
    try {
        // FIX: Replaced next-auth getToken with custom admin token verification
        const adminCookie = req.cookies.get('admin-session-token');
        const token = adminCookie?.value;

        if (!token) {
            return new NextResponse("Forbidden: No session token found.", { status: 403 });
        }
        
        const secret = getSecret();
        const { payload } = await jwtVerify(token, secret);

        if (payload.role !== 'superadmin') {
            return new NextResponse("Forbidden: You do not have permission for this action.", { status: 403 });
        }
        
        // --- End of new authentication logic ---

        const body = await req.json();
        const { title, description, category, status, releaseDate } = body;

        if (!title || !description || !category || !status) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const newRoadmapItem = await db.roadmap.create({
            data: {
                title,
                description,
                category,
                status,
                release_date: releaseDate ? new Date(releaseDate) : null,
            },
        });

        return NextResponse.json(newRoadmapItem, { status: 201 });

    } catch (error) {
        console.error('[ROADMAP_POST_ERROR]', error);
        // If the token is invalid, jwtVerify will throw an error
        if (error.code === 'ERR_JWT_EXPIRED' || error.code === 'ERR_JWS_INVALID') {
            return new NextResponse("Unauthorized: Invalid session token.", { status: 401 });
        }
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}


// --- GET: Fetch all roadmap items ---
export async function GET() {
    try {
        // THE FIX: Use Prisma's findMany instead of db.query
        const roadmapItems = await db.roadmap_features.findMany({
            orderBy: {
                // You can create more complex sorting here if needed
                createdAt: 'desc', 
            },
        });
        return NextResponse.json(roadmapItems, { status: 200 });
    } catch (error) {
        console.error('[ROADMAP_GET_ERROR]', error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}