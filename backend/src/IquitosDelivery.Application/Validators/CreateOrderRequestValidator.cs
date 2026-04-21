using FluentValidation;
using IquitosDelivery.Application.DTOs.Orders;

namespace IquitosDelivery.Application.Validators;

public class CreateOrderRequestValidator : AbstractValidator<CreateOrderRequest>
{
    public CreateOrderRequestValidator()
    {
        RuleFor(x => x.RestaurantId).NotEmpty();
        RuleFor(x => x.ZoneId).NotEmpty();
        RuleFor(x => x.DeliveryAddress).NotEmpty().MaximumLength(300);
        RuleFor(x => x.DeliveryReference).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Notes).MaximumLength(1000);
        RuleFor(x => x.PaymentMethod).IsInEnum();
        RuleFor(x => x.Items).NotEmpty().Must(x => x.Count > 0);
        RuleForEach(x => x.Items).SetValidator(new CreateOrderItemRequestValidator());
    }
}
