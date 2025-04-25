using System.Net.Mail;

namespace backend.Utils;

public static class Notify {

    private static (string smtpHost, int smtpPort, string smtpUser, string smtpPass) SetupSmpt()
    {
        string smtpHost = Environment.GetEnvironmentVariable("SMTP_HOST") ?? "";
        int smtpPort    = int.Parse(Environment.GetEnvironmentVariable("SMTP_PORT") ?? "");
        string smtpUser = Environment.GetEnvironmentVariable("NO_REPLY_MAIL") ?? ""; // Votre adresse Gmail
        string smtpPass = Environment.GetEnvironmentVariable("NO_REPLY_MAIL_PASSWORD") ?? ""; // Mot de passe d'application Gmail
        return (smtpHost, smtpPort, smtpUser, smtpPass);
    }
    
    public static void SendVerificationEmail(string email, string verificationLink)
    {
        try
        {
            (string smtpHost, int smtpPort, string smtpUser, string smtpPass) = SetupSmpt();

            using MailMessage mail = new MailMessage();
            mail.From = new MailAddress(smtpUser, "Matcha");
            mail.To.Add(email);
            mail.Subject = "Verify Your Email Address";
            mail.Body = $@"
                    <html>
                    <body>
                        <h1>Welcome to Matcha!</h1>
                        <p>Click the link below to verify your email address:</p>
                        <a href='http://localhost:3000/auth/verify/{verificationLink}'>Verify Email</a>
                        <p>If you didn't request this, you can ignore this email.</p>
                    </body>
                    </html>";
            mail.IsBodyHtml = true;

            using SmtpClient smtp = new SmtpClient(smtpHost, smtpPort);
            smtp.Credentials = new System.Net.NetworkCredential(smtpUser, smtpPass);
            smtp.EnableSsl = true; // Sécurise la connexion
            smtp.Send(mail);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to send email: {ex.Message}");
            throw;
        }
    }

    public static void SendForgottenPasswordMail(string email, string forgottenPasswordLink)
    {
        try
        {
            (string smtpHost, int smtpPort, string smtpUser, string smtpPass) = SetupSmpt();

            using MailMessage mail = new MailMessage();
            mail.From = new MailAddress(smtpUser, "Matcha");
            mail.To.Add(email);
            mail.Subject = "Verify Your Email Address";
            
            mail.Body = $@"
                    <html>
                    <body>
                        <h1>Forgot your password ?</h1>
                        <p>Click the link below to create a new password:</p>
                        <a href='http://localhost:3000/Auth/forgottenpassword/{forgottenPasswordLink}'>Change password</a>
                        <p>This email is valid for 1 hour</p>
                        <p>If you didn't request this, you can ignore this email.</p>
                    </body>
                    </html>";
            mail.IsBodyHtml = true;

            using SmtpClient smtp = new SmtpClient(smtpHost, smtpPort);
            smtp.Credentials = new System.Net.NetworkCredential(smtpUser, smtpPass);
            smtp.EnableSsl = true; // Sécurise la connexion
            smtp.Send(mail);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to send email: {ex.Message}");
            throw;
        }
    }
}
