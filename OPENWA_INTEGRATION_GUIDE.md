# OpenWA Integration Guide

This guide explains how to set up OpenWA and integrate it into the OnePath Lab application for sending free, automated WhatsApp notifications without relying on Meta's official Cloud API.

## 1. Hosting OpenWA (Production)
Because OpenWA simulates a WhatsApp Web instance, it requires a continuous background process. You should host it on a Virtual Private Server (VPS) such as DigitalOcean, AWS EC2, or Hetzner.

1. Install Docker on your VPS.
2. Clone the OpenWA repo and start it:
   ```bash
   git clone https://github.com/rmyndharis/OpenWA.git
   cd OpenWA
   docker compose -f docker-compose.yml up -d
   ```
3. Access the OpenWA dashboard at `http://<your-vps-ip>:2785`.
4. Create a new session (e.g., `onepath-lab`), generate an **API Key**, and click "Start".
5. A QR code will appear. Scan it using the lab's physical WhatsApp account (via Settings -> Linked Devices).

## 2. Environment Variables
In your OnePath Lab Next.js project, update your production `.env` (or `.env.local` for dev):
```env
OPENWA_API_URL=http://<your-vps-ip>:2785
OPENWA_API_KEY=your_generated_api_key
OPENWA_SESSION_ID=onepath-lab
```

## 3. Modifying the API Route
Currently, the "Share to WhatsApp" logic is stubbed out for the Meta Cloud API. You need to update `src/app/api/send-whatsapp/route.ts` to send requests to your OpenWA API instead.

### Example OpenWA Implementation for `route.ts`:
```typescript
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { patientPhone, patientName, reportId, reportDate } = await req.json();

    if (!process.env.OPENWA_API_URL || !process.env.OPENWA_API_KEY) {
      return NextResponse.json({ success: false, message: "OpenWA missing" }, { status: 500 });
    }

    // OpenWA requires the format: country_code + number + @c.us
    const formattedPhone = `91${patientPhone.replace(/^0/, '')}@c.us`; 
    
    // Free-form text (no template approval required!)
    const text = `✅ Report Ready | OnePath Lab\n\nDear ${patientName},\n\nYour report (ID: ${reportId}) is now available.\nDate: ${reportDate}\n\n🔗 Track & Download: https://onepathlab.com/track/${reportId}\n\n— OnePath Lab, Ludhiana\n📞 9045757572`;

    const response = await fetch(`${process.env.OPENWA_API_URL}/api/sessions/${process.env.OPENWA_SESSION_ID}/messages/send-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.OPENWA_API_KEY
      },
      body: JSON.stringify({
        chatId: formattedPhone,
        text: text
      })
    });

    if (!response.ok) throw new Error("OpenWA API Error");
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, reason: "server_error" }, { status: 500 });
  }
}
```

## 4. UI Trigger Location
The UI button that triggers this API call is located in `src/components/print-preview-dialog.tsx`. It calls the API, manages the loading states (`sending`, `sent`, `error`), and updates the UI button dynamically.
