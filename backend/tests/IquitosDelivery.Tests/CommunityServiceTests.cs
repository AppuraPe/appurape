using FluentValidation;
using IquitosDelivery.Application.Common;
using IquitosDelivery.Application.DTOs.Community;
using IquitosDelivery.Application.DTOs.Notifications;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Application.Services;
using IquitosDelivery.Application.Validators;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using IquitosDelivery.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace IquitosDelivery.Tests;

public class CommunityServiceTests
{
    [Fact]
    public async Task Requester_CanCreateRequest_AndListItAsPublished()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedCommunityFixtureAsync(dbContext);
        var service = CreateCommunityService(dbContext, fixture.RequesterUserId, UserRole.Customer);

        var created = await service.CreateRequestAsync(new CreateCommunityRequestRequest
        {
            Type = CommunityRequestType.Errand,
            Title = "Comprar medicina",
            Description = "Necesito ayuda para recoger una receta.",
            OriginLabel = "Hospital Iquitos",
            OriginLatitude = -3.749120m,
            OriginLongitude = -73.253830m,
            DestinationLabel = "Belén",
            DestinationLatitude = -3.748920m,
            DestinationLongitude = -73.253700m,
            CompensationAmount = 12m
        });

        var listed = await service.GetRequestsAsync(new CommunityRequestQueryRequest { Mine = true });

