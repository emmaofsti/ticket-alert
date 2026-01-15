import { Resend } from 'resend';

// Only initialize Resend if API key is available
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface SendTicketAlertProps {
  to: string;
  eventName: string;
  eventDate: string;
  venue: string;
  ticketmasterUrl: string;
}

export async function sendTicketAlertEmail({
  to,
  eventName,
  eventDate,
  venue,
  ticketmasterUrl,
}: SendTicketAlertProps): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.log('Resend not configured, email not sent');
    return { success: true }; // Return success for demo purposes
  }

  try {
    const { error } = await resend.emails.send({
      from: 'TicketAlert Norge <onboarding@resend.dev>',
      to: [to],
      subject: `🎫 Videresolgte billetter tilgjengelig: ${eventName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; color: #18181b; padding: 40px 20px; margin: 0;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="font-size: 48px; margin-bottom: 12px;">🎫</div>
              <h1 style="font-size: 24px; font-weight: bold; margin: 0; color: #18181b;">
                Billetter tilgjengelige!
              </h1>
            </div>
            
            <!-- Event Card -->
            <div style="background-color: #f4f4f5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <h2 style="font-size: 18px; font-weight: bold; margin: 0 0 12px 0; color: #18181b;">
                ${eventName}
              </h2>
              <div style="color: #52525b; font-size: 14px; margin-bottom: 6px;">
                📅 ${new Date(eventDate).toLocaleDateString('nb-NO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })}
              </div>
              <div style="color: #52525b; font-size: 14px;">
                📍 ${venue}
              </div>
            </div>
            
            <!-- CTA Button -->
            <a href="${ticketmasterUrl}" style="display: block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; text-align: center; font-size: 16px;">
              Se billetter på Ticketmaster →
            </a>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 24px; color: #71717a; font-size: 12px; border-top: 1px solid #e4e4e7; padding-top: 24px;">
              <p style="margin: 0 0 8px 0;">
                Du mottar denne e-posten fordi du sporet dette arrangementet på TicketAlert Norge.
              </p>
              <p style="margin: 0; color: #a1a1aa;">
                © ${new Date().getFullYear()} TicketAlert Norge
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to send email:', err);
    return { success: false, error: 'Kunne ikke sende e-post' };
  }
}
