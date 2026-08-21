using IquitosDelivery.Domain.Common;
using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Domain.Entities;

public class User : BaseEntity
{
    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string? PhoneNormalized { get; set; }

    public bool IsPhoneVerified { get; set; }

    public DateTime? PhoneVerifiedAtUtc { get; set; }

    public string Email { get; set; } = string.Empty;

    public string IdentityDocumentType { get; set; } = "DNI";

    public string? IdentityDocumentNumber { get; set; }

    public string? IdentityDocumentNumberNormalized { get; set; }

    public string PasswordHash { get; set; } = string.Empty;

    public string? GoogleSubject { get; set; }

    public UserRole Role { get; set; }

    public UserStatus Status { get; set; }

    public CustomerProfile? CustomerProfile { get; set; }

    public DriverProfile? DriverProfile { get; set; }

    public CollaboratorProfile? CollaboratorProfile { get; set; }

    public CommunityCollaborator? CommunityCollaborator { get; set; }

    public ICollection<Restaurant> OwnedRestaurants { get; set; } = new List<Restaurant>();

    public ICollection<UserDeviceToken> DeviceTokens { get; set; } = new List<UserDeviceToken>();

    public ICollection<UserNotification> Notifications { get; set; } = new List<UserNotification>();

    public ICollection<UserLegalAcceptance> LegalAcceptances { get; set; } = new List<UserLegalAcceptance>();

    public ICollection<AccountDeletionRequest> AccountDeletionRequests { get; set; } = new List<AccountDeletionRequest>();
}
