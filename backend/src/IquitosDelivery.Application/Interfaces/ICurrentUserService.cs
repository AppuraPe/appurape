namespace IquitosDelivery.Application.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }

    string? Email { get; }

    string? Role { get; }

    string? ActiveProfile => null;

    string? PrimaryRole => null;

    bool IsAuthenticated { get; }
}
