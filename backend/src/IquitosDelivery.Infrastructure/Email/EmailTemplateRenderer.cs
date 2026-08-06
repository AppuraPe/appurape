using System.Net;
using Microsoft.Extensions.Options;

namespace IquitosDelivery.Infrastructure.Email;

public class EmailTemplateRenderer
{
    private readonly EmailSettings _settings;

    public EmailTemplateRenderer(IOptions<EmailSettings> settings)
    {
        _settings = settings.Value;
    }

    public string RenderVerificationCodeEmail(string recipientName, string code, int expiresInMinutes)
    {
        return RenderCodeEmail(
            title: "Tu código de verificación",
            eyebrow: "Registro AppuraPe",
            recipientName: recipientName,
            intro: "Usa este código para continuar con tu registro en AppuraPe.",
            code: code,
            expiresInMinutes: expiresInMinutes,
            footerNote: "Si no solicitaste este código, puedes ignorar este mensaje.");
    }

    public string RenderPasswordResetEmail(string recipientName, string code, int expiresInMinutes)
    {
        return RenderCodeEmail(
            title: "Recupera tu contraseña",
            eyebrow: "Seguridad AppuraPe",
            recipientName: recipientName,
            intro: "Recibimos una solicitud para actualizar tu contraseña en AppuraPe.",
            code: code,
            expiresInMinutes: expiresInMinutes,
            footerNote: "Si no solicitaste este cambio, puedes ignorar este correo con tranquilidad.");
    }

    private string RenderCodeEmail(
        string title,
        string eyebrow,
        string recipientName,
        string intro,
        string code,
        int expiresInMinutes,
        string footerNote)
    {
        var safeTitle = Encode(title);
        var safeEyebrow = Encode(eyebrow);
        var safeName = Encode(string.IsNullOrWhiteSpace(recipientName) ? "hola" : recipientName.Trim());
        var safeIntro = Encode(intro);
        var safeCode = Encode(code);
        var safeFooterNote = Encode(footerNote);
        var brandName = Encode(string.IsNullOrWhiteSpace(_settings.FromName) ? "AppuraPe" : _settings.FromName.Trim());
        var primaryColor = NormalizeColor(_settings.BrandPrimaryColor);
        var logoMarkup = BuildLogoMarkup(primaryColor, brandName);
        var supportMarkup = string.IsNullOrWhiteSpace(_settings.SupportEmail)
            ? string.Empty
            : $"""<p style="margin:12px 0 0;color:#94A3B8;font-size:12px;line-height:18px;">Soporte: <a href="mailto:{EncodeAttribute(_settings.SupportEmail)}" style="color:{primaryColor};text-decoration:none;">{Encode(_settings.SupportEmail)}</a></p>""";

        return $$"""
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>{{safeTitle}}</title>
  </head>
  <body style="margin:0;padding:0;background:#F8FAFC;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:#0F172A;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F8FAFC;margin:0;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#FFFFFF;border:1px solid #E5EAF2;border-radius:28px;box-shadow:0 18px 45px rgba(15,23,42,0.08);overflow:hidden;">
            <tr>
              <td style="padding:28px 24px 10px;text-align:center;">
                {{logoMarkup}}
                <p style="margin:18px 0 8px;color:{{primaryColor}};font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;">{{safeEyebrow}}</p>
                <h1 style="margin:0;color:#0F172A;font-size:26px;line-height:32px;font-weight:800;">{{safeTitle}}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 24px 0;">
                <p style="margin:0;color:#334155;font-size:16px;line-height:24px;">Hola {{safeName}},</p>
                <p style="margin:12px 0 0;color:#475569;font-size:15px;line-height:24px;">{{safeIntro}}</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px;">
                <div style="display:inline-block;background:#FFF3EA;border:1px solid #FED7AA;border-radius:22px;padding:18px 28px;">
                  <div style="color:{{primaryColor}};font-size:34px;line-height:40px;font-weight:900;letter-spacing:.18em;">{{safeCode}}</div>
                </div>
                <p style="margin:16px 0 0;color:#64748B;font-size:14px;line-height:22px;">Este código vence en <strong style="color:#0F172A;">{{expiresInMinutes}} minutos</strong>.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 28px;">
                <div style="border-radius:20px;background:#F8FAFC;border:1px solid #E5EAF2;padding:16px;">
                  <p style="margin:0;color:#64748B;font-size:13px;line-height:20px;">{{safeFooterNote}}</p>
                </div>
                {{supportMarkup}}
              </td>
            </tr>
          </table>
          <p style="margin:18px 0 0;color:#94A3B8;font-size:12px;line-height:18px;">{{brandName}} · AppuraPe</p>
        </td>
      </tr>
    </table>
  </body>
</html>
""";
    }

    private string BuildLogoMarkup(string primaryColor, string brandName)
    {
        if (!string.IsNullOrWhiteSpace(_settings.BrandLogoUrl))
        {
            return $"""<img src="{EncodeAttribute(_settings.BrandLogoUrl)}" alt="{brandName}" width="72" style="display:inline-block;width:72px;max-width:72px;height:auto;border:0;outline:none;text-decoration:none;">""";
        }

        return $"""<div style="display:inline-block;border-radius:22px;background:{primaryColor};color:#FFFFFF;padding:12px 18px;font-size:20px;line-height:24px;font-weight:900;letter-spacing:.01em;">{brandName}</div>""";
    }

    private static string NormalizeColor(string? color)
    {
        var value = string.IsNullOrWhiteSpace(color) ? "#F97316" : color.Trim();
        return value.StartsWith('#') && (value.Length == 4 || value.Length == 7)
            ? value
            : "#F97316";
    }

    private static string Encode(string value)
    {
        return WebUtility.HtmlEncode(value);
    }

    private static string EncodeAttribute(string value)
    {
        return WebUtility.HtmlEncode(value.Trim());
    }
}
