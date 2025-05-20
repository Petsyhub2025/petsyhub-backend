export const petsyTemplate = (name: string, content: string): string => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Email from PetsyHub</title>
  </head>
  <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4; padding: 20px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
            <tr>
              <td align="center" style="background-color:#f1efec; padding: 20px;">
                <img src="https://instapets-public-assets.s3.eu-central-1.amazonaws.com/logos/petsyhub_logo.png" alt="Petsy Logo" width="200">
              </td>
            </tr>
            <tr>
              <td style="padding: 30px; color: #333;">
                <h2>Hello ${name},</h2>
                ${content}
                <p>Best regards,<br><strong>PetsyHub Team</strong></p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 20px;">
                <a href="https://petsy.world" style="background-color:#f78903; color:#ffffff; padding: 12px 24px; text-decoration:none; border-radius:5px;">Visit Our Website</a>
              </td>
            </tr>
            <tr>
              <td align="center" style="background-color:#eeeeee; padding: 20px; font-size: 12px; color: #777;">
                &copy; 2025 Petsy. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
