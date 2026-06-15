using FluentValidation;
using IquitosDelivery.Application.DTOs.Auth;

namespace IquitosDelivery.Application.Validators;

public class RegisterRestaurantRequestValidator : AbstractValidator<RegisterRestaurantRequest>
{
    public RegisterRestaurantRequestValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6);
        RuleFor(x => x.RestaurantName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(1000);
        RuleFor(x => x.Address).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Reference).NotEmpty().MaximumLength(300);
        RuleFor(x => x.BusinessTypeId)
            .NotEmpty()
            .WithMessage("Debes seleccionar un tipo de negocio.");
        RuleFor(x => x.ZoneId).NotEmpty();
        RuleFor(x => x.OpenTime).NotEmpty();
        RuleFor(x => x.CloseTime)
            .NotEmpty()
            .Must((request, closeTime) => closeTime > request.OpenTime)
            .WithMessage("CloseTime must be greater than OpenTime.");
    }
}
