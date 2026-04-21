using FluentValidation;
using IquitosDelivery.Application.DTOs.Auth;

namespace IquitosDelivery.Application.Validators;

public class ResendRestaurantRegistrationCodeRequestValidator : AbstractValidator<ResendRestaurantRegistrationCodeRequest>
{
    public ResendRestaurantRegistrationCodeRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(256);
    }
}
