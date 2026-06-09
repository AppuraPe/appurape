using FluentValidation;
using IquitosDelivery.Application.DTOs.Auth;

namespace IquitosDelivery.Application.Validators;

public class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(256);

        RuleFor(x => x.Code)
            .NotEmpty()
            .Length(6)
            .Matches("^[0-9]{6}$");

        RuleFor(x => x.NewPassword)
            .NotEmpty()
            .MinimumLength(6)
            .MaximumLength(100);
    }
}
