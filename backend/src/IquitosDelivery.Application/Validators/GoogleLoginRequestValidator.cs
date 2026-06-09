using FluentValidation;
using IquitosDelivery.Application.DTOs.Auth;

namespace IquitosDelivery.Application.Validators;

public class GoogleLoginRequestValidator : AbstractValidator<GoogleLoginRequest>
{
    public GoogleLoginRequestValidator()
    {
        RuleFor(x => x.IdToken).NotEmpty();
    }
}
