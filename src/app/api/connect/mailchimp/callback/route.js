// src/app/api/connect/mailchip/callback/route.js (Complete and Corrected)

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
import axios from 'axios';
import { jwtVerify } from 'jose';

const getStateSecret = () => {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
        throw new Error("NEXTAUTH_SECRET is not set in environment variables.");
    }
    return new TextEncoder().encode(secret);
};

export async function GET(req) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUrl = new URL('/settings', appUrl);
    
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const stateToken = searchParams.get('state');

    if (!code || !stateToken) {
        redirectUrl.searchParams.set('connect_status', 'error');
        redirectUrl.searchParams.set('message', 'invalid_callback');
        return NextResponse.redirect(redirectUrl);
    }

    let connection;
    try {
        const { payload } = await jwtVerify(stateToken, getStateSecret());
        const userId = payload.userId;
        const userEmail = payload.userEmail;

        if (!userId || !userEmail) {
            throw new Error("Invalid state token payload.");
        }

        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('client_id', process.env.MAILCHIMP_CLIENT_ID);
        params.append('client_secret', process.env.MAILCHIMP_CLIENT_SECRET);
        params.append('redirect_uri', `${appUrl}/api/connect/mailchimp/callback`);
        params.append('code', code);

        const tokenResponse = await axios.post(
            'https://login.mailchimp.com/oauth2/token',
            params,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        
        const { access_token } = tokenResponse.data;

        // --- THIS IS THE CORRECTED, COMPLETE LINE ---
        const metadataResponse = await axios.get('https://login.mailchimp.com/oauth2/metadata', {
            headers: { 'Authorization': `OAuth ${access_token}` },
        });
        const { dc } = metadataResponse.data;
        // --- END OF FIX ---

        connection = await db.getConnection();
        const query = `
            INSERT INTO social_connections (user_email, platform, access_token_encrypted, server_prefix)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            access_token_encrypted = VALUES(access_token_encrypted),
            server_prefix = VALUES(server_prefix);
        `;
        await connection.query(query, [ userEmail, 'mailchimp', encrypt(access_token), dc ]);

        redirectUrl.searchParams.set('connect_status', 'success');
        return NextResponse.redirect(redirectUrl);

    } catch (error) {
        console.error("Mailchimp connection error:", error.response?.data || error.message);
        redirectUrl.searchParams.set('connect_status', 'error');
        redirectUrl.searchParams.set('message', 'connection_failed');
        return NextResponse.redirect(redirectUrl);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}