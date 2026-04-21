using FluentValidation;
using IquitosDelivery.Application.DTOs.Auth;

namespace IquitosDelivery.Application.Validators;

public class VerifyDriverRegistrationCodeRequestValidator : AbstractValidator<VerifyDriverRegistrationCodeRequest>
{
    public VerifyDriverRegistrationCodeRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(256);

        RuleFor(x => x.Code)
            .NotEmpty()
            .Matches(@"^\d{6}$")
            .WithMessage("Code must contain exactly 6 digits.");
    }
}
