namespace IquitosDelivery.Application.Interfaces;

public record GoogleUserInfo(
    string Subject,
    string Email,
    bool EmailVerified,
    string GivenName,
    string FamilyName,
    string FullName
);
