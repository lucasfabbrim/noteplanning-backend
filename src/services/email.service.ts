import { Resend } from 'resend';
import { env } from '@/config';
import { LoggerHelper } from '@/utils/logger.helper';

export class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(env.RESEND_API_KEY);
  }

  async sendWelcomeEmail(
    to: string,
    name: string,
    email: string,
    password: string
  ): Promise<boolean> {
    try {
      const result = await this.resend.emails.send({
        from: 'NotePlanning <noreply@notifications.noteplanning.com>',
        to: [to],
        subject: 'Bem-vindo ao NotePlanning - Suas credenciais de acesso',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Bem-vindo ao NotePlanning, ${name}!</h2>
            
            <p>Sua compra foi processada com sucesso e sua conta foi criada.</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Suas credenciais de acesso:</h3>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Senha:</strong> ${password}</p>
            </div>
            
            <p>Você pode acessar sua área de membros em: <a href="https://noteplanning.com/login" style="color: #007bff;">https://noteplanning.com/login</a></p>
            
            <p>Por favor, mantenha essas informações em segurança e considere alterar sua senha após o primeiro login.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            
            <p style="color: #666; font-size: 14px;">
              Se você não fez esta compra, por favor ignore este email.<br>
              Este é um email automático, não responda a esta mensagem.
            </p>
          </div>
        `,
      });


      return true;
    } catch (error) {
      LoggerHelper.error('EmailService', 'sendWelcomeEmail', 'Failed to send welcome email', error);
      return false;
    }
  }

  async sendPurchaseConfirmation(
    to: string,
    name: string,
    amount: number,
    products: any[]
  ): Promise<boolean> {
    try {
      const productList = products.map(product => 
        `<li>${product.name || product.id} - Quantidade: ${product.quantity || 1}</li>`
      ).join('');

      const result = await this.resend.emails.send({
        from: 'NotePlanning <noreply@notifications.noteplanning.com>',
        to: [to],
        subject: 'Confirmação de Compra - NotePlanning',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Compra Confirmada!</h2>
            
            <p>Olá ${name},</p>
            
            <p>Sua compra foi processada com sucesso!</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Detalhes da Compra:</h3>
              <p><strong>Valor Total:</strong> R$ ${amount.toFixed(2)}</p>
              <p><strong>Produtos:</strong></p>
              <ul>${productList}</ul>
            </div>
            
            <p>Em breve você receberá um email com suas credenciais de acesso à área de membros.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            
            <p style="color: #666; font-size: 14px;">
              Obrigado por escolher o NotePlanning!<br>
              Este é um email automático, não responda a esta mensagem.
            </p>
          </div>
        `,
      });


      return true;
    } catch (error) {
      LoggerHelper.error('EmailService', 'sendPurchaseConfirmation', 'Failed to send purchase confirmation', error);
      return false;
    }
  }

  async sendWelcomeEmailWithPassword(to: string, name: string, password: string): Promise<boolean> {
    try {
      console.log('EmailService: Attempting to send welcome email to:', to);
      console.log('EmailService: Using API key:', env.RESEND_API_KEY ? 'Present' : 'Missing');
      
      const result = await this.resend.emails.send({
        from: 'NotePlanning <noreply@notifications.noteplanning.com>',
        to: [to],
        subject: 'Bem-vindo ao NotePlanning! Sua conta foi criada',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Bem-vindo ao NotePlanning, ${name}!</h2>
            
            <p>Obrigado pela sua compra! Sua conta foi criada com sucesso.</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Suas credenciais de acesso:</h3>
              <p><strong>Email:</strong> ${to}</p>
              <p><strong>Senha:</strong> ${password}</p>
            </div>
            
            <p>Você pode acessar sua conta em:</p>
            <p style="text-align: center; margin: 20px 0;">
              <a href="https://membros.noteplanning.com" 
                 style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Acessar Minha Conta
              </a>
            </p>
            
            <p><strong>Importante:</strong> Por segurança, recomendamos que você altere sua senha após o primeiro login.</p>
            
            <p>Se você tiver alguma dúvida, não hesite em entrar em contato conosco.</p>
            
            <p>Atenciosamente,<br>Equipe NotePlanning</p>
          </div>
        `,
      });

      console.log('EmailService: Email sent successfully, result:', result);
      return true;
    } catch (error) {
      console.log('EmailService: Error sending email:', error);
      LoggerHelper.error('EmailService', 'sendWelcomeEmailWithPassword', 'Failed to send welcome email with password', error);
      return false;
    }
  }

  async sendExistingAccountEmail(to: string, name: string): Promise<boolean> {
    try {
      const result = await this.resend.emails.send({
        from: 'NotePlanning <noreply@notifications.noteplanning.com>',
        to: [to],
        subject: 'Nova compra realizada - NotePlanning',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Olá ${name}!</h2>
            
            <p>Obrigado pela sua nova compra! Detectamos que você já possui uma conta em nosso sistema.</p>
            
            <p>Você pode acessar sua conta existente em:</p>
            <p style="text-align: center; margin: 20px 0;">
              <a href="https://membros.noteplanning.com" 
                 style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Acessar Minha Conta
              </a>
            </p>
            
            <p>Use seu email e senha habituais para fazer login.</p>
            
            <p>Se você esqueceu sua senha, pode redefini-la na página de login.</p>
            
            <p>Se você tiver alguma dúvida, não hesite em entrar em contato conosco.</p>
            
            <p>Atenciosamente,<br>Equipe NotePlanning</p>
          </div>
        `,
      });

      return true;
    } catch (error) {
      LoggerHelper.error('EmailService', 'sendExistingAccountEmail', 'Failed to send existing account email', error);
      return false;
    }
  }
}
