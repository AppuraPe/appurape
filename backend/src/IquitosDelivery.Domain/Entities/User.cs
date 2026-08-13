using IquitosDelivery.Domain.Common;
using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Domain.Entities;

public class User : BaseEntity
{
    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

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

    public ICollection<UserLegalAcceptance> LegalAcceptances { get; set; } = new List<UserLegalAcceptance>();

    public ICollection<AccountDeletionRequest> AccountDeletionRequests { get; set; } = new List<AccountDeletionRequest>();
}
