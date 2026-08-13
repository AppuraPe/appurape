using FluentValidation;
using IquitosDelivery.Application.DTOs.Orders;
using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Application.Validators;

public class CreateOrderRequestValidator : AbstractValidator<CreateOrderRequest>
{
    public CreateOrderRequestValidator()
    {
        RuleFor(x => x.ClientRequestId).NotEmpty().MaximumLength(80);
        RuleFor(x => x.RestaurantId).NotEmpty();
        RuleFor(x => x.CustomerAddressId).NotEqual(Guid.Empty).When(x => x.CustomerAddressId.HasValue);
        RuleFor(x => x.ZoneId).NotEmpty().When(x => x.DeliveryMode != DeliveryMode.PickupOrDirect);
        RuleFor(x => x.DeliveryAddress).NotEmpty().MaximumLength(300).When(x => x.DeliveryMode != DeliveryMode.PickupOrDirect && !x.CustomerAddressId.HasValue);
        RuleFor(x => x.DeliveryReference).NotEmpty().MaximumLength(300).When(x => x.DeliveryMode != DeliveryMode.PickupOrDirect && !x.CustomerAddressId.HasValue);
        RuleFor(x => x.Notes).MaximumLength(1000);
        RuleFor(x => x.PaymentMethod).IsInEnum();
        RuleFor(x => x.DeliveryMode).IsInEnum();
        RuleFor(x => x.OfferedDeliveryAmount)
            .GreaterThanOrEqualTo(0)
            .When(x => x.OfferedDeliveryAmount.HasValue);
        RuleFor(x => x.Items).NotEmpty().Must(x => x.Count > 0);
        RuleForEach(x => x.Items).SetValidator(new CreateOrderItemRequestValidator());
    }
}
