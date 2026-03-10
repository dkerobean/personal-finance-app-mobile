import { EmailResponse, EmailTemplate, ResendEmailOptions } from '@/types/email';

const CLIENT_SIDE_EMAIL_DISABLED_MESSAGE =
  'Client-side email delivery is disabled. Send email from a server-side function or backend API.';

async function sendEmailViaAPI(_: ResendEmailOptions): Promise<EmailResponse> {
  console.warn(CLIENT_SIDE_EMAIL_DISABLED_MESSAGE);

  return {
    success: false,
    message: CLIENT_SIDE_EMAIL_DISABLED_MESSAGE,
    error: 'EMAIL_DELIVERY_DISABLED',
  };
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
      html: '',
      text: '',
    };

    return sendEmailViaAPI(emailOptions);
  },

  async sendEmail(options: ResendEmailOptions): Promise<EmailResponse> {
    return sendEmailViaAPI(options);
  },
};
