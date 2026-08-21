namespace IquitosDelivery.Application.Common;

public static class IdentityNormalization
{
    public const string DefaultIdentityDocumentType = "DNI";

    public static string NormalizeIdentityDocumentNumber(string? value)
    {
        return DigitsOnly(value);
    }

    public static bool IsValidPeruvianDni(string? value)
    {
        return NormalizeIdentityDocumentNumber(value).Length == 8;
    }

    public static string NormalizePeruvianMobilePhone(string? value)
    {
        var digits = DigitsOnly(value);

        if (digits.Length == 11 && digits.StartsWith("51", StringComparison.Ordinal))
        {
            return digits;
        }

        if (digits.Length == 9 && digits.StartsWith("9", StringComparison.Ordinal))
        {
            return $"51{digits}";
        }

        return digits;
    }

    public static bool IsValidPeruvianMobilePhone(string? value)
    {
        var normalized = NormalizePeruvianMobilePhone(value);
        return normalized.Length == 11
            && normalized.StartsWith("51", StringComparison.Ordinal)
            && normalized[2] == '9';
    }

    private static string DigitsOnly(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        return new string(value.Where(char.IsDigit).ToArray());
    }
}
