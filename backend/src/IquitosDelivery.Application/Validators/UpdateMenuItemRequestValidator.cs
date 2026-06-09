using FluentValidation;
using IquitosDelivery.Application.DTOs.Menu;

namespace IquitosDelivery.Application.Validators;

public class UpdateMenuItemRequestValidator : AbstractValidator<UpdateMenuItemRequest>
{
    public UpdateMenuItemRequestValidator()
    {
        RuleFor(x => x.CategoryId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(1000);
        RuleFor(x => x.Price).GreaterThan(0);
        RuleFor(x => x.ImageUrl).MaximumLength(500);
        RuleFor(x => x.Sku).MaximumLength(80);
        RuleFor(x => x.UnitLabel).MaximumLength(50);
        RuleFor(x => x.StockQuantity)
            .GreaterThanOrEqualTo(0)
            .When(x => x.StockQuantity.HasValue);
    }
}
