using FluentValidation;
using IquitosDelivery.Application.DTOs.CustomerAddresses;

namespace IquitosDelivery.Application.Validators;

public class UpsertCustomerAddressRequestValidator : AbstractValidator<UpsertCustomerAddressRequest>
{
    public UpsertCustomerAddressRequestValidator()
    {
        RuleFor(x => x.Label).NotEmpty().MaximumLength(80);
        RuleFor(x => x.RecipientName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.RecipientPhone).NotEmpty().MaximumLength(30);
        RuleFor(x => x.AddressLine).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Reference).NotEmpty().MaximumLength(300);
        RuleFor(x => x.ZoneId).NotEmpty();
        RuleFor(x => x.Latitude).InclusiveBetween(-90m, 90m).When(x => x.Latitude.HasValue);
        RuleFor(x => x.Longitude).InclusiveBetween(-180m, 180m).When(x => x.Longitude.HasValue);
    }
}
