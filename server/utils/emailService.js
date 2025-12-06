const nodemailer = require('nodemailer');

// Initialize email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

// Email Templates
const emailTemplates = {
  confirmSubscription: (email, unsubscribeLink) => ({
    subject: '🎉 Welcome to Savoria Bistro Newsletter!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #92400e 0%, #d97706 100%); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 32px; font-weight: bold;">Savoria.</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Welcome to Our Newsletter!</p>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin-top: 0;">Thank you for subscribing!</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            You're now part of the Savoria Bistro family. Get ready for:
          </p>
          <ul style="color: #4b5563; line-height: 1.8;">
            <li>🍽️ Exclusive menu previews and specials</li>
            <li>👨‍🍳 Culinary tips from our chefs</li>
            <li>🎉 Special events and promotions</li>
            <li>⏰ Early reservations access</li>
          </ul>
          <p style="color: #4b5563; line-height: 1.6; margin-top: 20px;">
            Our next newsletter will arrive soon. Stay hungry!
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Not interested anymore? <a href="${unsubscribeLink}" style="color: #d97706; text-decoration: none;">Unsubscribe here</a>
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
            © ${new Date().getFullYear()} Savoria Bistro. All rights reserved.
          </p>
        </div>
      </div>
    `
  }),

  newsletter: (subscriberName, content) => ({
    subject: '📰 Savoria Bistro - This Week\'s Special',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #92400e 0%, #d97706 100%); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Savoria.</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937;">Hello ${subscriberName || 'Friend'}!</h2>
          <div style="color: #4b5563; line-height: 1.8;">
            ${content}
          </div>
          <div style="margin-top: 30px; text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/menu" 
               style="background: #d97706; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              View Our Menu
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Savoria Bistro. All rights reserved.
          </p>
        </div>
      </div>
    `
  }),

  unsubscribeConfirmation: () => ({
    subject: 'You\'ve been unsubscribed from Savoria Bistro Newsletter',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #92400e 0%, #d97706 100%); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Savoria.</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937;">We'll miss you!</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Your email has been removed from our newsletter list. We'd love to have you back anytime.
          </p>
          <p style="color: #4b5563; line-height: 1.6;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}" 
               style="color: #d97706; text-decoration: none; font-weight: bold;">
              Visit Savoria Bistro
            </a>
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Savoria Bistro. All rights reserved.
          </p>
        </div>
      </div>
    `
  })
};

emailTemplates.privateEventFollowup = (recipientName, staffName, body) => ({
  subject: `Savoria Bistro • Private Event Follow-up`
    + (staffName ? ` from ${staffName}` : ''),
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #92400e 0%, #d97706 100%); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Savoria Bistro</h1>
      </div>
      <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
        <h2 style="color: #1f2937;">Hello ${recipientName || 'Friend'},</h2>
        <div style="color: #4b5563; line-height: 1.6;">
          ${body}
        </div>
        <p style="color: #4b5563; margin-top: 30px;">Warm regards,<br/>${staffName || 'The Savoria Bistro Team'}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Savoria Bistro. All rights reserved.</p>
      </div>
    </div>
  `
});

// Send confirmation email
const sendConfirmationEmail = async (email, unsubscribeToken) => {
  try {
    const unsubscribeLink = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/unsubscribe/${unsubscribeToken}`;
    const template = emailTemplates.confirmSubscription(email, unsubscribeLink);

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Savoria Bistro <noreply@savoria.com>',
      to: email,
      subject: template.subject,
      html: template.html
    });

    console.log(`✅ Confirmation email sent to ${email}`);
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
  transporter
};