        Assert.Equal("Published", created.Status);
        Assert.Single(listed);
        Assert.Equal(created.Id, listed[0].Id);
        Assert.Equal("Published", listed[0].Status);
        Assert.True(listed[0].IsMine);
    }

    [Fact]
    public async Task Driver_ListUsesPersonalMatchScore_InsteadOfStoredGlobalScore()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedCommunityFixtureAsync(dbContext);
        var requesterService = CreateCommunityService(dbContext, fixture.RequesterUserId, UserRole.Customer);
        var collaboratorService = CreateCommunityService(dbContext, fixture.CollaboratorUserId, UserRole.Driver);
        var created = await requesterService.CreateRequestAsync(CreateValidRequest());

        var listed = await collaboratorService.GetRequestsAsync(new CommunityRequestQueryRequest());

        var request = await dbContext.CommunityRequests.SingleAsync(x => x.Id == created.Id);
        var collaborator = await dbContext.CommunityCollaborators
            .Include(x => x.User)
            .Include(x => x.Routes)
            .SingleAsync(x => x.Id == fixture.CollaboratorId);
        var expectedScore = CommunityMatchingCalculator.BuildMatch(collaborator, request, matchedRoute: null).MatchScore;
        var listedRequest = Assert.Single(listed);

        Assert.Equal(0m, request.MatchScore);
        Assert.Equal(expectedScore, listedRequest.MatchScore);
        Assert.True(listedRequest.MatchScore > request.MatchScore);
    }

    [Fact]
    public async Task Collaborator_CanApply_AndRequester_CanSelect()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedCommunityFixtureAsync(dbContext);
        var requesterService = CreateCommunityService(dbContext, fixture.RequesterUserId, UserRole.Customer);
        var collaboratorService = CreateCommunityService(dbContext, fixture.CollaboratorUserId, UserRole.Driver);
        var created = await requesterService.CreateRequestAsync(CreateValidRequest());

        var applied = await collaboratorService.ApplyToRequestAsync(created.Id);
        var applicationId = Assert.Single(applied.Applications).ApplicationId;

        var selected = await requesterService.SelectApplicationAsync(created.Id, new SelectCommunityRequestApplicationRequest
        {
            ApplicationId = applicationId
        });

        Assert.Equal("Searching", applied.Status);
        Assert.Equal("Accepted", selected.Status);
        Assert.Equal(fixture.CollaboratorId, selected.AssignedCollaboratorId);
        Assert.Equal("Selected", Assert.Single(selected.Applications).Status);
    }

    [Fact]
    public async Task AssignedCollaborator_CanStart_Complete_AndRequesterCanConfirmAndRate()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedCommunityFixtureAsync(dbContext);
        var requesterService = CreateCommunityService(dbContext, fixture.RequesterUserId, UserRole.Customer);
        var collaboratorService = CreateCommunityService(dbContext, fixture.CollaboratorUserId, UserRole.Driver);
        var created = await requesterService.CreateRequestAsync(CreateValidRequest());
        var applied = await collaboratorService.ApplyToRequestAsync(created.Id);
        var selected = await requesterService.SelectApplicationAsync(created.Id, new SelectCommunityRequestApplicationRequest
        {
            ApplicationId = Assert.Single(applied.Applications).ApplicationId
        });

        var started = await collaboratorService.StartRequestAsync(created.Id);
        var completed = await collaboratorService.CompleteRequestAsync(created.Id, new CompleteCommunityRequestRequest
        {
            ConfirmationCode = selected.ConfirmationCode!
        }, proofImageUrl: "https://cdn.example.com/proof.jpg");
        var confirmed = await requesterService.ConfirmRequestAsync(created.Id);
        var rated = await requesterService.RateCollaboratorAsync(created.Id, new RateCommunityCollaboratorRequest
        {
            Rating = 5,
            Comment = "Excelente apoyo"
        });

        Assert.Equal("InProcess", started.Status);
        Assert.Equal("Delivered", completed.Status);
        Assert.Equal("Confirmed", confirmed.Status);
        Assert.NotNull(confirmed.ClientConfirmedAtUtc);
        Assert.Equal("Confirmed", rated.Status);
        Assert.Equal(5, rated.CollaboratorRating);
        Assert.Equal("Excelente apoyo", rated.CollaboratorFeedback);
    }

    [Fact]
    public async Task WrongActor_CannotConfirmOrAdvanceForeignRequest()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedCommunityFixtureAsync(dbContext);
        var requesterService = CreateCommunityService(dbContext, fixture.RequesterUserId, UserRole.Customer);
        var collaboratorService = CreateCommunityService(dbContext, fixture.CollaboratorUserId, UserRole.Driver);
        var outsiderService = CreateCommunityService(dbContext, fixture.OutsiderUserId, UserRole.Customer);
        var created = await requesterService.CreateRequestAsync(CreateValidRequest());
        var applied = await collaboratorService.ApplyToRequestAsync(created.Id);
        var selected = await requesterService.SelectApplicationAsync(created.Id, new SelectCommunityRequestApplicationRequest
        {
            ApplicationId = Assert.Single(applied.Applications).ApplicationId
        });

        await collaboratorService.StartRequestAsync(created.Id);
        await collaboratorService.CompleteRequestAsync(created.Id, new CompleteCommunityRequestRequest
        {
            ConfirmationCode = selected.ConfirmationCode!
        }, proofImageUrl: null);

        await Assert.ThrowsAsync<ForbiddenException>(() => outsiderService.ConfirmRequestAsync(created.Id));
        await Assert.ThrowsAsync<ForbiddenException>(() => outsiderService.CancelRequestAsync(created.Id, new CancelCommunityRequestRequest
        {
            Reason = "No me corresponde"
        }));
        await Assert.ThrowsAsync<ForbiddenException>(() => outsiderService.GetRequestMatchesAsync(created.Id));

        var outsiderDetail = await outsiderService.GetRequestByIdAsync(created.Id);
        Assert.Empty(outsiderDetail.Applications);
    }

    [Fact]
    public async Task InvalidState_BlocksTransition_AndConfirmedRequestCannotBeCancelled()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedCommunityFixtureAsync(dbContext);
        var requesterService = CreateCommunityService(dbContext, fixture.RequesterUserId, UserRole.Customer);
        var collaboratorService = CreateCommunityService(dbContext, fixture.CollaboratorUserId, UserRole.Driver);
        var created = await requesterService.CreateRequestAsync(CreateValidRequest());
        var applied = await collaboratorService.ApplyToRequestAsync(created.Id);
        var selected = await requesterService.SelectApplicationAsync(created.Id, new SelectCommunityRequestApplicationRequest
        {
            ApplicationId = Assert.Single(applied.Applications).ApplicationId
        });

        var confirmBeforeDelivery = await Assert.ThrowsAsync<AppException>(() => requesterService.ConfirmRequestAsync(created.Id));
        Assert.Equal("Community request must be delivered before confirmation.", confirmBeforeDelivery.Message);

        await collaboratorService.StartRequestAsync(created.Id);
        await collaboratorService.CompleteRequestAsync(created.Id, new CompleteCommunityRequestRequest
        {
            ConfirmationCode = selected.ConfirmationCode!
        }, proofImageUrl: null);
        await requesterService.ConfirmRequestAsync(created.Id);

        var cancelAfterConfirm = await Assert.ThrowsAsync<AppException>(() =>
            requesterService.CancelRequestAsync(created.Id, new CancelCommunityRequestRequest { Reason = "Tarde" }));

        Assert.Equal("Community request can no longer be cancelled.", cancelAfterConfirm.Message);
    }

    [Fact]
    public async Task Collaborator_CannotCompleteRequest_BeforeStartingIt()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedCommunityFixtureAsync(dbContext);
        var requesterService = CreateCommunityService(dbContext, fixture.RequesterUserId, UserRole.Customer);
        var collaboratorService = CreateCommunityService(dbContext, fixture.CollaboratorUserId, UserRole.Driver);
        var created = await requesterService.CreateRequestAsync(CreateValidRequest());
        var applied = await collaboratorService.ApplyToRequestAsync(created.Id);
        var selected = await requesterService.SelectApplicationAsync(created.Id, new SelectCommunityRequestApplicationRequest
        {
            ApplicationId = Assert.Single(applied.Applications).ApplicationId
        });

        var completeBeforeStart = await Assert.ThrowsAsync<AppException>(() =>
            collaboratorService.CompleteRequestAsync(created.Id, new CompleteCommunityRequestRequest
            {
                ConfirmationCode = selected.ConfirmationCode!
            }, proofImageUrl: null));

        Assert.Equal("Community request cannot be completed from the current status.", completeBeforeStart.Message);
    }

    [Fact]
    public async Task AssignedCollaborator_CanCancelBeforeDelivery()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedCommunityFixtureAsync(dbContext);
        var requesterService = CreateCommunityService(dbContext, fixture.RequesterUserId, UserRole.Customer);
        var collaboratorService = CreateCommunityService(dbContext, fixture.CollaboratorUserId, UserRole.Driver);
        var created = await requesterService.CreateRequestAsync(CreateValidRequest());
        var applied = await collaboratorService.ApplyToRequestAsync(created.Id);
        await requesterService.SelectApplicationAsync(created.Id, new SelectCommunityRequestApplicationRequest
        {
            ApplicationId = Assert.Single(applied.Applications).ApplicationId
        });

        var cancelled = await collaboratorService.CancelRequestAsync(created.Id, new CancelCommunityRequestRequest
        {
            Reason = "No podré llegar"
        });

        Assert.Equal("Cancelled", cancelled.Status);
        Assert.Equal("No podré llegar", cancelled.CancellationReason);
    }

    [Fact]
    public async Task Collaborator_Apply_NotifiesRequester()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedCommunityFixtureAsync(dbContext);
        var notifications = new Mock<INotificationService>(MockBehavior.Strict);
        notifications
            .Setup(x => x.SendToUserAsync(
                It.IsAny<Guid>(),
                It.IsAny<EventPushNotificationRequest>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        notifications
            .Setup(x => x.SendToUserAsync(
                fixture.RequesterUserId,
                It.Is<EventPushNotificationRequest>(request => request.Data != null && request.Data["event"] == "community_application_created"),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var requesterService = CreateCommunityService(dbContext, fixture.RequesterUserId, UserRole.Customer);
        var collaboratorService = CreateCommunityService(dbContext, fixture.CollaboratorUserId, UserRole.Driver, notifications.Object);
        var created = await requesterService.CreateRequestAsync(CreateValidRequest());

        await collaboratorService.ApplyToRequestAsync(created.Id);

        notifications.Verify(x => x.SendToUserAsync(
            fixture.RequesterUserId,
            It.Is<EventPushNotificationRequest>(request => request.Data != null && request.Data["event"] == "community_application_created"),
            It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Requester_SelectsCollaborator_NotifiesCollaborator()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedCommunityFixtureAsync(dbContext);
        var notifications = new Mock<INotificationService>(MockBehavior.Strict);
        notifications
            .Setup(x => x.SendToUsersAsync(
                It.IsAny<IEnumerable<Guid>>(),
                It.IsAny<EventPushNotificationRequest>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        notifications
            .Setup(x => x.SendToUserAsync(
                It.IsAny<Guid>(),
                It.IsAny<EventPushNotificationRequest>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        notifications
            .Setup(x => x.SendToUserAsync(
                fixture.CollaboratorUserId,
                It.Is<EventPushNotificationRequest>(request => request.Data != null && request.Data["event"] == "community_collaborator_selected"),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var requesterService = CreateCommunityService(dbContext, fixture.RequesterUserId, UserRole.Customer, notifications.Object);
        var collaboratorService = CreateCommunityService(dbContext, fixture.CollaboratorUserId, UserRole.Driver);
        var created = await requesterService.CreateRequestAsync(CreateValidRequest());
        var applied = await collaboratorService.ApplyToRequestAsync(created.Id);

        await requesterService.SelectApplicationAsync(created.Id, new SelectCommunityRequestApplicationRequest
        {
            ApplicationId = Assert.Single(applied.Applications).ApplicationId
        });

        notifications.Verify(x => x.SendToUserAsync(
            fixture.CollaboratorUserId,
            It.Is<EventPushNotificationRequest>(request => request.Data != null && request.Data["event"] == "community_collaborator_selected"),
            It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Collaborator_CompletesRequest_NotifiesRequester()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedCommunityFixtureAsync(dbContext);
        var notifications = new Mock<INotificationService>(MockBehavior.Strict);
        notifications
            .Setup(x => x.SendToUserAsync(
                It.IsAny<Guid>(),
                It.IsAny<EventPushNotificationRequest>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        notifications
            .Setup(x => x.SendToUserAsync(
                fixture.RequesterUserId,
                It.Is<EventPushNotificationRequest>(request => request.Data != null && request.Data["event"] == "community_delivered"),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var requesterService = CreateCommunityService(dbContext, fixture.RequesterUserId, UserRole.Customer);
        var collaboratorService = CreateCommunityService(dbContext, fixture.CollaboratorUserId, UserRole.Driver, notifications.Object);
        var created = await requesterService.CreateRequestAsync(CreateValidRequest());
        var applied = await collaboratorService.ApplyToRequestAsync(created.Id);
        var selected = await requesterService.SelectApplicationAsync(created.Id, new SelectCommunityRequestApplicationRequest
        {
            ApplicationId = Assert.Single(applied.Applications).ApplicationId
        });

        await collaboratorService.StartRequestAsync(created.Id);
        await collaboratorService.CompleteRequestAsync(created.Id, new CompleteCommunityRequestRequest
        {
            ConfirmationCode = selected.ConfirmationCode!
        }, proofImageUrl: null);

        notifications.Verify(x => x.SendToUserAsync(
            fixture.RequesterUserId,
            It.Is<EventPushNotificationRequest>(request => request.Data != null && request.Data["event"] == "community_delivered"),
            It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Requester_CannotRateCollaborator_Twice()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedCommunityFixtureAsync(dbContext);
        var requesterService = CreateCommunityService(dbContext, fixture.RequesterUserId, UserRole.Customer);
        var collaboratorService = CreateCommunityService(dbContext, fixture.CollaboratorUserId, UserRole.Driver);
        var created = await requesterService.CreateRequestAsync(CreateValidRequest());
        var applied = await collaboratorService.ApplyToRequestAsync(created.Id);
        var selected = await requesterService.SelectApplicationAsync(created.Id, new SelectCommunityRequestApplicationRequest
        {
            ApplicationId = Assert.Single(applied.Applications).ApplicationId
        });

        await collaboratorService.StartRequestAsync(created.Id);
        await collaboratorService.CompleteRequestAsync(created.Id, new CompleteCommunityRequestRequest
        {
            ConfirmationCode = selected.ConfirmationCode!
        }, proofImageUrl: null);
        await requesterService.ConfirmRequestAsync(created.Id);
        await requesterService.RateCollaboratorAsync(created.Id, new RateCommunityCollaboratorRequest
        {
            Rating = 5,
            Comment = "Muy bien"
        });

        var secondRating = await Assert.ThrowsAsync<AppException>(() =>
            requesterService.RateCollaboratorAsync(created.Id, new RateCommunityCollaboratorRequest
            {
                Rating = 4,
                Comment = "No deberia reemplazar"
            }));

        Assert.Equal("Community request has already been rated.", secondRating.Message);
    }

    private static CommunityService CreateCommunityService(AppDbContext dbContext, Guid userId, UserRole role, INotificationService? notificationService = null)
    {
        return new CommunityService(
            dbContext,
            new TestCurrentUserService(userId, role.ToString()),
            notificationService ?? Mock.Of<INotificationService>(),
            new CreateCommunityRequestRequestValidator(),
            new UpdateCommunityCollaboratorRequestValidator(),
            new UpsertCommunityRouteRequestValidator(),
            new CompleteCommunityRequestRequestValidator(),
            new RateCommunityCollaboratorRequestValidator());
    }

    private static AppDbContext CreateDbContext(string? databaseName = null)
    {
        return new AppDbContext(
            new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName ?? Guid.NewGuid().ToString("N"))
                .Options);
    }

    private static CreateCommunityRequestRequest CreateValidRequest()
    {
        return new CreateCommunityRequestRequest
        {
            Type = CommunityRequestType.Errand,
            Title = "Recoger encargo",
            Description = "Necesito ayuda con un recado corto.",
            OriginLabel = "Mercado Modelo",
            OriginLatitude = -3.749120m,
            OriginLongitude = -73.253830m,
            DestinationLabel = "Belén",
            DestinationLatitude = -3.748920m,
            DestinationLongitude = -73.253700m,
            CompensationAmount = 15m,
            EstimatedPurchaseAmount = 5m,
            DeadlineUtc = DateTime.UtcNow.AddHours(4)
        };
    }

    private static async Task<(Guid RequesterUserId, Guid CollaboratorUserId, Guid CollaboratorId, Guid OutsiderUserId)> SeedCommunityFixtureAsync(AppDbContext dbContext)
    {
        var requesterUserId = Guid.NewGuid();
        var collaboratorUserId = Guid.NewGuid();
        var outsiderUserId = Guid.NewGuid();
        var collaboratorId = Guid.NewGuid();

        var requester = new User
        {
            Id = requesterUserId,
            FirstName = "Cliente",
            LastName = "Community",
            Phone = "900000101",
            Email = "community-requester@appurape.test",
            PasswordHash = "hash",
            Role = UserRole.Customer,
            Status = UserStatus.Active
        };

        var collaboratorUser = new User
        {
            Id = collaboratorUserId,
            FirstName = "Helper",
            LastName = "Driver",
            Phone = "900000102",
            Email = "community-helper@appurape.test",
            PasswordHash = "hash",
            Role = UserRole.Driver,
            Status = UserStatus.Active,
            CollaboratorProfile = new CollaboratorProfile
            {
                Id = Guid.NewGuid(),
                ApprovalStatus = ApprovalStatus.Approved,
                IsIdentityVerified = true,
                IsPhoneVerified = true
            }
        };

        collaboratorUser.CommunityCollaborator = new CommunityCollaborator
        {
            Id = collaboratorId,
            UserId = collaboratorUserId,
            User = collaboratorUser,
            IsAvailable = true,
            AvailabilityStatus = CommunityAvailabilityStatus.Available,
            CurrentLatitude = -3.749120m,
            CurrentLongitude = -73.253830m,
            AvailabilityRadiusKm = 8m,
            TrustScore = 85m,
            CompletedCollaborations = 3,
            CollaborationRating = 4.8m,
            CommunityAcceptanceRate = 100m,
            CommunityCancellationRate = 0m,
            CollaborationLevel = CommunityCollaborationLevel.Verified
        };

        var outsider = new User
        {
            Id = outsiderUserId,
            FirstName = "Otro",
            LastName = "Usuario",
            Phone = "900000103",
            Email = "community-outsider@appurape.test",
            PasswordHash = "hash",
            Role = UserRole.Customer,
            Status = UserStatus.Active
        };

        dbContext.Users.AddRange(requester, collaboratorUser, outsider);
        await dbContext.SaveChangesAsync();

        return (requesterUserId, collaboratorUserId, collaboratorId, outsiderUserId);
    }

    private sealed class TestCurrentUserService(Guid userId, string role) : ICurrentUserService
    {
        public Guid? UserId => userId;
        public string? Email => $"{userId}@appurape.test";
        public string? Role => role;
        public bool IsAuthenticated => true;
    }
}
