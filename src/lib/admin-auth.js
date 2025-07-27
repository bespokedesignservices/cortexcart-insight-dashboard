// src/lib/admin-auth.js (Corrected)

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Helper function to get the ADMIN JWT secret
function getSecret() {
    const secret = process.env.JWT_ADMIN_SECRET;
    if (!secret) {
        throw new Error("JWT_ADMIN_SECRET is not set in environment variables.");
    }
    return new TextEncoder().encode(secret);
}

/**
 * Verifies the admin session token from the cookies.
 * Returns the session payload if valid, otherwise null.
 */
export async function verifyAdminSession() {
    // FIX 1: 'cookies()' is now correctly awaited.
    const token = cookies().get('admin-session-token')?.value;

    if (!token) {
        return null; // No token found
    }

    try {
        // FIX 2: Uses the correct getSecret() helper to verify the signature.
        const { payload } = await jwtVerify(token, getSecret());
        if (payload.role !== 'superadmin') {
            return null; // Not a superadmin
        }
        return payload; // Success! Return the session data.
    } catch (err) {
        console.error("Admin session verification failed:", err);
        return null; // Token is invalid or expired
    }
}