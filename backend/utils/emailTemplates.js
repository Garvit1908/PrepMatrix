
const getPasswordResetTemplate = (username, resetUrl) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Reset Your Password - PrepMatrix</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FBF9F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

  <!-- Outer Canvas -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FBF9F5; padding: 30px 12px 50px 12px;">
    <tr>
      <td align="center">

        <!-- Main Container Card (Max width 580px) -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; background-color: #FFFFFF; border-radius: 14px; overflow: hidden; border: 1px solid #ECE6DB; box-shadow: 0 4px 20px rgba(43, 37, 32, 0.05);">
          
          <!-- 1. Top Dark Charcoal Header Bar -->
          <tr>
            <td style="background-color: #1E1C1A; padding: 22px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="42" valign="middle">
                    <!-- Brand Icon Badge -->
                    <div style="background-color: #D96B43; width: 36px; height: 36px; border-radius: 8px; text-align: center; line-height: 36px; color: #FFFFFF; font-weight: 800; font-size: 18px;">
                      ⚡
                    </div>
                  </td>
                  <td valign="middle" style="padding-left: 12px;">
                    <div style="font-size: 19px; font-weight: 700; color: #FBF9F5; letter-spacing: -0.3px;">PrepMatrix</div>
                    <div style="font-size: 12px; color: #A89F91; font-weight: 400; margin-top: 1px;">Security & Account Management</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 2. Hero Body Section -->
          <tr>
            <td style="padding: 32px 32px 28px 32px; background-color: #FFFFFF;">
              
              <!-- Tagline in Claude Orange -->
              <div style="font-size: 11px; font-weight: 800; color: #D96B43; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
                ACCOUNT SECURITY
              </div>

              <!-- Main Heading -->
              <h1 style="margin: 0 0 16px 0; font-size: 26px; font-weight: 800; color: #1E1C1A; letter-spacing: -0.5px;">
                Password Reset Request
              </h1>

              <!-- Greeting & Copy -->
              <p style="margin: 0 0 12px 0; font-size: 15px; color: #2B2520; line-height: 1.6;">
                Hello <strong>${username}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14.5px; color: #574F46; line-height: 1.6;">
                We received a request to reset the password on your <strong>PrepMatrix</strong> account. Review the request details below and click the button to set up your new password.
              </p>

              <!-- 3. Details Card (MediConnect Style) -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border: 1px solid #ECE6DB; border-radius: 10px; overflow: hidden; margin-bottom: 26px;">
                
                <!-- Card Header -->
                <tr>
                  <td style="background-color: #F8F5EE; padding: 12px 18px; border-bottom: 1px solid #ECE6DB;">
                    <span style="font-size: 11px; font-weight: 800; color: #786F64; text-transform: uppercase; letter-spacing: 1px;">
                      REQUEST DETAILS
                    </span>
                  </td>
                </tr>

                <!-- Card Content Table -->
                <tr>
                  <td style="padding: 16px 18px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      
                      <!-- Row 1: Action -->
                      <tr>
                        <td style="padding: 7px 0; font-size: 13.5px; color: #786F64;">Action Type</td>
                        <td align="right" style="padding: 7px 0; font-size: 14px; font-weight: 600; color: #1E1C1A;">Password Reset</td>
                      </tr>
                      
                      <!-- Divider -->
                      <tr><td colspan="2" style="border-bottom: 1px dashed #ECE6DB; padding: 2px 0;"></td></tr>

                      <!-- Row 2: Recipient -->
                      <tr>
                        <td style="padding: 9px 0 7px 0; font-size: 13.5px; color: #786F64;">Account User</td>
                        <td align="right" style="padding: 9px 0 7px 0; font-size: 14px; font-weight: 600; color: #1E1C1A;">${username}</td>
                      </tr>

                      <!-- Divider -->
                      <tr><td colspan="2" style="border-bottom: 1px dashed #ECE6DB; padding: 2px 0;"></td></tr>

                      <!-- Row 3: Validity Window (Claude Orange highlight) -->
                      <tr>
                        <td style="padding: 9px 0 7px 0; font-size: 13.5px; color: #786F64;">Link Validity</td>
                        <td align="right" style="padding: 9px 0 7px 0; font-size: 14px; font-weight: 700; color: #D96B43;">10 Minutes</td>
                      </tr>

                      <!-- Divider -->
                      <tr><td colspan="2" style="border-bottom: 1px dashed #ECE6DB; padding: 2px 0;"></td></tr>

                      <!-- Row 4: Status -->
                      <tr>
                        <td style="padding: 9px 0 2px 0; font-size: 13.5px; color: #786F64;">Security Status</td>
                        <td align="right" style="padding: 9px 0 2px 0; font-size: 13.5px; font-weight: 600; color: #2B2520;">Action Required</td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>

              <!-- 4. Claude Orange Action CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 26px;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" target="_blank" style="background-color: #D96B43; color: #FFFFFF; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 34px; border-radius: 9px; display: inline-block; letter-spacing: -0.2px; box-shadow: 0 4px 14px rgba(217, 107, 67, 0.3);">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- 5. Security Notice Box (MediConnect bottom box in Claude palette) -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FAF6EE; border-left: 4px solid #D96B43; border-radius: 6px;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <div style="font-size: 13.5px; font-weight: 700; color: #8C3E1F; margin-bottom: 4px;">
                      🔒 Security Advisory:
                    </div>
                    <div style="font-size: 13px; color: #695D4F; line-height: 1.55;">
                      This link is strictly one-time use and expires in <strong>10 minutes</strong>. If you did not request this reset, your account is safe and no action is needed.
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
    `;
};


const getOtpEmailTemplate = (username, otp) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Verify Your Email - PrepMatrix</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FBF9F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FBF9F5; padding: 30px 12px 50px 12px;">
    <tr>
      <td align="center">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; background-color: #FFFFFF; border-radius: 14px; overflow: hidden; border: 1px solid #ECE6DB; box-shadow: 0 4px 20px rgba(43, 37, 32, 0.05);">
          
          <!-- Top Header Bar -->
          <tr>
            <td style="background-color: #1E1C1A; padding: 22px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="42" valign="middle">
                    <div style="background-color: #D96B43; width: 36px; height: 36px; border-radius: 8px; text-align: center; line-height: 36px; color: #FFFFFF; font-weight: 800; font-size: 18px;">
                      ⚡
                    </div>
                  </td>
                  <td valign="middle" style="padding-left: 12px;">
                    <div style="font-size: 19px; font-weight: 700; color: #FBF9F5; letter-spacing: -0.3px;">PrepMatrix</div>
                    <div style="font-size: 12px; color: #A89F91; font-weight: 400; margin-top: 1px;">Account Verification</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 32px 28px 32px; background-color: #FFFFFF;">
              
              <div style="font-size: 11px; font-weight: 800; color: #D96B43; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
                CONFIRM YOUR EMAIL
              </div>

              <h1 style="margin: 0 0 16px 0; font-size: 26px; font-weight: 800; color: #1E1C1A; letter-spacing: -0.5px;">
                Verify Your Account
              </h1>

              <p style="margin: 0 0 12px 0; font-size: 15px; color: #2B2520; line-height: 1.6;">
                Hello <strong>${username}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14.5px; color: #574F46; line-height: 1.6;">
                Welcome to <strong>PrepMatrix</strong>! Please use the 6-digit verification code below to activate your account.
              </p>

              <!-- Big Bold OTP Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <div style="background-color: #FAF6EE; border: 2px dashed #D96B43; border-radius: 12px; padding: 18px 28px; display: inline-block;">
                      <span style="font-family: 'SF Pro Mono', Menlo, Consolas, monospace; font-size: 34px; font-weight: 800; color: #D96B43; letter-spacing: 8px; margin-left: 8px;">
                        ${otp}
                      </span>
                    </div>
                    <div style="font-size: 12.5px; color: #786F64; margin-top: 10px; font-weight: 500;">
                      Expires in <strong>5 minutes</strong> • Single use only
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FAF6EE; border-left: 4px solid #D96B43; border-radius: 6px;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <div style="font-size: 13.5px; font-weight: 700; color: #8C3E1F; margin-bottom: 4px;">
                      🔒 Security Note:
                    </div>
                    <div style="font-size: 13px; color: #695D4F; line-height: 1.55;">
                      Never share this code with anyone. PrepMatrix will never ask for your verification code.
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
    `;
};

module.exports = { 
    getPasswordResetTemplate,
    getOtpEmailTemplate 
};