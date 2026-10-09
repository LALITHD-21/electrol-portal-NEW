import { NextResponse, type NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const host = request.headers.get('host') || 'localhost:8081';
    const protocol =
      request.headers.get('x-forwarded-proto') ||
      (host.startsWith('localhost') ||
      host.startsWith('192.168') ||
      host.startsWith('127.0')
        ? 'http'
        : 'https');
    const startUrl = `${protocol}://${host}/search`;

    // Read icon for Apple WebClip
    let iconBase64 = '';
    try {
      const iconPath = path.join(process.cwd(), 'public', 'apple-touch-icon.png');
      if (fs.existsSync(iconPath)) {
        iconBase64 = fs.readFileSync(iconPath).toString('base64');
      }
    } catch (e) {
      console.error('Error reading apple-touch-icon.png:', e);
    }

    const payloadUuid = crypto.randomUUID();
    const profileUuid = crypto.randomUUID();

    const mobileConfig = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>FullScreen</key>
            <true/>
            ${iconBase64 ? `<key>Icon</key>\n            <data>${iconBase64}</data>` : ''}
            <key>IsRemovable</key>
            <true/>
            <key>Label</key>
            <string>Voter Search</string>
            <key>PayloadDescription</key>
            <string>Electoral Roll Search App for Karnataka Legislative Council</string>
            <key>PayloadDisplayName</key>
            <string>Voter Search App</string>
            <key>PayloadIdentifier</key>
            <string>com.electoralportal.votersearch.webclip</string>
            <key>PayloadType</key>
            <string>com.apple.webClip.managed</string>
            <key>PayloadUUID</key>
            <string>${payloadUuid}</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>Precomposed</key>
            <true/>
            <key>URL</key>
            <string>${startUrl}</string>
        </dict>
    </array>
    <key>PayloadDescription</key>
    <string>Installs the official Voter Search App onto your iPhone or iPad home screen.</string>
    <key>PayloadDisplayName</key>
    <string>Voter Search App</string>
    <key>PayloadIdentifier</key>
    <string>com.electoralportal.votersearch</string>
    <key>PayloadOrganization</key>
    <string>Karnataka Electoral Portal</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>${profileUuid}</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>`;

    return new NextResponse(mobileConfig, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-apple-aspen-config',
        'Content-Disposition': 'attachment; filename="VoterSearch.mobileconfig"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating iOS profile:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
