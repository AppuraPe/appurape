using FluentValidation;
using IquitosDelivery.Application.DTOs.Auth;

namespace IquitosDelivery.Application.Validators;

public class ResendDriverRegistrationCodeRequestValidator : AbstractValidator<ResendDriverRegistrationCodeRequest>
{
    public ResendDriverRegistrationCodeRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(256);
    }
}
