/**
 * High-End E-Mail Service - Premium Email Integration
 * Supports Resend API for production and fallback for development
 */

import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface ContactFormData {
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
  unternehmen: string;
  betreff: string;
  nachricht: string;
}

/**
 * Send email using Resend API (Production) or console log (Development)
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string; debugInfo?: any }> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "kontakt@nexcel-ai.de";

  // Hard error if RESEND_API_KEY missing
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured. E-Mail-Versand nicht möglich.");
  }

  // Use verified domain fallback if FROM_EMAIL is not set or domain not verified
  // Resend provides onboarding@resend.dev for testing, but we'll use a more professional approach
  // Try to use FROM_EMAIL first, fallback to Resend's verified domain if domain verification fails
  let fromEmail = options.from || FROM_EMAIL || "onboarding@resend.dev";
  
  // If FROM_EMAIL contains a custom domain that might not be verified, 
  // we'll try it first and catch the error to use fallback
  const useFallbackDomain = !FROM_EMAIL || FROM_EMAIL.includes("nexcelai.de") || FROM_EMAIL.includes("nexcel-ai.de");
  const fallbackEmail = "onboarding@resend.dev"; // Resend's verified test domain

  try {
    const resend = new Resend(RESEND_API_KEY);
    
    // First attempt: Try with configured FROM_EMAIL
    let emailPayload = {
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    let { data, error } = await resend.emails.send(emailPayload);

    // If domain not verified error, try with fallback
    if (error && (error.message?.includes("domain is not verified") || error.message?.includes("not verified"))) {
      console.warn(`⚠️ [EMAIL] Domain verification failed for ${fromEmail}, using fallback: ${fallbackEmail}`);
      
      // Retry with Resend's verified domain
      emailPayload = {
        from: `NEXCEL AI <${fallbackEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      };

      const retryResult = await resend.emails.send(emailPayload);
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      throw new Error(`Resend API Error: ${error.message || JSON.stringify(error)}`);
    }

    return { success: true, debugInfo: { id: data?.id, from: emailPayload.from } };
  } catch (error) {
    // If it's a domain verification error and we haven't tried fallback yet, try it
    if (error instanceof Error && error.message.includes("domain is not verified") && fromEmail !== fallbackEmail) {
      try {
        console.warn(`⚠️ [EMAIL] Retrying with verified domain: ${fallbackEmail}`);
        const resend = new Resend(RESEND_API_KEY);
        const { data, error: retryError } = await resend.emails.send({
          from: `NEXCEL AI <${fallbackEmail}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
        });

        if (retryError) {
          throw new Error(`Resend API Error: ${retryError.message || JSON.stringify(retryError)}`);
        }

        return { success: true, debugInfo: { id: data?.id, from: fallbackEmail, fallback: true } };
      } catch (retryError) {
        throw new Error(`E-Mail-Versand fehlgeschlagen: ${retryError instanceof Error ? retryError.message : String(retryError)}`);
      }
    }
    
    throw new Error(`E-Mail-Versand fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate Premium Confirmation Email HTML for Customer with Verification Link
 */
