using FluentValidation;
using IquitosDelivery.Application.DTOs.Orders;

namespace IquitosDelivery.Application.Validators;

public class ConfirmRestaurantOrderPaymentRequestValidator : AbstractValidator<ConfirmRestaurantOrderPaymentRequest>
{
    public ConfirmRestaurantOrderPaymentRequestValidator()
    {
        RuleFor(x => x.ManualReference)
            .MaximumLength(120);
    }
}
