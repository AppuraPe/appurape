using FluentValidation;
using IquitosDelivery.Application.DTOs.Restaurants;

namespace IquitosDelivery.Application.Validators;

public class UpdateMyRestaurantRequestValidator : AbstractValidator<UpdateMyRestaurantRequest>
{
    public UpdateMyRestaurantRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(1000);
        RuleFor(x => x.Address).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Reference).NotEmpty().MaximumLength(300);
        RuleFor(x => x.ZoneId).NotEmpty();
        RuleFor(x => x.LogoUrl).MaximumLength(500);
        RuleFor(x => x.OwnDeliveryFee)
            .GreaterThanOrEqualTo(0)
            .When(x => x.OwnDeliveryFee.HasValue);
        RuleFor(x => x.OwnDeliveryNote).MaximumLength(500);
        RuleFor(x => x.OwnDeliveryFee)
            .NotNull()
            .When(x => x.HasOwnDelivery)
            .WithMessage("OwnDeliveryFee is required when own delivery is enabled.");
        RuleFor(x => x.OpenTime).NotEmpty();
        RuleFor(x => x.CloseTime)
            .NotEmpty()
            .Must((request, closeTime) => closeTime > request.OpenTime)
            .WithMessage("CloseTime must be greater than OpenTime.");
    }
}
