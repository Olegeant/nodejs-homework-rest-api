const Mailgen = require('mailgen');

class EmailService {
  constructor(env, sender) {
    this.sender = sender;
    switch (env) {
      case 'development':
        this.link = 'https://4e85-46-119-207-75.ngrok.io';
        break;
      case 'production':
        this.link = 'link for production';
        break;
      default:
        this.link = 'http://localhost:3000';
        break;
    }
  }

  createEmailTemplate(name, verifyToken) {
    const mailGenerator = new Mailgen({
      theme: 'neopolitan',
      product: {
        name: 'Contacts App',
        link: this.link,
      },
    });

    const email = {
      body: {
        name,
        intro:
          'Welcome to Contacts App! We are very excited to have you on board.',
        action: {
          instructions:
            'To get started with Contacts App, please click the link below:',
          button: {
            color: '#22BC66',
            text: 'Confirm your account',
            link: `${this.link}/api/users/verify/${verifyToken}`,
          },
        },
        outro:
          "Need help, or have questions? Just reply to this email, we'd love to help.",
      },
    };
    return mailGenerator.generate(email);
  }

  async sendVerifyEmail(email, name, verifyToken) {
    const emailHTML = this.createEmailTemplate(name, verifyToken);
    const msg = {
      to: email,
      subject: 'Verify your email',
      html: emailHTML,
    };
    try {
      const result = await this.sender.send(msg);
      console.log(result);
      return true;
    } catch (err) {
      console.log(err.message);
      return false;
    }
  }
}

module.exports = EmailService;
