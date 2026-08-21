namespace IquitosDelivery.Infrastructure.Otp;

public class PhoneOtpSettings
{
    public bool RequireForRegistration { get; set; }

    public WhatsAppOtpSettings WhatsApp { get; set; } = new();
}
