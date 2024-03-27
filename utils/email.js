/* eslint-disable import/no-extraneous-dependencies */
const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

// usage - new Email(user, url).sendWelcome();
module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Sanjay Kumar <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Sendgrid
      return nodemailer.createTransport({
        // service: 'SendGrid',
        // auth: {
        //   user: process.env.SENDGRID_USERNAME,
        //   pass: process.env.SENDGRID_PASSWORD,
        // },
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // send the actual mail
  async send(template, subject) {
    // 1) Render HTML based on a pug template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`, // currently running location ie - utils
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      },
    );

    // 2 ) define the email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      // text: htmlToText.fromString(html),
      text: htmlToText.convert(html), // include a text version of email into a email, helpful/ better for email delivery rate and also for span folders
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('Welcome', 'Welcome to the Natours Family');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes',
    );
  }
};

/*
const sendEmail = async (options) => {
  // 1) Create a transporter - a service that will actually send the email
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    // ACTIVATE in gamil "less secure app" option IF USING SERVICE Gmail
    //some services - sendGrid or mailGun

    // use a special development service that fakes to send email to real addresses, in reality it end up trapped in a development inbox -  mailtrap
  });
  // 2) Define the email options
  const mailOptions = {
    from: 'Sanjay Kumar <hello@sanjay.io>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };
  // console.log(options);

  // 3) send the email with nodemailer
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
*/