function generateConfirmationEmailHTML(contactData: ContactFormData, verificationToken: string, baseUrl: string): string {
  const verificationLink = `${baseUrl}/api/verify-email?token=${verificationToken}`;
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ihre Anfrage wurde erhalten</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(180deg, #0C0F1A 0%, #111622 50%, #0C0F1A 100%);">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(180deg, #0C0F1A 0%, #111622 50%, #0C0F1A 100%);">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background: rgba(12, 15, 26, 0.9); border-radius: 24px; border: 1px solid rgba(164, 92, 255, 0.2); backdrop-filter: blur(20px); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid rgba(164, 92, 255, 0.1);">
              <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px;">
                <span style="background: linear-gradient(135deg, #A45CFF 0%, #00E1FF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">NEXCEL AI</span>
              </h1>
            </td>
          </tr>
          
          <!-- Success Icon -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 80px; height: 80px; margin: 0 auto; background: linear-gradient(135deg, rgba(164, 92, 255, 0.3), rgba(0, 225, 255, 0.3)); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid rgba(164, 92, 255, 0.5); box-shadow: 0 0 40px rgba(164, 92, 255, 0.3);">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#A45CFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </td>
          </tr>
          
          <!-- Title -->
          <tr>
            <td style="padding: 0 40px 20px; text-align: center;">
              <h2 style="margin: 0; font-size: 28px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px;">
                Vielen Dank für Ihre Anfrage!
              </h2>
            </td>
          </tr>
          
          <!-- Message -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #E5E7EB;">
                Sehr geehrte/r ${contactData.vorname} ${contactData.nachname},
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #E5E7EB;">
                vielen Dank für Ihre Kontaktaufnahme! Wir haben Ihre Anfrage erhalten und werden uns in Kürze persönlich bei Ihnen melden.
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #E5E7EB;">
                Ihre Anfrage im Überblick:
              </p>
            </td>
          </tr>
          
          <!-- Details Card -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background: rgba(164, 92, 255, 0.05); border: 1px solid rgba(164, 92, 255, 0.2); border-radius: 16px; padding: 24px;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #A45CFF; font-size: 14px; font-weight: 600; width: 140px;">Betreff:</td>
                    <td style="padding: 8px 0; color: #FFFFFF; font-size: 14px;">${contactData.betreff}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #A45CFF; font-size: 14px; font-weight: 600;">Unternehmen:</td>
                    <td style="padding: 8px 0; color: #FFFFFF; font-size: 14px;">${contactData.unternehmen}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #A45CFF; font-size: 14px; font-weight: 600;">Telefon:</td>
                    <td style="padding: 8px 0; color: #FFFFFF; font-size: 14px;">${contactData.telefon}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #A45CFF; font-size: 14px; font-weight: 600; vertical-align: top;">Nachricht:</td>
                    <td style="padding: 8px 0; color: #FFFFFF; font-size: 14px; line-height: 1.6;">${contactData.nachricht.replace(/\n/g, '<br>')}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          
          <!-- Email Verification Section -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background: linear-gradient(135deg, rgba(164, 92, 255, 0.15), rgba(0, 225, 255, 0.15)); border: 2px solid rgba(164, 92, 255, 0.3); border-radius: 20px; padding: 32px; text-align: center; box-shadow: 0 0 40px rgba(164, 92, 255, 0.2);">
                <div style="width: 60px; height: 60px; margin: 0 auto 20px; background: linear-gradient(135deg, rgba(164, 92, 255, 0.4), rgba(0, 225, 255, 0.4)); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid rgba(164, 92, 255, 0.5);">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#A45CFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <h3 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #FFFFFF;">
                  Bitte bestätigen Sie Ihre E-Mail-Adresse
                </h3>
                <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #E5E7EB;">
                  Um sicherzustellen, dass wir Sie erreichen können, bitten wir Sie, Ihre E-Mail-Adresse zu bestätigen. Klicken Sie einfach auf den Button unten.
                </p>
                <a href="${verificationLink}" style="display: inline-block; background: linear-gradient(135deg, #A45CFF 0%, #00E1FF 100%); color: #FFFFFF; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 8px 24px rgba(164, 92, 255, 0.4); transition: all 0.3s ease;">
                  ✉️ E-Mail-Adresse bestätigen
                </a>
                <p style="margin: 24px 0 0; font-size: 12px; line-height: 1.5; color: #9CA3AF;">
                  Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:<br/>
                  <a href="${verificationLink}" style="color: #A45CFF; word-break: break-all;">${verificationLink}</a>
                </p>
                <p style="margin: 16px 0 0; font-size: 11px; color: #6B7280;">
                  ⏰ Dieser Link ist 24 Stunden gültig.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Next Steps -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #E5E7EB;">
                <strong style="color: #A45CFF;">Nächste Schritte:</strong>
              </p>
              <ul style="margin: 0; padding-left: 20px; color: #E5E7EB; font-size: 16px; line-height: 1.8;">
                <li>Bestätigen Sie Ihre E-Mail-Adresse (siehe oben)</li>
                <li>Wir prüfen Ihre Anfrage innerhalb von 24 Stunden</li>
                <li>Ein Mitglied unseres Teams meldet sich persönlich bei Ihnen</li>
                <li>Gemeinsam klären wir die nächsten Schritte</li>
              </ul>
            </td>
          </tr>
          
          <!-- Contact Info -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <div style="background: rgba(0, 225, 255, 0.05); border: 1px solid rgba(0, 225, 255, 0.2); border-radius: 16px; padding: 24px; text-align: center;">
                <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #00E1FF; text-transform: uppercase; letter-spacing: 1px;">Direkter Kontakt</p>
                <p style="margin: 0 0 8px; font-size: 16px; color: #FFFFFF;">
                  <a href="mailto:kontakt@nexcel-ai.de" style="color: #00E1FF; text-decoration: none;">kontakt@nexcel-ai.de</a>
                </p>
                <p style="margin: 0; font-size: 16px; color: #FFFFFF;">
                  <a href="tel:+491639166073" style="color: #00E1FF; text-decoration: none;">+49 163 916 6073</a>
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background: rgba(0, 0, 0, 0.3); border-top: 1px solid rgba(164, 92, 255, 0.1); border-radius: 0 0 24px 24px;">
              <p style="margin: 0 0 12px; font-size: 12px; color: #6B7280; text-align: center;">
                Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht direkt auf diese E-Mail.
              </p>
              <p style="margin: 0; font-size: 12px; color: #6B7280; text-align: center;">
                <a href="https://nexcel-ai.de" style="color: #A45CFF; text-decoration: none;">nexcel-ai.de</a> | 
                <a href="https://nexcel-ai.de/datenschutz" style="color: #A45CFF; text-decoration: none;">Datenschutz</a> | 
                <a href="https://nexcel-ai.de/impressum" style="color: #A45CFF; text-decoration: none;">Impressum</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generate Premium Notification Email HTML for Admin
 */
function generateAdminNotificationHTML(contactData: ContactFormData, contactId: string): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neue Kontaktanfrage - ${contactData.betreff}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #F5F5F5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background: #F5F5F5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 30px 20px; background: linear-gradient(135deg, #A45CFF 0%, #00E1FF 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #FFFFFF;">
                🔔 Neue Kontaktanfrage
              </h1>
            </td>
          </tr>
          
          <!-- Alert -->
          <tr>
            <td style="padding: 20px 30px;">
              <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #92400E; font-weight: 600;">
                  ⚡ Neue Anfrage erfordert Ihre Aufmerksamkeit
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Contact Details -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                    <strong style="color: #374151; font-size: 14px;">Name:</strong>
                    <span style="color: #111827; font-size: 14px; margin-left: 8px;">${contactData.vorname} ${contactData.nachname}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                    <strong style="color: #374151; font-size: 14px;">E-Mail:</strong>
                    <a href="mailto:${contactData.email}" style="color: #A45CFF; font-size: 14px; margin-left: 8px; text-decoration: none;">${contactData.email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                    <strong style="color: #374151; font-size: 14px;">Telefon:</strong>
                    <a href="tel:${contactData.telefon}" style="color: #A45CFF; font-size: 14px; margin-left: 8px; text-decoration: none;">${contactData.telefon}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                    <strong style="color: #374151; font-size: 14px;">Unternehmen:</strong>
                    <span style="color: #111827; font-size: 14px; margin-left: 8px;">${contactData.unternehmen}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                    <strong style="color: #374151; font-size: 14px;">Betreff:</strong>
                    <span style="color: #111827; font-size: 14px; margin-left: 8px; font-weight: 600;">${contactData.betreff}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Message -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px;">
                <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #374151;">Nachricht:</p>
                <p style="margin: 0; font-size: 14px; color: #111827; line-height: 1.6; white-space: pre-wrap;">${contactData.nachricht}</p>
              </div>
            </td>
          </tr>
          
          <!-- Quick Actions -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 0;">
                    <a href="mailto:${contactData.email}?subject=Re: ${encodeURIComponent(contactData.betreff)}" style="display: inline-block; background: linear-gradient(135deg, #A45CFF 0%, #00E1FF 100%); color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; text-align: center;">
                      📧 Antworten
                    </a>
                  </td>
                  <td style="padding: 0; text-align: right;">
                    <a href="tel:${contactData.telefon}" style="display: inline-block; background: #10B981; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">
                      📞 Anrufen
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background: #F9FAFB; border-top: 1px solid #E5E7EB; border-radius: 0 0 16px 16px;">
              <p style="margin: 0; font-size: 12px; color: #6B7280; text-align: center;">
                Kontakt-ID: ${contactId} | ${new Date().toLocaleString("de-DE", { dateStyle: "long", timeStyle: "short" })}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Send confirmation email to customer with verification link
 */
export async function sendConfirmationEmail(contactData: ContactFormData, verificationToken: string): Promise<{ success: boolean; error?: string }> {
  // Determine base URL for verification link
  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  
  if (!baseUrl) {
    if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    } else {
      throw new Error("NEXT_PUBLIC_BASE_URL is not configured. Verifizierungs-Link kann nicht generiert werden.");
    }
  }

  // Validate token exists
  if (!verificationToken) {
    throw new Error("Verification token is missing.");
  }

  // Build verification link
  const verificationLink = `${baseUrl}/api/verify-email?token=${verificationToken}`;
  
  const subject = `Bitte bestätigen Sie Ihre E-Mail-Adresse - ${contactData.betreff}`;
  const html = generateConfirmationEmailHTML(contactData, verificationToken, baseUrl);

  return await sendEmail({
    to: contactData.email,
    subject,
    html,
  });
}

/**
 * Send notification email to admin
 */
export async function sendAdminNotification(contactData: ContactFormData, contactId: string): Promise<{ success: boolean; error?: string }> {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "kontakt@nexcel-ai.de";
  const subject = `🔔 Neue Kontaktanfrage: ${contactData.betreff} - ${contactData.vorname} ${contactData.nachname}`;
  const html = generateAdminNotificationHTML(contactData, contactId);

  return await sendEmail({
    to: ADMIN_EMAIL,
    subject,
    html,
    from: process.env.FROM_EMAIL || "noreply@nexcel-ai.de",
  });
}


