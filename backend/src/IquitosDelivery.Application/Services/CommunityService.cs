using FluentValidation;
using IquitosDelivery.Application.Common;
using IquitosDelivery.Application.DTOs.Community;
using IquitosDelivery.Application.DTOs.Notifications;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using IquitosDelivery.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Security.Cryptography;
using System.Text;

namespace IquitosDelivery.Application.Services;

public class CommunityService : ICommunityService
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly INotificationService _notificationService;
    private readonly IValidator<CreateCommunityRequestRequest> _createRequestValidator;
    private readonly IValidator<UpdateCommunityCollaboratorRequest> _updateCollaboratorValidator;
    private readonly IValidator<UpsertCommunityRouteRequest> _upsertRouteValidator;
    private readonly IValidator<CompleteCommunityRequestRequest> _completeRequestValidator;
    private readonly IValidator<RateCommunityCollaboratorRequest> _rateValidator;
    private readonly IOrderDeliveryConfirmationService? _deliveryConfirmationService;
    private readonly IFinanceSecurityService? _financeSecurityService;
    private readonly byte[]? _communityConfirmationKey;
    private readonly bool _financeV2Enabled;

    public CommunityService(
        IAppDbContext dbContext,
        ICurrentUserService currentUserService,
        INotificationService notificationService,
        IValidator<CreateCommunityRequestRequest> createRequestValidator,
        IValidator<UpdateCommunityCollaboratorRequest> updateCollaboratorValidator,
        IValidator<UpsertCommunityRouteRequest> upsertRouteValidator,
        IValidator<CompleteCommunityRequestRequest> completeRequestValidator,
        IValidator<RateCommunityCollaboratorRequest> rateValidator,
        IOrderDeliveryConfirmationService? deliveryConfirmationService = null,
        IFinanceSecurityService? financeSecurityService = null,
        IConfiguration? configuration = null)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _notificationService = notificationService;
        _createRequestValidator = createRequestValidator;
        _updateCollaboratorValidator = updateCollaboratorValidator;
        _upsertRouteValidator = upsertRouteValidator;
        _completeRequestValidator = completeRequestValidator;
        _rateValidator = rateValidator;
        _deliveryConfirmationService = deliveryConfirmationService;
        _financeSecurityService = financeSecurityService;
        var configuredSecret = configuration?["OrderConfirmation:Key"] ?? configuration?["OrderConfirmation__Key"] ?? configuration?["Jwt:Key"];
        if (!string.IsNullOrWhiteSpace(configuredSecret) && Encoding.UTF8.GetByteCount(configuredSecret) >= 32)
            _communityConfirmationKey = SHA256.HashData(Encoding.UTF8.GetBytes(configuredSecret));
        _financeV2Enabled = bool.TryParse(configuration?["FinanceV2:Enabled"], out var enabled) && enabled;
    }

    public async Task<CommunityCollaboratorResponse> GetMyCollaboratorProfileAsync(CancellationToken cancellationToken = default)
    {
        var collaborator = await GetOrCreateCollaboratorAsync(cancellationToken);
        await RefreshCollaboratorMetricsAsync(collaborator, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return MapCollaborator(collaborator);
    }

    public async Task<CommunityCollaboratorResponse> UpdateMyCollaboratorProfileAsync(UpdateCommunityCollaboratorRequest request, CancellationToken cancellationToken = default)
    {
        await _updateCollaboratorValidator.ValidateAndThrowAsync(request, cancellationToken);

        var collaborator = await GetOrCreateCollaboratorAsync(cancellationToken);
        if (request.IsAvailable || request.AvailabilityStatus == CommunityAvailabilityStatus.Available)
        {
            EnsureCollaboratorIdentityIsApproved(collaborator);
        }

        collaborator.IsAvailable = request.IsAvailable;
        collaborator.AvailabilityStatus = request.IsAvailable ? request.AvailabilityStatus : CommunityAvailabilityStatus.Disconnected;
        collaborator.CurrentLatitude = request.CurrentLatitude;
        collaborator.CurrentLongitude = request.CurrentLongitude;
        collaborator.AvailabilityRadiusKm = request.AvailabilityRadiusKm;
        collaborator.AvailableFromUtc = request.AvailableFromUtc;
        collaborator.AvailableUntilUtc = request.AvailableUntilUtc;

        await RefreshCollaboratorMetricsAsync(collaborator, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return MapCollaborator(collaborator);
    }

    public async Task<IReadOnlyList<CommunityRouteResponse>> GetMyRoutesAsync(CancellationToken cancellationToken = default)
    {
        var collaborator = await GetOrCreateCollaboratorAsync(cancellationToken);

        return await _dbContext.CommunityRoutes
            .Where(x => x.CommunityCollaboratorId == collaborator.Id)
            .OrderByDescending(x => x.IsActive)
            .ThenByDescending(x => x.StartsAtUtc)
            .Select(x => MapRoute(x))
            .ToListAsync(cancellationToken);
    }

    public async Task<CommunityRouteResponse> UpsertMyRouteAsync(Guid? routeId, UpsertCommunityRouteRequest request, CancellationToken cancellationToken = default)
    {
        await _upsertRouteValidator.ValidateAndThrowAsync(request, cancellationToken);

        var collaborator = await GetOrCreateCollaboratorAsync(cancellationToken);
        CommunityRoute route;

        if (routeId.HasValue)
        {
            route = await _dbContext.CommunityRoutes
                .FirstOrDefaultAsync(x => x.Id == routeId.Value && x.CommunityCollaboratorId == collaborator.Id, cancellationToken)
                ?? throw new NotFoundException("Community route was not found.");
        }
        else
        {
            route = new CommunityRoute
            {
                Id = Guid.NewGuid(),
                CommunityCollaboratorId = collaborator.Id,
                CommunityCollaborator = collaborator
            };

            _dbContext.Add(route);
        }

        route.OriginLabel = request.OriginLabel.Trim();
        route.OriginLatitude = request.OriginLatitude;
        route.OriginLongitude = request.OriginLongitude;
        route.DestinationLabel = request.DestinationLabel.Trim();
        route.DestinationLatitude = request.DestinationLatitude;
        route.DestinationLongitude = request.DestinationLongitude;
        route.EstimatedMinutes = request.EstimatedMinutes;
        route.DeviationRadiusKm = request.DeviationRadiusKm;
        route.IsActive = request.IsActive;
        route.StartsAtUtc = request.StartsAtUtc;
        route.EndsAtUtc = request.EndsAtUtc;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return MapRoute(route);
    }

    public async Task<IReadOnlyList<CommunityRequestListItemResponse>> GetRequestsAsync(CommunityRequestQueryRequest request, CancellationToken cancellationToken = default)
    {
        EnsureAuthenticated();
        var userId = _currentUserService.UserId!.Value;
        var search = SearchQuery.Normalize(request.Q);

        var query = _dbContext.CommunityRequests.AsQueryable();

        if (request.Status.HasValue)
        {
            query = query.Where(x => x.Status == request.Status.Value);
        }

        if (request.Type.HasValue)
        {
            query = query.Where(x => x.Type == request.Type.Value);
        }

        var normalizedView = request.View?.Trim().ToLowerInvariant();
        if (normalizedView == "my" || request.Mine)
        {
            query = query.Where(x => x.CreatedByUserId == userId);
        }
        else if (normalizedView == "available")
        {
            query = query.Where(x =>
                x.CreatedByUserId != userId &&
                x.AssignedCollaboratorId == null &&
                (x.Status == CommunityRequestStatus.Published || x.Status == CommunityRequestStatus.Searching));
        }
        else if (normalizedView is "assigned" or "taken" or "my-assignments")
        {
            query = query.Where(x =>
                x.AssignedCollaborator != null &&
                x.AssignedCollaborator.UserId == userId &&
                (x.Status == CommunityRequestStatus.Accepted || x.Status == CommunityRequestStatus.InProcess || x.Status == CommunityRequestStatus.Delivered));
        }
        else if (normalizedView == "history")
        {
            query = query.Where(x =>
                (x.CreatedByUserId == userId || (x.AssignedCollaborator != null && x.AssignedCollaborator.UserId == userId)) &&
                (x.Status == CommunityRequestStatus.Confirmed || x.Status == CommunityRequestStatus.Cancelled));
        }
        else if (_currentUserService.ActiveProfile == UserProfiles.Customer)
        {
            query = query.Where(x => x.CreatedByUserId == userId);
        }

        if (search is not null)
        {
            query = query.Where(x =>
                x.Title.ToLower().Contains(search) ||
                x.Description.ToLower().Contains(search) ||
                x.OriginLabel.ToLower().Contains(search) ||
                x.DestinationLabel.ToLower().Contains(search));
        }

        var requests = await query
            .Include(x => x.CreatedByUser)
            .Include(x => x.Order)
            .Include(x => x.AssignedCollaborator)
                .ThenInclude(x => x!.User)
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        var currentCollaborator = await _dbContext.CommunityCollaborators
            .Include(x => x.User)
            .Include(x => x.Routes)
            .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);

        return requests
            .Select(x => MapRequestListItem(x, userId, currentCollaborator))
            .ToList();
    }

    public async Task<CommunityRequestDetailResponse> GetRequestByIdAsync(Guid requestId, CancellationToken cancellationToken = default)
    {
        EnsureAuthenticated();
        var currentUserId = _currentUserService.UserId!.Value;
        var request = await _dbContext.CommunityRequests
            .Include(x => x.CreatedByUser)
            .Include(x => x.Order)
            .Include(x => x.AssignedCollaborator)
                .ThenInclude(x => x!.User)
            .Include(x => x.Applications)
                .ThenInclude(x => x.Collaborator)
                    .ThenInclude(x => x.User)
            .Include(x => x.Applications)
                .ThenInclude(x => x.Collaborator)
                    .ThenInclude(x => x.User)
                        .ThenInclude(x => x.CollaboratorProfile)
            .FirstOrDefaultAsync(x => x.Id == requestId, cancellationToken)
            ?? throw new NotFoundException("Community request was not found.");

        return MapRequestDetail(request, currentUserId);
    }

    public async Task<CommunityRequestDetailResponse> CreateRequestAsync(CreateCommunityRequestRequest request, CancellationToken cancellationToken = default)
    {
        await _createRequestValidator.ValidateAndThrowAsync(request, cancellationToken);
        var user = await GetCurrentActiveUserAsync(cancellationToken);
        var commissionRules = await GetActiveCommissionRulesAsync(CommissionRuleScope.CommunityRequest, cancellationToken);
        var minimumFavorAmount = ResolveRuleAmount(commissionRules, FinancialRuleCodes.SimpleFavorMinimum, 2m);
        if (request.CompensationAmount < minimumFavorAmount)
        {
            throw new AppException($"El pago al colaborador debe ser como mínimo S/ {minimumFavorAmount:0.00}.");
        }

        var financialBreakdown = FinancialCalculator.CalculateCommunityRequest(
            request.CompensationAmount,
            request.EstimatedPurchaseAmount,
            commissionRules);

        var communityRequest = new CommunityRequest
        {
            Id = Guid.NewGuid(),
            CreatedByUserId = user.Id,
            CreatedByUser = user,
            Type = request.Type,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            OriginLabel = request.OriginLabel.Trim(),
            OriginLatitude = request.OriginLatitude,
            OriginLongitude = request.OriginLongitude,
            DestinationLabel = request.DestinationLabel.Trim(),
            DestinationLatitude = request.DestinationLatitude,
            DestinationLongitude = request.DestinationLongitude,
            CompensationAmount = request.CompensationAmount,
            EstimatedPurchaseAmount = financialBreakdown.EstimatedPurchaseAmount,
            FavorPlatformCommissionAmount = financialBreakdown.FavorPlatformCommissionAmount,
            CollaboratorEarningAmount = financialBreakdown.CollaboratorEarningAmount,
            TotalClientAmount = financialBreakdown.TotalClientAmount,
            PlatformRevenueAmount = financialBreakdown.PlatformRevenueAmount,
            PricingSnapshotJson = FinancialCalculator.SerializeCommunitySnapshot(financialBreakdown, commissionRules),
            DeadlineUtc = request.DeadlineUtc,
            Status = CommunityRequestStatus.Published,
            MatchScore = 0m,
            ConfirmationCode = null,
            ConfirmationCodeVersion = 1,
            ConfirmationCodeExpiresAtUtc = request.DeadlineUtc < DateTime.UtcNow.AddHours(24) ? request.DeadlineUtc : DateTime.UtcNow.AddHours(24)
        };

        _dbContext.Add(communityRequest);
        if (!_financeV2Enabled) CreateCommunityFinancialMovements(communityRequest);
        if (_financeSecurityService is not null) await _financeSecurityService.CreateFavorObligationAsync(communityRequest, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await NotifyPublishedRequestAsync(communityRequest, cancellationToken);

        return await GetRequestByIdAsync(communityRequest.Id, cancellationToken);
    }

    public async Task<IReadOnlyList<CommunityRequestMatchResponse>> GetRequestMatchesAsync(Guid requestId, CancellationToken cancellationToken = default)
    {
        EnsureAuthenticated();
        var currentUserId = _currentUserService.UserId!.Value;
        var request = await _dbContext.CommunityRequests
            .FirstOrDefaultAsync(x => x.Id == requestId, cancellationToken)
            ?? throw new NotFoundException("Community request was not found.");

        if (request.CreatedByUserId != currentUserId)
        {
            throw new ForbiddenException("Only the requester can review collaborator matches.");
        }

        var applications = await _dbContext.CommunityRequestApplications
            .Where(x => x.CommunityRequestId == requestId)
            .ToListAsync(cancellationToken);

        var collaborators = await _dbContext.CommunityCollaborators
            .Include(x => x.User)
            .ThenInclude(x => x.CollaboratorProfile)
            .Include(x => x.Routes)
            .Where(x =>
                x.UserId != request.CreatedByUserId &&
                x.User.Status == UserStatus.Active &&
                x.IsAvailable &&
                x.AvailabilityStatus == CommunityAvailabilityStatus.Available)
            .ToListAsync(cancellationToken);

        var matches = collaborators
            .Select(collaborator =>
            {
                var route = collaborator.Routes
                    .Where(x => x.IsActive)
                    .FirstOrDefault(x => CommunityMatchingCalculator.IsRouteCompatible(x, request));
                var match = CommunityMatchingCalculator.BuildMatch(collaborator, request, route);
                var application = applications.FirstOrDefault(x => x.CollaboratorId == collaborator.Id);
                match.ExistingApplicationId = application?.Id;
                match.ApplicationStatus = application?.Status.ToString();
                return match;
            })
            .Where(x => x.HasRouteMatch || x.DistanceKm <= x.AvailabilityRadiusKm)
            .OrderByDescending(x => x.HasRouteMatch)
            .ThenByDescending(x => x.MatchScore)
            .ToList();

        if (request.Status == CommunityRequestStatus.Published && matches.Count > 0)
        {
            request.Status = CommunityRequestStatus.Searching;
            request.MatchScore = matches[0].MatchScore;
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return matches;
    }

    public async Task<CommunityRequestDetailResponse> ApplyToRequestAsync(Guid requestId, CancellationToken cancellationToken = default)
    {
        var collaborator = await GetOrCreateCollaboratorAsync(cancellationToken);
        EnsureCollaboratorCanOperate(collaborator);

        var request = await _dbContext.CommunityRequests
            .FirstOrDefaultAsync(x => x.Id == requestId, cancellationToken)
            ?? throw new NotFoundException("Community request was not found.");

        if (request.CreatedByUserId == collaborator.UserId)
        {
            throw new AppException("You cannot apply to your own community request.");
        }

        if (request.Status != CommunityRequestStatus.Published && request.Status != CommunityRequestStatus.Searching)
        {
            throw new AppException("Community request is no longer accepting applications.");
        }

        var route = await FindBestRouteAsync(collaborator, request, cancellationToken);
        var match = CommunityMatchingCalculator.BuildMatch(collaborator, request, route);

        var application = await _dbContext.CommunityRequestApplications
            .FirstOrDefaultAsync(x => x.CommunityRequestId == requestId && x.CollaboratorId == collaborator.Id, cancellationToken);

        if (application is null)
        {
            application = new CommunityRequestApplication
            {
                Id = Guid.NewGuid(),
                CommunityRequestId = requestId,
                CommunityRequest = request,
                CollaboratorId = collaborator.Id,
                Collaborator = collaborator,
                AppliedAtUtc = DateTime.UtcNow
            };

            _dbContext.Add(application);
        }

        application.RouteId = route?.Id;
        application.MatchScore = match.MatchScore;
        application.DistanceKm = match.DistanceKm;
        application.EstimatedMinutes = match.EstimatedMinutes;
        application.HasRouteMatch = match.HasRouteMatch;
        application.Status = CommunityRequestApplicationStatus.Pending;
        application.ReviewedAtUtc = null;

        request.Status = CommunityRequestStatus.Searching;
        request.MatchScore = Math.Max(request.MatchScore, match.MatchScore);

        await _dbContext.SaveChangesAsync(cancellationToken);
        await NotifyRequesterAboutApplicationAsync(request, collaborator, cancellationToken);
        return await GetRequestByIdAsync(requestId, cancellationToken);
    }

    public async Task<CommunityRequestDetailResponse> SelectApplicationAsync(
        Guid requestId,
        SelectCommunityRequestApplicationRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await GetCurrentActiveUserAsync(cancellationToken);
        var communityRequest = await _dbContext.CommunityRequests
            .FirstOrDefaultAsync(x => x.Id == requestId, cancellationToken)
            ?? throw new NotFoundException("Community request was not found.");

        if (communityRequest.CreatedByUserId != user.Id)
        {
            throw new ForbiddenException("Only the requester can select a collaborator.");
        }

        if (communityRequest.Status != CommunityRequestStatus.Published && communityRequest.Status != CommunityRequestStatus.Searching)
        {
            throw new AppException("Community request is no longer accepting collaborator selection.");
        }

        var selectedApplication = await _dbContext.CommunityRequestApplications
            .Include(x => x.Collaborator)
                .ThenInclude(x => x.User)
            .FirstOrDefaultAsync(x => x.Id == request.ApplicationId && x.CommunityRequestId == requestId, cancellationToken)
            ?? throw new NotFoundException("Community request application was not found.");

        if (selectedApplication.Status == CommunityRequestApplicationStatus.Withdrawn)
        {
            throw new AppException("The selected application is no longer active.");
        }

        var applications = await _dbContext.CommunityRequestApplications
            .Where(x => x.CommunityRequestId == requestId)
            .ToListAsync(cancellationToken);

        foreach (var application in applications)
        {
            application.Status = application.Id == selectedApplication.Id
                ? CommunityRequestApplicationStatus.Selected
                : CommunityRequestApplicationStatus.Rejected;
            application.ReviewedAtUtc = DateTime.UtcNow;
        }

        communityRequest.AssignedCollaboratorId = selectedApplication.CollaboratorId;
        communityRequest.AssignedRouteId = selectedApplication.RouteId;
        communityRequest.Status = CommunityRequestStatus.Accepted;
        communityRequest.AcceptedAtUtc = DateTime.UtcNow;
        communityRequest.MatchScore = selectedApplication.MatchScore;
        if (communityRequest.OrderId.HasValue)
        {
            communityRequest.PickupCode = null;
            communityRequest.PickupCodeVersion = Math.Max(1, communityRequest.PickupCodeVersion + 1);
            communityRequest.PickupCodeFailedAttempts = 0;
            communityRequest.PickupCodeLockedAtUtc = null;
            communityRequest.PickupCodeExpiresAtUtc = DateTime.UtcNow.AddHours(12);
        }

        if (communityRequest.OrderId.HasValue)
        {
            var order = await _dbContext.Orders.FirstAsync(x => x.Id == communityRequest.OrderId.Value, cancellationToken);
            if (order.AssignedCourierUserId.HasValue || order.DriverId.HasValue)
                throw new AppException("Este pedido ya fue tomado por otro repartidor.");
            if (order.DeliveryMode != DeliveryMode.CommunityCollaboratorDelivery)
                throw new AppException("El pedido ya no está disponible para entrega por colaborador.");
            order.AssignedCourierUserId = selectedApplication.Collaborator.UserId;
            order.AssignedCourierType = CourierType.Collaborator;
            if (order.Status == OrderStatus.ReadyForPickup) order.Status = OrderStatus.Assigned;
        }

        selectedApplication.Collaborator.IsAvailable = false;
        selectedApplication.Collaborator.AvailabilityStatus = CommunityAvailabilityStatus.Busy;
        await AssignCollaboratorFinancialMovementsAsync(communityRequest.Id, selectedApplication.Collaborator.UserId, cancellationToken);
        if (_financeSecurityService is not null) await _financeSecurityService.AssignFavorCollaboratorAsync(communityRequest.Id, selectedApplication.Collaborator.UserId, cancellationToken);

        await RefreshCollaboratorMetricsAsync(selectedApplication.Collaborator, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await NotifyCollaboratorSelectedAsync(communityRequest, selectedApplication.Collaborator.UserId, cancellationToken);
        await NotifyBusinessAboutSelectedCollaboratorAsync(communityRequest, cancellationToken);

        return await GetRequestByIdAsync(requestId, cancellationToken);
    }

    public async Task<CommunityRequestDetailResponse> AcceptRequestAsync(Guid requestId, CancellationToken cancellationToken = default)
    {
        return await ApplyToRequestAsync(requestId, cancellationToken);
    }

    public async Task<CommunityRequestDetailResponse> StartRequestAsync(Guid requestId, CancellationToken cancellationToken = default)
    {
        var collaborator = await GetOrCreateCollaboratorAsync(cancellationToken);
        var request = await GetAssignedRequestAsync(requestId, collaborator.Id, cancellationToken);

        if (request.Status != CommunityRequestStatus.Accepted)
        {
            throw new AppException("Community request cannot be started from the current status.");
        }

        if (request.OrderId.HasValue)
        {
            throw new AppException("El negocio debe validar el código de recojo antes de iniciar este traslado.");
        }

        request.Status = CommunityRequestStatus.InProcess;
        request.StartedAtUtc = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
        await NotifyRequesterAboutStartedRequestAsync(request, cancellationToken);
        return await GetRequestByIdAsync(requestId, cancellationToken);
    }

    public async Task<CommunityRequestDetailResponse> CompleteRequestAsync(Guid requestId, CompleteCommunityRequestRequest request, string? proofImageUrl, CancellationToken cancellationToken = default)
    {
        if (_financeV2Enabled) await _completeRequestValidator.ValidateAndThrowAsync(request, cancellationToken);

        var collaborator = await GetOrCreateCollaboratorAsync(cancellationToken);
        var communityRequest = await GetAssignedRequestAsync(requestId, collaborator.Id, cancellationToken);

        if (communityRequest.Status == CommunityRequestStatus.Delivered)
            return await GetRequestByIdAsync(requestId, cancellationToken);
        if (communityRequest.Status != CommunityRequestStatus.InProcess)
        {
            throw new AppException("Community request cannot be completed from the current status.");
        }

        Order? linkedOrder = null;
        if (_financeV2Enabled && communityRequest.OrderId.HasValue)
        {
            linkedOrder = await _dbContext.Orders.FirstAsync(x => x.Id == communityRequest.OrderId.Value, cancellationToken);
            if (_deliveryConfirmationService is null) throw new AppException("La confirmación de entrega no está configurada.");
            await _deliveryConfirmationService.ValidateAsync(linkedOrder, request.ConfirmationCode, collaborator.UserId, cancellationToken);
        }
        else if (_financeV2Enabled)
        {
            await ValidateCommunityConfirmationCodeAsync(communityRequest, request.ConfirmationCode, cancellationToken);
        }

        communityRequest.Status = CommunityRequestStatus.Delivered;
        communityRequest.DeliveredAtUtc = DateTime.UtcNow;
        communityRequest.ProofImageUrl = string.IsNullOrWhiteSpace(proofImageUrl) ? communityRequest.ProofImageUrl : proofImageUrl;
        communityRequest.FavorPaymentStatus = PaymentStatus.CashCollectionDeclared;
        communityRequest.FavorPaidAtUtc = communityRequest.DeliveredAtUtc;

        collaborator.IsAvailable = true;
        collaborator.AvailabilityStatus = CommunityAvailabilityStatus.Available;

        if (linkedOrder is not null)
        {
            linkedOrder.Status = OrderStatus.Delivered;
            linkedOrder.DeliveredAtUtc = communityRequest.DeliveredAtUtc;
            var cashDebt = await _dbContext.FinancialMovements.FirstOrDefaultAsync(x =>
                x.CommunityRequestId == communityRequest.Id && x.Type == FinancialMovementType.CashFavorDebt, cancellationToken);
            if (cashDebt is not null)
            {
                cashDebt.UserId = collaborator.UserId;
                cashDebt.Status = FinancialMovementStatus.Available;
                cashDebt.AvailableAtUtc = communityRequest.DeliveredAtUtc;
            }
        }

        await RefreshCollaboratorMetricsAsync(collaborator, cancellationToken);
        await MarkCommunityFinancialMovementsAvailableAsync(communityRequest.Id, cancellationToken);
        if (_financeSecurityService is not null) await _financeSecurityService.MarkFavorObligationsAvailableAsync(communityRequest.Id, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await NotifyRequesterAboutDeliveredRequestAsync(communityRequest, cancellationToken);

        return await GetRequestByIdAsync(requestId, cancellationToken);
    }

    public async Task<CommunityRequestDetailResponse> ConfirmRequestAsync(Guid requestId, CancellationToken cancellationToken = default)
    {
        var user = await GetCurrentActiveUserAsync(cancellationToken);
        var request = await _dbContext.CommunityRequests
            .Include(x => x.AssignedCollaborator)
                .ThenInclude(x => x!.User)
            .FirstOrDefaultAsync(x => x.Id == requestId, cancellationToken)
            ?? throw new NotFoundException("Community request was not found.");

        if (request.CreatedByUserId != user.Id)
        {
            throw new ForbiddenException("You cannot confirm this community request.");
        }

        if (request.Status == CommunityRequestStatus.Confirmed && request.ClientConfirmedAtUtc.HasValue)
        {
            return await GetRequestByIdAsync(requestId, cancellationToken);
        }

        if (request.Status != CommunityRequestStatus.Delivered)
        {
            throw new AppException("Community request must be delivered before confirmation.");
        }

        request.Status = CommunityRequestStatus.Confirmed;
        request.ClientConfirmedAtUtc = DateTime.UtcNow;
        await MarkCommunityFinancialMovementsAvailableAsync(request.Id, cancellationToken);

        if (request.AssignedCollaborator is not null)
        {
            await RefreshCollaboratorMetricsAsync(request.AssignedCollaborator, cancellationToken);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        await NotifyCollaboratorAboutConfirmationAsync(request, cancellationToken);
        return await GetRequestByIdAsync(requestId, cancellationToken);
    }

    public async Task<CommunityRequestDetailResponse> RegenerateConfirmationCodeAsync(Guid requestId, CancellationToken cancellationToken = default)
    {
        var user = await GetCurrentActiveUserAsync(cancellationToken);
        var request = await _dbContext.CommunityRequests.FirstOrDefaultAsync(x => x.Id == requestId && x.CreatedByUserId == user.Id, cancellationToken)
            ?? throw new NotFoundException("Favor no encontrado.");
        if (request.OrderId.HasValue) throw new AppException("La entrega de esta compra usa el código general del pedido.");
        if (request.Status is CommunityRequestStatus.Delivered or CommunityRequestStatus.Confirmed or CommunityRequestStatus.Cancelled)
            throw new AppException("Este favor ya no necesita código.");
        if (request.ConfirmationCodeRegenerations >= 1) throw new AppException("Ya utilizaste la regeneración disponible.");
        request.ConfirmationCodeVersion = Math.Max(1, request.ConfirmationCodeVersion + 1);
        request.ConfirmationCodeRegenerations++;
        request.ConfirmationCodeFailedAttempts = 0;
        request.ConfirmationCodeLockedAtUtc = null;
        request.ConfirmationCodeExpiresAtUtc = request.DeadlineUtc < DateTime.UtcNow.AddHours(24) ? request.DeadlineUtc : DateTime.UtcNow.AddHours(24);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return await GetRequestByIdAsync(requestId, cancellationToken);
    }

    public async Task<CommunityRequestDetailResponse> CancelRequestAsync(Guid requestId, CancelCommunityRequestRequest request, CancellationToken cancellationToken = default)
    {
        var user = await GetCurrentActiveUserAsync(cancellationToken);
        var communityRequest = await _dbContext.CommunityRequests
            .Include(x => x.AssignedCollaborator)
                .ThenInclude(x => x!.User)
            .FirstOrDefaultAsync(x => x.Id == requestId, cancellationToken)
            ?? throw new NotFoundException("Community request was not found.");

        var isCreator = communityRequest.CreatedByUserId == user.Id;
        var isAssignedCollaborator = communityRequest.AssignedCollaborator?.UserId == user.Id;

        if (!isCreator && !isAssignedCollaborator)
        {
            throw new ForbiddenException("You cannot cancel this community request.");
        }

        if (communityRequest.Status == CommunityRequestStatus.Delivered ||
            communityRequest.Status == CommunityRequestStatus.Confirmed ||
            communityRequest.Status == CommunityRequestStatus.Cancelled)
        {
            throw new AppException("Community request can no longer be cancelled.");
        }

        if (communityRequest.OrderId.HasValue && communityRequest.PickupConfirmedAtUtc.HasValue)
        {
            throw new AppException("El recojo ya fue confirmado. Registra una incidencia para recibir soporte.");
        }

        communityRequest.Status = CommunityRequestStatus.Cancelled;
        communityRequest.CancelledAtUtc = DateTime.UtcNow;
        communityRequest.CancellationReason = string.IsNullOrWhiteSpace(request.Reason) ? null : request.Reason.Trim();
        var pendingMovements = await _dbContext.FinancialMovements
            .Where(x => x.CommunityRequestId == communityRequest.Id && x.Status == FinancialMovementStatus.Pending)
            .ToListAsync(cancellationToken);
        foreach (var movement in pendingMovements) movement.Status = FinancialMovementStatus.Cancelled;

        if (communityRequest.OrderId.HasValue)
        {
            var order = await _dbContext.Orders.FirstAsync(x => x.Id == communityRequest.OrderId.Value, cancellationToken);
            order.DeliveryMode = DeliveryMode.PickupOrDirect;
            order.AssignedCourierUserId = null;
            order.AssignedCourierType = null;
            if (order.Status == OrderStatus.Assigned) order.Status = OrderStatus.ReadyForPickup;
        }

        if (communityRequest.AssignedCollaborator is not null)
        {
            communityRequest.AssignedCollaborator.IsAvailable = true;
            communityRequest.AssignedCollaborator.AvailabilityStatus = CommunityAvailabilityStatus.Available;
            await RefreshCollaboratorMetricsAsync(communityRequest.AssignedCollaborator, cancellationToken);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        await NotifyCommunityCancellationAsync(communityRequest, user.Id, cancellationToken);
        return await GetRequestByIdAsync(requestId, cancellationToken);
    }

    public async Task<CommunityRequestDetailResponse> RateCollaboratorAsync(Guid requestId, RateCommunityCollaboratorRequest request, CancellationToken cancellationToken = default)
    {
        await _rateValidator.ValidateAndThrowAsync(request, cancellationToken);

        var user = await GetCurrentActiveUserAsync(cancellationToken);
        var communityRequest = await _dbContext.CommunityRequests
            .Include(x => x.AssignedCollaborator)
                .ThenInclude(x => x!.User)
            .FirstOrDefaultAsync(x => x.Id == requestId, cancellationToken)
            ?? throw new NotFoundException("Community request was not found.");

        if (communityRequest.CreatedByUserId != user.Id)
        {
            throw new ForbiddenException("Only the requester can rate the collaborator.");
        }

        if (communityRequest.Status != CommunityRequestStatus.Confirmed || !communityRequest.ClientConfirmedAtUtc.HasValue)
        {
            throw new AppException("Community request must be confirmed before rating.");
        }

        if (communityRequest.CollaboratorRating.HasValue)
        {
            throw new AppException("Community request has already been rated.");
        }

        communityRequest.CollaboratorRating = request.Rating;
        communityRequest.CollaboratorFeedback = string.IsNullOrWhiteSpace(request.Comment) ? null : request.Comment.Trim();

        if (communityRequest.AssignedCollaborator is not null)
        {
            await RefreshCollaboratorMetricsAsync(communityRequest.AssignedCollaborator, cancellationToken);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        await NotifyCollaboratorAboutRatingAsync(communityRequest, cancellationToken);
        return await GetRequestByIdAsync(requestId, cancellationToken);
    }

    private async Task<User> GetCurrentActiveUserAsync(CancellationToken cancellationToken)
    {
        EnsureAuthenticated();

        var user = await _dbContext.Users
            .Include(x => x.CollaboratorProfile)
            .Include(x => x.CommunityCollaborator)
            .FirstOrDefaultAsync(x => x.Id == _currentUserService.UserId!.Value, cancellationToken)
            ?? throw new NotFoundException("Authenticated user was not found.");

        if (user.Status != UserStatus.Active)
        {
            throw new AppException("Your account must be active to use community collaboration.");
        }

        if (user.Role == UserRole.Admin)
        {
            throw new AppException("Admin accounts cannot operate as community collaborators.");
        }

        return user;
    }

    private async Task<CommunityCollaborator> GetOrCreateCollaboratorAsync(CancellationToken cancellationToken)
    {
        var user = await GetCurrentActiveUserAsync(cancellationToken);
        if (user.CollaboratorProfile is null)
        {
            user.CollaboratorProfile = new CollaboratorProfile
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                User = user,
                ApprovalStatus = ApprovalStatus.Pending,
                IsIdentityVerified = false,
                IsPhoneVerified = !string.IsNullOrWhiteSpace(user.Phone)
            };

            _dbContext.Add(user.CollaboratorProfile);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        if (user.CommunityCollaborator is not null)
        {
            return user.CommunityCollaborator;
        }

        var collaborator = new CommunityCollaborator
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            IsAvailable = false,
            AvailabilityStatus = CommunityAvailabilityStatus.Disconnected,
            AvailabilityRadiusKm = 5m,
            TrustScore = 0m,
            CompletedCollaborations = 0,
            CollaborationRating = 0m,
            CommunityAcceptanceRate = 0m,
            CommunityCancellationRate = 0m,
            CollaborationLevel = CommunityCollaborationLevel.Verified
        };

        user.CommunityCollaborator = collaborator;
        _dbContext.Add(collaborator);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return collaborator;
    }

    private async Task<CommunityRequest> GetAssignedRequestAsync(Guid requestId, Guid collaboratorId, CancellationToken cancellationToken)
    {
        var request = await _dbContext.CommunityRequests
            .FirstOrDefaultAsync(x => x.Id == requestId, cancellationToken)
            ?? throw new NotFoundException("Community request was not found.");

        if (request.AssignedCollaboratorId != collaboratorId)
        {
            throw new ForbiddenException("This community request is not assigned to you.");
        }

        return request;
    }

    private async Task<CommunityRoute?> FindBestRouteAsync(CommunityCollaborator collaborator, CommunityRequest request, CancellationToken cancellationToken)
    {
        var routes = await _dbContext.CommunityRoutes
            .Where(x => x.CommunityCollaboratorId == collaborator.Id && x.IsActive)
            .OrderByDescending(x => x.StartsAtUtc)
            .ToListAsync(cancellationToken);

        return routes.FirstOrDefault(x => CommunityMatchingCalculator.IsRouteCompatible(x, request));
    }

    private async Task RefreshCollaboratorMetricsAsync(CommunityCollaborator collaborator, CancellationToken cancellationToken)
    {
        var requests = await _dbContext.CommunityRequests
            .Where(x => x.AssignedCollaboratorId == collaborator.Id)
            .ToListAsync(cancellationToken);

        collaborator.CompletedCollaborations = requests.Count(x => x.ClientConfirmedAtUtc.HasValue);
        collaborator.CollaborationRating = requests
            .Where(x => x.CollaboratorRating.HasValue)
            .Select(x => (decimal?)x.CollaboratorRating)
            .Average() ?? 0m;

        var acceptedCount = requests.Count(x => x.AcceptedAtUtc.HasValue);
        var cancelledCount = requests.Count(x => x.Status == CommunityRequestStatus.Cancelled);
        collaborator.CommunityAcceptanceRate = acceptedCount == 0 ? 0m : Math.Round((decimal)collaborator.CompletedCollaborations / acceptedCount * 100m, 2);
        collaborator.CommunityCancellationRate = acceptedCount == 0 ? 0m : Math.Round((decimal)cancelledCount / acceptedCount * 100m, 2);
        collaborator.TrustScore = CommunityTrustCalculator.CalculateScore(
            collaborator.CompletedCollaborations,
            collaborator.CollaborationRating,
            collaborator.CommunityAcceptanceRate,
            collaborator.User.CreatedAtUtc);
        collaborator.CollaborationLevel = CommunityTrustCalculator.CalculateLevel(collaborator.TrustScore, collaborator.CompletedCollaborations);
    }

    private static CommunityCollaboratorResponse MapCollaborator(CommunityCollaborator collaborator)
    {
        return new CommunityCollaboratorResponse
        {
            Id = collaborator.Id,
            UserId = collaborator.UserId,
            FullName = $"{collaborator.User.FirstName} {collaborator.User.LastName}".Trim(),
            Email = collaborator.User.Email,
            Phone = collaborator.User.Phone,
            IsAvailable = collaborator.IsAvailable,
            AvailabilityStatus = collaborator.AvailabilityStatus.ToString(),
            CurrentLatitude = collaborator.CurrentLatitude,
            CurrentLongitude = collaborator.CurrentLongitude,
            AvailabilityRadiusKm = collaborator.AvailabilityRadiusKm,
            AvailableFromUtc = collaborator.AvailableFromUtc,
            AvailableUntilUtc = collaborator.AvailableUntilUtc,
            TrustScore = collaborator.TrustScore,
            CompletedCollaborations = collaborator.CompletedCollaborations,
            CollaborationRating = collaborator.CollaborationRating,
            CommunityAcceptanceRate = collaborator.CommunityAcceptanceRate,
            CommunityCancellationRate = collaborator.CommunityCancellationRate,
            CollaborationLevel = collaborator.CollaborationLevel.ToString(),
            CollaboratorApprovalStatus = collaborator.User.CollaboratorProfile?.ApprovalStatus.ToString(),
            IsIdentityVerified = collaborator.User.CollaboratorProfile?.IsIdentityVerified ?? false,
            IsPhoneVerified = collaborator.User.CollaboratorProfile?.IsPhoneVerified ?? false,
            IdentityDocumentNumber = collaborator.User.CollaboratorProfile?.IdentityDocumentNumber,
            UserStatus = collaborator.User.Status.ToString()
        };
    }

    private static CommunityRouteResponse MapRoute(CommunityRoute route)
    {
        return new CommunityRouteResponse
        {
            Id = route.Id,
            OriginLabel = route.OriginLabel,
            OriginLatitude = route.OriginLatitude,
            OriginLongitude = route.OriginLongitude,
            DestinationLabel = route.DestinationLabel,
            DestinationLatitude = route.DestinationLatitude,
            DestinationLongitude = route.DestinationLongitude,
            EstimatedMinutes = route.EstimatedMinutes,
            DeviationRadiusKm = route.DeviationRadiusKm,
            IsActive = route.IsActive,
            StartsAtUtc = route.StartsAtUtc,
            EndsAtUtc = route.EndsAtUtc
        };
    }

    private static CommunityRequestListItemResponse MapRequestListItem(
        CommunityRequest request,
        Guid currentUserId,
        CommunityCollaborator? currentCollaborator)
    {
        var matchScore = request.MatchScore;
        var isOpenForeignRequest =
            request.CreatedByUserId != currentUserId &&
            request.AssignedCollaboratorId is null &&
            request.Status is CommunityRequestStatus.Published or CommunityRequestStatus.Searching;

        if (currentCollaborator is not null && isOpenForeignRequest)
        {
            var matchedRoute = currentCollaborator.Routes
                .Where(x => x.IsActive)
                .FirstOrDefault(x => CommunityMatchingCalculator.IsRouteCompatible(x, request));

            matchScore = CommunityMatchingCalculator
                .BuildMatch(currentCollaborator, request, matchedRoute)
                .MatchScore;
        }

        return new CommunityRequestListItemResponse
        {
            OrderId = request.OrderId,
            SourceType = request.SourceType.ToString(),
            Id = request.Id,
            CreatedByUserId = request.CreatedByUserId,
            CreatedByFullName = $"{request.CreatedByUser.FirstName} {request.CreatedByUser.LastName}".Trim(),
            Type = request.Type.ToString(),
            Title = request.Title,
            OriginLabel = request.OriginLabel,
            DestinationLabel = request.SourceType == CommunityRequestSourceType.AppuraPeOrder &&
                (request.CreatedByUserId == currentUserId || request.AssignedCollaborator?.UserId == currentUserId)
                    ? request.Order?.DeliveryAddress ?? request.DestinationLabel
                    : request.DestinationLabel,
            CompensationAmount = request.CompensationAmount,
            EstimatedPurchaseAmount = request.EstimatedPurchaseAmount,
            FavorPlatformCommissionAmount = request.FavorPlatformCommissionAmount,
            CollaboratorEarningAmount = request.CollaboratorEarningAmount,
            TotalClientAmount = request.TotalClientAmount,
            DeadlineUtc = request.DeadlineUtc,
            Status = request.Status.ToString(),
            IsMine = request.CreatedByUserId == currentUserId,
            IsAssignedToMe = request.AssignedCollaborator?.UserId == currentUserId,
            MatchScore = matchScore,
            CreatedAtUtc = request.CreatedAtUtc
        };
    }

    private CommunityRequestDetailResponse MapRequestDetail(CommunityRequest request, Guid currentUserId)
    {
        var isOwner = request.CreatedByUserId == currentUserId;
        var isAssignedCollaborator = request.AssignedCollaborator?.UserId == currentUserId;
        var visibleApplications = isOwner
            ? request.Applications
            : request.Applications.Where(x => x.Collaborator.UserId == currentUserId);

        return new CommunityRequestDetailResponse
        {
            OrderId = request.OrderId,
            SourceType = request.SourceType.ToString(),
            Id = request.Id,
            CreatedByUserId = request.CreatedByUserId,
            CreatedByFullName = $"{request.CreatedByUser.FirstName} {request.CreatedByUser.LastName}".Trim(),
            Type = request.Type.ToString(),
            Title = request.Title,
            Description = request.Description,
            OriginLabel = request.OriginLabel,
            OriginLatitude = request.OriginLatitude,
            OriginLongitude = request.OriginLongitude,
            DestinationLabel = request.SourceType == CommunityRequestSourceType.AppuraPeOrder && (isOwner || isAssignedCollaborator)
                ? request.Order?.DeliveryAddress ?? request.DestinationLabel
                : request.DestinationLabel,
            DestinationLatitude = request.DestinationLatitude,
            DestinationLongitude = request.DestinationLongitude,
            CompensationAmount = request.CompensationAmount,
            EstimatedPurchaseAmount = request.EstimatedPurchaseAmount,
            FavorPlatformCommissionAmount = request.FavorPlatformCommissionAmount,
            CollaboratorEarningAmount = request.CollaboratorEarningAmount,
            TotalClientAmount = request.TotalClientAmount,
            PlatformRevenueAmount = request.PlatformRevenueAmount,
            DeadlineUtc = request.DeadlineUtc,
            Status = request.Status.ToString(),
            AssignedCollaboratorId = request.AssignedCollaboratorId,
            AssignedCollaboratorName = request.AssignedCollaborator is null ? null : $"{request.AssignedCollaborator.User.FirstName} {request.AssignedCollaborator.User.LastName}".Trim(),
            AssignedRouteId = request.AssignedRouteId,
            MatchScore = request.MatchScore,
            ConfirmationCode = isOwner && !request.OrderId.HasValue ? DeriveCommunityCode(request.Id, Math.Max(1, request.ConfirmationCodeVersion)) : null,
            PickupCode = isAssignedCollaborator && request.PickupCodeExpiresAtUtc > DateTime.UtcNow
                ? DerivePickupCode(request.Id, Math.Max(1, request.PickupCodeVersion)) : null,
            PickupConfirmedAtUtc = request.PickupConfirmedAtUtc,
            ProofImageUrl = request.ProofImageUrl,
            CollaboratorRating = request.CollaboratorRating,
            CollaboratorFeedback = request.CollaboratorFeedback,
            AcceptedAtUtc = request.AcceptedAtUtc,
            StartedAtUtc = request.StartedAtUtc,
            DeliveredAtUtc = request.DeliveredAtUtc,
            ClientConfirmedAtUtc = request.ClientConfirmedAtUtc,
            CancelledAtUtc = request.CancelledAtUtc,
            CancellationReason = request.CancellationReason,
            Applications = visibleApplications
                .OrderByDescending(x => x.Status == CommunityRequestApplicationStatus.Selected)
                .ThenByDescending(x => x.MatchScore)
                .ThenBy(x => x.AppliedAtUtc)
                .Select(x => new CommunityRequestApplicationResponse
                {
                    ApplicationId = x.Id,
                    CollaboratorId = x.CollaboratorId,
                    FullName = $"{x.Collaborator.User.FirstName} {x.Collaborator.User.LastName}".Trim(),
                    AvailabilityStatus = x.Collaborator.AvailabilityStatus.ToString(),
                    IsAvailable = x.Collaborator.IsAvailable,
                    TrustScore = x.Collaborator.TrustScore,
                    CompletedCollaborations = x.Collaborator.CompletedCollaborations,
                    CollaborationRating = x.Collaborator.CollaborationRating,
                    CommunityAcceptanceRate = x.Collaborator.CommunityAcceptanceRate,
                    CommunityCancellationRate = x.Collaborator.CommunityCancellationRate,
                    CollaborationLevel = x.Collaborator.CollaborationLevel.ToString(),
                    CollaboratorApprovalStatus = x.Collaborator.User.CollaboratorProfile != null ? x.Collaborator.User.CollaboratorProfile.ApprovalStatus.ToString() : null,
                    IsIdentityVerified = x.Collaborator.User.CollaboratorProfile?.IsIdentityVerified ?? false,
                    IsPhoneVerified = x.Collaborator.User.CollaboratorProfile?.IsPhoneVerified ?? false,
                    HasRouteMatch = x.HasRouteMatch,
                    DistanceKm = x.DistanceKm,
                    EstimatedMinutes = x.EstimatedMinutes,
                    MatchScore = x.MatchScore,
                    Status = x.Status.ToString(),
                    AppliedAtUtc = x.AppliedAtUtc,
                    RouteId = x.RouteId
                })
                .ToList(),
            CreatedAtUtc = request.CreatedAtUtc,
            UpdatedAtUtc = request.UpdatedAtUtc
        };
    }

    private async Task<List<CommissionRule>> GetActiveCommissionRulesAsync(CommissionRuleScope scope, CancellationToken cancellationToken)
    {
        var utcNow = DateTime.UtcNow;

        return await _dbContext.CommissionRules
            .Where(x =>
                x.Scope == scope &&
                x.IsEnabled &&
                (!x.EffectiveFromUtc.HasValue || x.EffectiveFromUtc.Value <= utcNow) &&
                (!x.EffectiveToUtc.HasValue || x.EffectiveToUtc.Value >= utcNow))
            .OrderBy(x => x.Priority)
            .ThenBy(x => x.Code)
            .ToListAsync(cancellationToken);
    }

    private void CreateCommunityFinancialMovements(CommunityRequest request)
    {
        var occurredAtUtc = DateTime.UtcNow;
        var requestReference = $"COMMUNITY-{request.Id:N}";

        AddCommunityMovement(request, null, FinancialMovementType.CourierEarning, request.CollaboratorEarningAmount, "Collaborator earning reserved for the community request.", occurredAtUtc, requestReference);
        AddCommunityMovement(request, null, FinancialMovementType.CashFavorDebt, request.FavorPlatformCommissionAmount, "Comisión AppuraPe cobrada en efectivo por el colaborador.", occurredAtUtc, requestReference);
    }

    private static decimal ResolveRuleAmount(IReadOnlyCollection<CommissionRule> rules, string code, decimal fallback)
    {
        var rule = rules.FirstOrDefault(x => x.Code == code && x.IsEnabled);
        return rule is null ? fallback : Math.Round(Math.Max(0m, rule.Value), 2, MidpointRounding.AwayFromZero);
    }

    private void AddCommunityMovement(
        CommunityRequest request,
        Guid? userId,
        FinancialMovementType type,
        decimal amount,
        string description,
        DateTime occurredAtUtc,
        string requestReference)
    {
        if (amount <= 0m)
        {
            return;
        }

        _dbContext.Add(new FinancialMovement
        {
            Id = Guid.NewGuid(),
            CommunityRequestId = request.Id,
            UserId = userId,
            Type = type,
            Status = FinancialMovementStatus.Pending,
            Amount = amount,
            OccurredAtUtc = occurredAtUtc,
            Reference = requestReference,
            Description = description,
            IsImmutable = true,
            ReconciliationStatus = FinancialReconciliationStatus.LegacyReconciliationPending
        });
    }

    private async Task AssignCollaboratorFinancialMovementsAsync(Guid requestId, Guid collaboratorUserId, CancellationToken cancellationToken)
    {
        var movements = await _dbContext.FinancialMovements
            .Where(x => x.CommunityRequestId == requestId &&
                (x.Type == FinancialMovementType.CourierEarning || x.Type == FinancialMovementType.CashFavorDebt))
            .ToListAsync(cancellationToken);

        foreach (var movement in movements)
        {
            movement.UserId = collaboratorUserId;
        }
    }

    private async Task MarkCommunityFinancialMovementsAvailableAsync(Guid requestId, CancellationToken cancellationToken)
    {
        var availableAtUtc = DateTime.UtcNow;
        var movements = await _dbContext.FinancialMovements
            .Where(x => x.CommunityRequestId == requestId && x.Status == FinancialMovementStatus.Pending)
            .ToListAsync(cancellationToken);

        foreach (var movement in movements)
        {
            movement.Status = FinancialMovementStatus.Available;
            movement.AvailableAtUtc = availableAtUtc;
        }
    }

    private static void EnsureCollaboratorCanOperate(CommunityCollaborator collaborator)
    {
        EnsureCollaboratorIdentityIsApproved(collaborator);

        if (!collaborator.IsAvailable || collaborator.AvailabilityStatus != CommunityAvailabilityStatus.Available)
        {
            throw new AppException("Activa tu disponibilidad en Favores antes de postularte.");
        }
    }

    private static void EnsureCollaboratorIdentityIsApproved(CommunityCollaborator collaborator)
    {
        if (collaborator.User.Role != UserRole.Customer)
        {
            return;
        }

        var profile = collaborator.User.CollaboratorProfile;
        if (profile is null ||
            profile.ApprovalStatus != ApprovalStatus.Approved ||
            !profile.IsIdentityVerified ||
            string.IsNullOrWhiteSpace(profile.IdentityDocumentUrl) ||
            string.IsNullOrWhiteSpace(profile.ProfilePhotoUrl) ||
            string.IsNullOrWhiteSpace(profile.LiveSelfieUrl) ||
            !profile.LiveSelfieCapturedAtUtc.HasValue)
        {
            throw new AppException("Tu perfil de colaborador debe ser validado por AppuraPe antes de ayudar en un favor.");
        }
    }

    private void EnsureAuthenticated()
    {
        if (!_currentUserService.IsAuthenticated || !_currentUserService.UserId.HasValue)
        {
            throw new UnauthorizedException("Authentication is required.");
        }
    }

    private async Task ValidateCommunityConfirmationCodeAsync(CommunityRequest request, string suppliedCode, CancellationToken cancellationToken)
    {
        if (_communityConfirmationKey is null) throw new AppException("La confirmación segura de favores no está configurada.");
        if (request.ConfirmationCodeLockedAtUtc.HasValue || request.ConfirmationCodeFailedAttempts >= 5)
            throw new AppException("El código está bloqueado. El cliente debe regenerarlo.");
        if (!request.ConfirmationCodeExpiresAtUtc.HasValue || request.ConfirmationCodeExpiresAtUtc <= DateTime.UtcNow)
            throw new AppException("El código venció. El cliente debe regenerarlo.");
        var expected = DeriveCommunityCode(request.Id, Math.Max(1, request.ConfirmationCodeVersion));
        var supplied = (suppliedCode ?? string.Empty).Trim();
        var valid = supplied.Length == 6 && CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(expected), Encoding.ASCII.GetBytes(supplied));
        if (valid) { request.ConfirmationCodeFailedAttempts = 0; request.ConfirmationCodeLockedAtUtc = null; return; }
        request.ConfirmationCodeFailedAttempts++;
        if (request.ConfirmationCodeFailedAttempts >= 5) request.ConfirmationCodeLockedAtUtc = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
        throw new AppException(request.ConfirmationCodeFailedAttempts >= 5 ? "El código fue bloqueado por demasiados intentos." : $"Código incorrecto. Quedan {5 - request.ConfirmationCodeFailedAttempts} intentos.");
    }

    private string DeriveCommunityCode(Guid requestId, int version)
    {
        if (_communityConfirmationKey is null) return string.Empty;
        using var hmac = new HMACSHA256(_communityConfirmationKey);
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes($"community-delivery:{requestId:N}:{version}"));
        return (BitConverter.ToUInt32(hash, 0) % 1_000_000).ToString("D6");
    }

    private string DerivePickupCode(Guid requestId, int version)
    {
        if (_communityConfirmationKey is null) return string.Empty;
        using var hmac = new HMACSHA256(_communityConfirmationKey);
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes($"community-pickup:{requestId:N}:{version}"));
        return (BitConverter.ToUInt32(hash, 0) % 1_000_000).ToString("D6");
    }

    private async Task NotifyPublishedRequestAsync(CommunityRequest request, CancellationToken cancellationToken)
    {
        var collaboratorUserIds = await _dbContext.CommunityCollaborators
            .Where(x =>
                x.UserId != request.CreatedByUserId &&
                x.User.Status == UserStatus.Active &&
                x.IsAvailable &&
                x.AvailabilityStatus == CommunityAvailabilityStatus.Available)
            .Select(x => x.UserId)
            .Distinct()
            .ToListAsync(cancellationToken);

        await _notificationService.SendToUsersAsync(
            collaboratorUserIds,
            new EventPushNotificationRequest
            {
                Title = "Nuevo favor disponible",
                Body = request.Title,
                Data = NotificationPayloadFactory.CommunityRequest(request.Id, $"/community/requests/{request.Id}", "community_published")
            },
            cancellationToken);
    }

    private async Task NotifyRequesterAboutApplicationAsync(
        CommunityRequest request,
        CommunityCollaborator collaborator,
        CancellationToken cancellationToken)
    {
        await _notificationService.SendToUserAsync(
            request.CreatedByUserId,
            new EventPushNotificationRequest
            {
                Title = "Nueva postulación",
                Body = $"{collaborator.User.FirstName} {collaborator.User.LastName}".Trim() + " se postuló a tu favor.",
                Data = NotificationPayloadFactory.CommunityRequest(request.Id, $"/community/requests/{request.Id}", "community_application_created")
            },
            cancellationToken);
    }

    private async Task NotifyCollaboratorSelectedAsync(
        CommunityRequest request,
        Guid collaboratorUserId,
        CancellationToken cancellationToken)
    {
        await _notificationService.SendToUserAsync(
            collaboratorUserId,
            new EventPushNotificationRequest
            {
                Title = "Fuiste seleccionado",
                Body = $"Te seleccionaron para el favor \"{request.Title}\".",
                Data = NotificationPayloadFactory.CommunityRequest(request.Id, $"/community/requests/{request.Id}", "community_collaborator_selected")
            },
            cancellationToken);
    }

    private async Task NotifyBusinessAboutSelectedCollaboratorAsync(
        CommunityRequest request,
        CancellationToken cancellationToken)
    {
        if (!request.OrderId.HasValue)
        {
            return;
        }

        var target = await _dbContext.Orders
            .AsNoTracking()
            .Where(x => x.Id == request.OrderId.Value)
            .Select(x => new { x.Restaurant.OwnerUserId, x.Restaurant.Name })
            .FirstAsync(cancellationToken);

        await _notificationService.SendToUserAsync(
            target.OwnerUserId,
            new EventPushNotificationRequest
            {
                Title = "Colaborador asignado",
                Body = $"Un colaborador recogerá el pedido en {target.Name}. Valida su código cuando esté listo.",
                Data = NotificationPayloadFactory.BusinessOrder(
                    request.OrderId.Value,
                    $"/business/orders/{request.OrderId.Value}",
                    "order_collaborator_assigned")
            },
            cancellationToken);
    }

    private async Task NotifyRequesterAboutStartedRequestAsync(CommunityRequest request, CancellationToken cancellationToken)
    {
        await _notificationService.SendToUserAsync(
            request.CreatedByUserId,
            new EventPushNotificationRequest
            {
                Title = "Favor iniciado",
                Body = $"El colaborador ya inició \"{request.Title}\".",
                Data = NotificationPayloadFactory.CommunityRequest(request.Id, $"/community/requests/{request.Id}", "community_started")
            },
            cancellationToken);
    }

    private async Task NotifyRequesterAboutDeliveredRequestAsync(CommunityRequest request, CancellationToken cancellationToken)
    {
        await _notificationService.SendToUserAsync(
            request.CreatedByUserId,
            new EventPushNotificationRequest
            {
                Title = "Favor entregado",
                Body = $"El colaborador marcó \"{request.Title}\" como entregado.",
                Data = NotificationPayloadFactory.CommunityRequest(request.Id, $"/community/requests/{request.Id}", "community_delivered")
            },
            cancellationToken);
    }

    private async Task NotifyCollaboratorAboutConfirmationAsync(CommunityRequest request, CancellationToken cancellationToken)
    {
        var collaboratorUserId = request.AssignedCollaborator?.UserId;
        if (!collaboratorUserId.HasValue)
        {
            return;
        }

        await _notificationService.SendToUserAsync(
            collaboratorUserId.Value,
            new EventPushNotificationRequest
            {
                Title = "Recepción confirmada",
                Body = $"Confirmaron la recepción de \"{request.Title}\".",
                Data = NotificationPayloadFactory.CommunityRequest(request.Id, $"/community/requests/{request.Id}", "community_confirmed")
            },
            cancellationToken);
    }

    private async Task NotifyCollaboratorAboutRatingAsync(CommunityRequest request, CancellationToken cancellationToken)
    {
        var collaboratorUserId = request.AssignedCollaborator?.UserId;
        if (!collaboratorUserId.HasValue || !request.CollaboratorRating.HasValue)
        {
            return;
        }

        await _notificationService.SendToUserAsync(
            collaboratorUserId.Value,
            new EventPushNotificationRequest
            {
                Title = "Nueva calificación",
                Body = $"Recibiste una calificación de {request.CollaboratorRating.Value}/5 en \"{request.Title}\".",
                Data = NotificationPayloadFactory.CommunityRequest(request.Id, $"/community/requests/{request.Id}", "community_rated")
            },
            cancellationToken);
    }

    private async Task NotifyCommunityCancellationAsync(
        CommunityRequest request,
        Guid actorUserId,
        CancellationToken cancellationToken)
    {
        var recipients = new HashSet<Guid>();

        if (request.CreatedByUserId != actorUserId)
        {
            recipients.Add(request.CreatedByUserId);
        }

        if (request.AssignedCollaborator?.UserId is Guid collaboratorUserId && collaboratorUserId != actorUserId)
        {
            recipients.Add(collaboratorUserId);
        }

        if (recipients.Count == 0)
        {
            return;
        }

        await _notificationService.SendToUsersAsync(
            recipients,
            new EventPushNotificationRequest
            {
                Title = "Favor cancelado",
                Body = string.IsNullOrWhiteSpace(request.CancellationReason)
                    ? $"El favor \"{request.Title}\" fue cancelado."
                    : $"El favor \"{request.Title}\" fue cancelado: {request.CancellationReason}",
                Data = NotificationPayloadFactory.CommunityRequest(request.Id, $"/community/requests/{request.Id}", "community_cancelled")
            },
            cancellationToken);
    }
}
