const nodemailer = require('nodemailer');

// Minimal emailTemplates for confirmation email
const emailTemplates = {
  confirmSubscription: (email, unsubscribeLink) => ({
    subject: 'Newsletter Subscription Confirmed',
    html: `<h2>Thank you for subscribing to our newsletter!</h2><p>Your subscription is confirmed for ${email}.</p><p>If you wish to unsubscribe, click <a href="${unsubscribeLink}">here</a>.</p>`
  }),
  newsletter: (subscriberName, content) => ({
    subject: 'Savoria Bistro Newsletter',
    html: `<h2>Hello${subscriberName ? ' ' + subscriberName : ''}!</h2><div>${content}</div><p style="margin-top:16px;font-size:12px;color:#888;">You are receiving this email because you subscribed to our newsletter.</p>`
  }),
  unsubscribeConfirmation: () => ({
    subject: 'You have been unsubscribed',
    html: `<h2>Unsubscribed from Newsletter</h2><p>You have been successfully unsubscribed from Savoria Bistro's newsletter. We're sorry to see you go!</p>`
  }),
  privateEventFollowup: (name, staffName, body) => ({
    subject: 'Private Event Follow-up',
    html: `<h2>Dear ${name},</h2><p>${body}</p><p>Best regards,<br>Savoria Bistro Team</p>`
  }),
  passwordReset: (email, resetLink) => ({
    subject: 'Reset Your Savoria Bistro Password',
    html: `<h2>Password Reset Request</h2><p>We received a request to reset your password for ${email}.</p><p><a href="${resetLink}" style="background-color: #8B0000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p><p>If you did not request this, you can ignore this email.</p>`
  })
};
// Send password reset email
const sendPasswordResetEmail = async (email, resetLink) => {
  try {
    const cleanEmail = String(email).replace(/["'<>\s]/g, '');
    const template = emailTemplates.passwordReset(cleanEmail, resetLink);
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@savoria.com',
      to: cleanEmail,
      subject: template.subject,
      html: template.html
    });
    console.log('✅ Password reset email sent to:', cleanEmail);
    return true;
  } catch (err) {
    console.error('Password reset email send error:', err);
    return false;
  }
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'noreply@savoria.com',
    pass: process.env.EMAIL_PASSWORD || 'default_password'
  }
});

// Only keep the correct, working version of sendConfirmationEmail below. Remove broken/incomplete version above.

// Send confirmation email
const sendConfirmationEmail = async (email, unsubscribeToken) => {
  try {
    // Sanitize email: remove quotes, angle brackets, and spaces
    const cleanEmail = String(email).replace(/["'<>\s]/g, '');
    const unsubscribeLink = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/unsubscribe/${unsubscribeToken}`;
    const template = emailTemplates.confirmSubscription(cleanEmail, unsubscribeLink);

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Savoria Bistro <noreply@savoria.com>',
      to: cleanEmail,
      subject: template.subject,
      html: template.html
    });

    console.log(`✅ Confirmation email sent to ${cleanEmail}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send confirmation email to ${email}:`, error.message);
    return false;
  }
};

// Send newsletter to single subscriber
const sendNewsletter = async (email, subscriberName, content) => {
  try {
    const template = emailTemplates.newsletter(subscriberName, content);

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Savoria Bistro <noreply@savoria.com>',
      to: email,
      subject: template.subject,
      html: template.html
    });

    console.log(`✅ Newsletter sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send newsletter to ${email}:`, error.message);
    return false;
  }
};

// Send newsletter to all subscribers
const sendNewsletterToAll = async (content) => {
  try {
    const Newsletter = require('../models/Newsletter');
    const subscribers = await Newsletter.find({ isActive: true });

    if (subscribers.length === 0) {
      console.log('📭 No active subscribers to send newsletter to');
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    for (const subscriber of subscribers) {
      const success = await sendNewsletter(subscriber.email, subscriber.name, content);
      if (success) sent++;
      else failed++;
      
      // Add delay between emails to avoid rate limiting (500ms)
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`📧 Newsletter campaign completed: ${sent} sent, ${failed} failed`);
    return { sent, failed, total: subscribers.length };
  } catch (error) {
    console.error('❌ Error sending newsletter campaign:', error.message);
    return { sent: 0, failed: 0, error: error.message };
  }
};

// Send unsubscribe confirmation
const sendUnsubscribeConfirmation = async (email) => {
  try {
    const template = emailTemplates.unsubscribeConfirmation();

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Savoria Bistro <noreply@savoria.com>',
      to: email,
      subject: template.subject,
      html: template.html
    });

    console.log(`✅ Unsubscribe confirmation sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send unsubscribe confirmation to ${email}:`, error.message);
    return false;
  }
};

const sendPrivateEventFollowup = async (email, name, staffName, body) => {
  try {
    const template = emailTemplates.privateEventFollowup(name, staffName, body);

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Savoria Bistro <noreply@savoria.com>',
      to: email,
      subject: template.subject,
      html: template.html
    });

    console.log(`✅ Private event follow-up sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send private event follow-up to ${email}:`, error.message);
    return false;
  }
};

module.exports = {
  sendConfirmationEmail,
  sendNewsletter,
  sendNewsletterToAll,
  sendUnsubscribeConfirmation,
  sendPrivateEventFollowup,
  sendPasswordResetEmail,
  transporter
};
