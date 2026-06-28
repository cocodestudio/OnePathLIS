import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { 
      patientPhone, 
      patientName, 
      reportId, 
      reportDate,
      pdfUrl 
    } = await req.json();

    if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      return NextResponse.json({ 
        success: false, 
        reason: 'server_error',
        message: 'WhatsApp API credentials are not configured in environment variables.'
      }, { status: 500 });
    }

    const trackingUrl = `https://onepathlab.com/track/${reportId}`;
    
    // Format to Indian number with country code (removes leading 0 if any)
    const formattedPhone = `91${patientPhone.replace(/^0/, '')}`;

    const payload = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",
      template: {
        name: process.env.WHATSAPP_TEMPLATE_NAME || "report_ready_onepath",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: patientName || "Patient" },
              { type: "text", text: reportId },
              { type: "text", text: reportDate },
              { type: "text", text: pdfUrl },
              { type: "text", text: trackingUrl }
            ]
          }
        ]
      }
    };

    const response = await fetch(
      `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    // Error code 131026 means the number is not registered on WhatsApp
    if (data.error?.code === 131026) {
      return NextResponse.json({ 
        success: false, 
        reason: 'no_whatsapp' 
      }, { status: 200 });
    }

    if (!response.ok) {
      throw new Error(data.error?.message || 'API Error from WhatsApp Graph API');
    }

    return NextResponse.json({ 
      success: true, 
      messageId: data.messages?.[0]?.id 
    });

  } catch (error: any) {
    console.error("WhatsApp Send Error:", error);
    return NextResponse.json({ 
      success: false, 
      reason: 'server_error',
      message: error.message 
    }, { status: 500 });
  }
}
