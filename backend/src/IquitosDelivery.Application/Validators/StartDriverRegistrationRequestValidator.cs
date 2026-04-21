using FluentValidation;
using IquitosDelivery.Application.DTOs.Auth;

namespace IquitosDelivery.Application.Validators;

public class StartDriverRegistrationRequestValidator : AbstractValidator<StartDriverRegistrationRequest>
{
    public StartDriverRegistrationRequestValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.VehicleType).IsInEnum();
        RuleFor(x => x.Plate).NotEmpty().MaximumLength(20);
        RuleFor(x => x.ZoneId).NotEmpty();
    }
}
