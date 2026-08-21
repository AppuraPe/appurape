using FluentValidation;
using IquitosDelivery.Application.Common;
using IquitosDelivery.Application.DTOs.Auth;

namespace IquitosDelivery.Application.Validators;

public class StartPhoneOtpRequestValidator : AbstractValidator<StartPhoneOtpRequest>
{
    public StartPhoneOtpRequestValidator()
    {
        RuleFor(x => x.Phone)
            .NotEmpty()
            .MaximumLength(20)
            .Must(IdentityNormalization.IsValidPeruvianMobilePhone)
            .WithMessage("Ingresa un celular peruano válido de 9 dígitos.");

        RuleFor(x => x.Purpose)
            .NotEmpty()
            .MaximumLength(50);
    }
}
