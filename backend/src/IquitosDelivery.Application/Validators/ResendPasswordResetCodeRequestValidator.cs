using FluentValidation;
using IquitosDelivery.Application.DTOs.Auth;

namespace IquitosDelivery.Application.Validators;

public class ResendPasswordResetCodeRequestValidator : AbstractValidator<ResendPasswordResetCodeRequest>
{
    public ResendPasswordResetCodeRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(256);
    }
}
