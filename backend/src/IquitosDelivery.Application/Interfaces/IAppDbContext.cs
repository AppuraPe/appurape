using IquitosDelivery.Domain.Entities;

namespace IquitosDelivery.Application.Interfaces;

public interface IAppDbContext
{
    IQueryable<User> Users { get; }

    IQueryable<PendingCustomerRegistration> PendingCustomerRegistrations { get; }

    IQueryable<PendingRestaurantRegistration> PendingRestaurantRegistrations { get; }

    IQueryable<PendingDriverRegistration> PendingDriverRegistrations { get; }

    IQueryable<PasswordResetRequest> PasswordResetRequests { get; }

    IQueryable<PhoneOtpChallenge> PhoneOtpChallenges { get; }

    IQueryable<CustomerProfile> Customers { get; }

    IQueryable<CollaboratorProfile> CollaboratorProfiles { get; }

    IQueryable<CommunityCollaborator> CommunityCollaborators { get; }

    IQueryable<CustomerAddress> CustomerAddresses { get; }

    IQueryable<BusinessType> BusinessTypes { get; }

    IQueryable<PlatformSettings> PlatformSettings { get; }

    IQueryable<CommissionRule> CommissionRules { get; }

    IQueryable<FinancialMovement> FinancialMovements { get; }

    IQueryable<SettlementBatch> SettlementBatches { get; }

    IQueryable<SettlementItem> SettlementItems { get; }

    IQueryable<CollaboratorVerification> CollaboratorVerifications { get; }

    IQueryable<Restaurant> Restaurants { get; }

    IQueryable<DriverProfile> Drivers { get; }

    IQueryable<CommunityRoute> CommunityRoutes { get; }

    IQueryable<CommunityRequest> CommunityRequests { get; }

    IQueryable<CommunityRequestApplication> CommunityRequestApplications { get; }

    IQueryable<MenuCategory> MenuCategories { get; }

    IQueryable<MenuItem> MenuItems { get; }

    IQueryable<Order> Orders { get; }

    IQueryable<OrderDeliveryConfirmationAudit> OrderDeliveryConfirmationAudits { get; }

    IQueryable<Payment> Payments { get; }

    IQueryable<PaymentEvidence> PaymentEvidence { get; }

    IQueryable<FinancialObligation> FinancialObligations { get; }

    IQueryable<RefundRequest> RefundRequests { get; }

    IQueryable<RefundEvidence> RefundEvidence { get; }

    IQueryable<FinancialAuditEvent> FinancialAuditEvents { get; }

    IQueryable<UserDeviceToken> UserDeviceTokens { get; }

    IQueryable<UserNotification> UserNotifications { get; }

    IQueryable<LegalDocument> LegalDocuments { get; }

    IQueryable<UserLegalAcceptance> UserLegalAcceptances { get; }

    IQueryable<AccountDeletionRequest> AccountDeletionRequests { get; }

    IQueryable<OrderItem> OrderItems { get; }

    IQueryable<Zone> Zones { get; }

    void Add<TEntity>(TEntity entity)
        where TEntity : class;

    void Remove<TEntity>(TEntity entity)
        where TEntity : class;

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
