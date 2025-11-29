//using Airbnb.API.Services.Interfaces;
//using Azure.Core;
//using MailKit.Net.Smtp;
//using MailKit.Security;
//using MimeKit;
//using MimeKit.Text;
//using System.Net.Mail;

//public class EmailService : IEmailService
//{
//    private readonly IConfiguration _config;
//    public EmailService(IConfiguration config) { _config = config; }

//    public async Task SendEmailAsync(string toEmail, string subject, string body)
//    {
//        var email = new MimeMessage();
//        email.From.Add(new MailboxAddress(_config["EmailSettings:SenderName"], _config["EmailSettings:SenderEmail"]));
//        email.To.Add(MailboxAddress.Parse(toEmail));
//        email.Subject = subject;
//        var builder = new BodyBuilder();
//        builder.HtmlBody = body;
//        email.Body = builder.ToMessageBody();
//        //new TextPart(TextFormat.Html) { Text = body };

//        using var smtp = new SmtpClient();
//        // For Gmail, use "smtp.gmail.com", 587. You need an App Password.
//        await smtp.ConnectAsync(_config["EmailSettings:Server"], int.Parse(_config["EmailSettings:Port"]), SecureSocketOptions.StartTls);
//        await smtp.AuthenticateAsync(_config["EmailSettings:Username"], _config["EmailSettings:Password"]);
//        await smtp.SendAsync(email);
//        await smtp.DisconnectAsync(true);
//    }
//}

using Airbnb.API.Services.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Configuration; // تأكدي من وجود هذا السطر

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;
    public EmailService(IConfiguration config) { _config = config; }

    public async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        var email = new MimeMessage();
        email.From.Add(new MailboxAddress(_config["EmailSettings:SenderName"], _config["EmailSettings:SenderEmail"]));
        email.To.Add(MailboxAddress.Parse(toEmail));
        email.Subject = subject;
        var builder = new BodyBuilder();

        builder.HtmlBody = body;

        email.Body = builder.ToMessageBody();
        using var smtp = new MailKit.Net.Smtp.SmtpClient();

        try
        {
            await smtp.ConnectAsync(_config["EmailSettings:Server"], int.Parse(_config["EmailSettings:Port"]), SecureSocketOptions.StartTls);
            await smtp.AuthenticateAsync(_config["EmailSettings:Username"], _config["EmailSettings:Password"]);
            await smtp.SendAsync(email);
        }
        finally
        {
            await smtp.DisconnectAsync(true);
        }
    }
}