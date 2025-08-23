import { EmailResponse, EmailTemplate, ResendEmailOptions } from '@/types/email';

// RESEND API configuration
const RESEND_API_URL = 'https://api.resend.com/emails';

function getApiKey(): string {
  const apiKey = process.env.EXPO_PUBLIC_RESEND_API_KEY as string;
  
  if (!apiKey) {
    console.warn('RESEND API key not found. Email functionality will be disabled.');
    return '';
  }
  
  return apiKey;
}

function isServiceAvailable(): boolean {
  return !!process.env.EXPO_PUBLIC_RESEND_API_KEY;
}

async function sendEmailViaAPI(emailData: ResendEmailOptions): Promise<EmailResponse> {
  if (!isServiceAvailable()) {
    console.log('Email service not available, simulating successful send for development');
    return {
      success: true,
      message: 'Email service disabled - using mock response for development',
      id: 'mock-email-id',
    };
  }

  try {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      return {
        success: false,
        message: 'Email service not configured',
        error: 'Missing API key',
      };
    }
    
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || 'Failed to send email',
        error: result.error || 'Unknown error',
      };
    }

    return {
      success: true,
      message: 'Email sent successfully',
      id: result.id,
    };
  } catch (error) {
    console.error('Error sending email via RESEND API:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send email',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export const resendService = {
  async sendVerificationEmail(
    to: string,
    templateData: EmailTemplate
  ): Promise<EmailResponse> {
    const emailOptions: ResendEmailOptions = {
      from: 'Kippo <noreply@kippo.com>',
      to,
      subject: `Verify your email - ${templateData.appName}`,
      html: generateVerificationEmailHTML(templateData),
      text: generateVerificationEmailText(templateData),
    };

    return await sendEmailViaAPI(emailOptions);
  },

  async sendEmail(options: ResendEmailOptions): Promise<EmailResponse> {
    return await sendEmailViaAPI(options);
  },
};

function generateVerificationEmailHTML(data: EmailTemplate): string {
  const {
    firstName = 'there',
    verificationCode,
    appName,
    companyName = 'Kippo',
    supportEmail = 'support@kippo.com',
    expirationMinutes,
  } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: #ffffff;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }
        .content {
            padding: 40px 30px;
        }
        .verification-code {
            background-color: #f1f5f9;
            border: 2px dashed #2563eb;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
        }
        .code {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #2563eb;
            font-family: 'Courier New', monospace;
        }
        .code-label {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 10px;
        }
        .button {
            display: inline-block;
            background-color: #2563eb;
            color: #ffffff;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
        .footer {
            background-color: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            margin: 5px 0;
            font-size: 14px;
            color: #64748b;
        }
        .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .warning p {
            margin: 0;
            font-size: 14px;
            color: #92400e;
        }
        @media (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            .content, .header, .footer {
                padding: 20px;
            }
            .code {
                font-size: 28px;
                letter-spacing: 6px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to ${appName}!</h1>
        </div>
        
        <div class="content">
            <h2>Hi ${firstName},</h2>
            
            <p>Thank you for signing up for ${appName}! To complete your registration and secure your account, please verify your email address using the verification code below.</p>
            
            <div class="verification-code">
                <div class="code-label">Your verification code is:</div>
                <div class="code">${verificationCode}</div>
            </div>
            
            <p>Enter this code in the app to verify your email address and activate your account.</p>
            
            <div class="warning">
                <p><strong>Important:</strong> This code will expire in ${expirationMinutes} minutes for security reasons. If you don't use it within this time, you'll need to request a new verification code.</p>
            </div>
            
            <p>If you didn't create an account with ${appName}, you can safely ignore this email.</p>
            
            <p>Need help? Contact our support team at <a href="mailto:${supportEmail}">${supportEmail}</a> and we'll be happy to assist you.</p>
        </div>
        
        <div class="footer">
            <p><strong>${companyName}</strong></p>
            <p>This is an automated message, please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
}

function generateVerificationEmailText(data: EmailTemplate): string {
  const {
    firstName = 'there',
    verificationCode,
    appName,
    companyName = 'Kippo',
    supportEmail = 'support@kippo.com',
    expirationMinutes,
  } = data;

  return `
Welcome to ${appName}!

Hi ${firstName},

Thank you for signing up for ${appName}! To complete your registration and secure your account, please verify your email address using the verification code below.

Your verification code is: ${verificationCode}

Enter this code in the app to verify your email address and activate your account.

IMPORTANT: This code will expire in ${expirationMinutes} minutes for security reasons. If you don't use it within this time, you'll need to request a new verification code.

If you didn't create an account with ${appName}, you can safely ignore this email.

Need help? Contact our support team at ${supportEmail} and we'll be happy to assist you.

${companyName}
This is an automated message, please do not reply to this email.
© ${new Date().getFullYear()} ${companyName}. All rights reserved.
`;
}