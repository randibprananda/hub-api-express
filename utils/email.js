const nodemailer = require('nodemailer');
const dotenv = require("dotenv");

dotenv.config();

const transport = nodemailer.createTransport({
  pool: true,
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: true, 
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
})

const sendEmail = async (recipient, subject, html) => {
  try {
    await transport.sendMail({
      from: process.env.MAIL_USER,
      to: recipient,
      subject,
      html,
    })
  } catch (error) {
    console.log(error)
  }
}

module.exports = {sendEmail}