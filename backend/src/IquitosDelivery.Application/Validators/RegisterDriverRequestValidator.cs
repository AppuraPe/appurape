using FluentValidation;
using IquitosDelivery.Application.Common;
using IquitosDelivery.Application.DTOs.Auth;

namespace IquitosDelivery.Application.Validators;

public class RegisterDriverRequestValidator : AbstractValidator<RegisterDriverRequest>
{
    public RegisterDriverRequestValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Phone)
            .NotEmpty()
            .MaximumLength(20)
            .Must(IdentityNormalization.IsValidPeruvianMobilePhone)
            .WithMessage("Ingresa un celular peruano válido de 9 dígitos.");
        RuleFor(x => x.IdentityDocumentNumber)
            .NotEmpty()
            .MaximumLength(30)
            .Must(IdentityNormalization.IsValidPeruvianDni)
            .WithMessage("Ingresa un DNI válido de 8 dígitos.");
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6);
        RuleFor(x => x.Plate).NotEmpty().MaximumLength(20);
        RuleFor(x => x.ZoneId).NotEmpty();
    }
}
