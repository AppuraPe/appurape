using FluentValidation;
using IquitosDelivery.Application.DTOs.CustomerAddresses;
using IquitosDelivery.Application.Exceptions;
using IquitosDelivery.Application.Interfaces;
using IquitosDelivery.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace IquitosDelivery.Application.Services;

public class CustomerAddressService : ICustomerAddressService
{
    private readonly IAppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly IValidator<UpsertCustomerAddressRequest> _upsertValidator;

    public CustomerAddressService(
        IAppDbContext dbContext,
        ICurrentUserService currentUserService,
        IValidator<UpsertCustomerAddressRequest> upsertValidator)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _upsertValidator = upsertValidator;
    }

    public async Task<IReadOnlyList<CustomerAddressResponse>> GetMyAddressesAsync(CancellationToken cancellationToken = default)
    {
        var customer = await GetCurrentCustomerAsync(cancellationToken);

        return await _dbContext.CustomerAddresses
            .AsNoTracking()
            .Where(x => x.CustomerProfileId == customer.Id && x.IsActive)
            .OrderByDescending(x => x.IsDefault)
            .ThenByDescending(x => x.UpdatedAtUtc ?? x.CreatedAtUtc)
            .Select(MapToResponse())
            .ToListAsync(cancellationToken);
    }

    public async Task<CustomerAddressResponse> GetMyAddressByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var customer = await GetCurrentCustomerAsync(cancellationToken);
        return await GetOwnedAddressQuery(customer.Id, id).Select(MapToResponse()).FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Address was not found.");
    }

    public async Task<CustomerAddressResponse> CreateMyAddressAsync(UpsertCustomerAddressRequest request, CancellationToken cancellationToken = default)
    {
        await _upsertValidator.ValidateAndThrowAsync(request, cancellationToken);

        var customer = await GetCurrentCustomerAsync(cancellationToken);
        await EnsureZoneExistsAsync(request.ZoneId, cancellationToken);

        var hasActiveAddresses = await _dbContext.CustomerAddresses
            .AnyAsync(x => x.CustomerProfileId == customer.Id && x.IsActive, cancellationToken);

        var address = new CustomerAddress
        {
            Id = Guid.NewGuid(),
            CustomerProfileId = customer.Id,
            ZoneId = request.ZoneId,
            Label = request.Label.Trim(),
            RecipientName = request.RecipientName.Trim(),
            RecipientPhone = request.RecipientPhone.Trim(),
            AddressLine = request.AddressLine.Trim(),
            Reference = request.Reference.Trim(),
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            IsDefault = !hasActiveAddresses,
            IsActive = true
        };

        _dbContext.Add(address);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetMyAddressByIdAsync(address.Id, cancellationToken);
    }

    public async Task<CustomerAddressResponse> UpdateMyAddressAsync(Guid id, UpsertCustomerAddressRequest request, CancellationToken cancellationToken = default)
    {
        await _upsertValidator.ValidateAndThrowAsync(request, cancellationToken);

        var customer = await GetCurrentCustomerAsync(cancellationToken);
        await EnsureZoneExistsAsync(request.ZoneId, cancellationToken);

        var address = await GetOwnedAddressEntityAsync(customer.Id, id, cancellationToken);
        address.ZoneId = request.ZoneId;
        address.Label = request.Label.Trim();
        address.RecipientName = request.RecipientName.Trim();
        address.RecipientPhone = request.RecipientPhone.Trim();
        address.AddressLine = request.AddressLine.Trim();
        address.Reference = request.Reference.Trim();
        address.Latitude = request.Latitude;
        address.Longitude = request.Longitude;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return await GetMyAddressByIdAsync(address.Id, cancellationToken);
    }

    public async Task DeleteMyAddressAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var customer = await GetCurrentCustomerAsync(cancellationToken);
        var address = await GetOwnedAddressEntityAsync(customer.Id, id, cancellationToken);
        var wasDefault = address.IsDefault;

        address.IsActive = false;
        address.IsDefault = false;
        await _dbContext.SaveChangesAsync(cancellationToken);

        if (wasDefault)
        {
            await EnsureSingleDefaultAsync(customer.Id, cancellationToken);
        }
    }

    public async Task<CustomerAddressResponse> SetDefaultAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var customer = await GetCurrentCustomerAsync(cancellationToken);
        var address = await GetOwnedAddressEntityAsync(customer.Id, id, cancellationToken);

        await ClearDefaultFlagsAsync(customer.Id, cancellationToken);
        address.IsDefault = true;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return await GetMyAddressByIdAsync(address.Id, cancellationToken);
    }

    private async Task<CustomerProfile> GetCurrentCustomerAsync(CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAuthenticated || _currentUserService.UserId is null)
        {
            throw new UnauthorizedException("Authentication is required.");
        }

        var customer = await _dbContext.Customers
            .FirstOrDefaultAsync(x => x.UserId == _currentUserService.UserId.Value, cancellationToken);

        if (customer is null)
        {
            throw new AppException("Authenticated user does not have a customer profile.");
        }

        return customer;
    }

    private async Task<CustomerAddress> GetOwnedAddressEntityAsync(Guid customerId, Guid id, CancellationToken cancellationToken)
    {
        return await _dbContext.CustomerAddresses
            .FirstOrDefaultAsync(x => x.Id == id && x.CustomerProfileId == customerId && x.IsActive, cancellationToken)
            ?? throw new NotFoundException("Address was not found.");
    }

    private IQueryable<CustomerAddress> GetOwnedAddressQuery(Guid customerId, Guid id)
    {
        return _dbContext.CustomerAddresses
            .AsNoTracking()
            .Where(x => x.Id == id && x.CustomerProfileId == customerId && x.IsActive);
    }

    private async Task EnsureZoneExistsAsync(Guid zoneId, CancellationToken cancellationToken)
    {
        var zoneExists = await _dbContext.Zones.AnyAsync(x => x.Id == zoneId && x.IsActive, cancellationToken);
        if (!zoneExists)
        {
            throw new NotFoundException("Zone was not found.");
        }
    }

    private async Task ClearDefaultFlagsAsync(Guid customerId, CancellationToken cancellationToken)
    {
        var defaultAddresses = await _dbContext.CustomerAddresses
            .Where(x => x.CustomerProfileId == customerId && x.IsActive && x.IsDefault)
            .ToListAsync(cancellationToken);

        foreach (var currentDefault in defaultAddresses)
        {
            currentDefault.IsDefault = false;
        }
    }

    private async Task EnsureSingleDefaultAsync(Guid customerId, CancellationToken cancellationToken)
    {
        var nextDefault = await _dbContext.CustomerAddresses
            .Where(x => x.CustomerProfileId == customerId && x.IsActive)
            .OrderByDescending(x => x.UpdatedAtUtc ?? x.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

        if (nextDefault is null)
        {
            return;
        }

        await ClearDefaultFlagsAsync(customerId, cancellationToken);
        nextDefault.IsDefault = true;
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private static Expression<Func<CustomerAddress, CustomerAddressResponse>> MapToResponse()
    {
        return address => new CustomerAddressResponse
        {
            Id = address.Id,
            Label = address.Label,
            RecipientName = address.RecipientName,
            RecipientPhone = address.RecipientPhone,
            AddressLine = address.AddressLine,
            Reference = address.Reference,
            ZoneId = address.ZoneId,
            ZoneName = address.Zone.Name,
            Latitude = address.Latitude,
            Longitude = address.Longitude,
            IsDefault = address.IsDefault,
            IsActive = address.IsActive,
            CreatedAtUtc = address.CreatedAtUtc,
            UpdatedAtUtc = address.UpdatedAtUtc
        };
    }
}
