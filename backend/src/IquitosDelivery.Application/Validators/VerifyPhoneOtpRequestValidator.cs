using FluentValidation;
using IquitosDelivery.Application.Common;
using IquitosDelivery.Application.DTOs.Auth;

namespace IquitosDelivery.Application.Validators;

public class VerifyPhoneOtpRequestValidator : AbstractValidator<VerifyPhoneOtpRequest>
{
    public VerifyPhoneOtpRequestValidator()
    {
        RuleFor(x => x.Phone)
            .NotEmpty()
            .MaximumLength(20)
            .Must(IdentityNormalization.IsValidPeruvianMobilePhone)
            .WithMessage("Ingresa un celular peruano válido de 9 dígitos.");

        RuleFor(x => x.Code)
            .NotEmpty()
            .Matches(@"^\d{6}$")
            .WithMessage("Ingresa el código de 6 dígitos.");

        RuleFor(x => x.Purpose)
            .NotEmpty()
            .MaximumLength(50);
    }
}
