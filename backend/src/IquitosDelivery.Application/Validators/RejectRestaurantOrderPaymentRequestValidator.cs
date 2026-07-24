using FluentValidation;
using IquitosDelivery.Application.DTOs.Orders;

namespace IquitosDelivery.Application.Validators;

public class RejectRestaurantOrderPaymentRequestValidator : AbstractValidator<RejectRestaurantOrderPaymentRequest>
{
    public RejectRestaurantOrderPaymentRequestValidator()
    {
        RuleFor(x => x.FailureReason)
            .NotEmpty()
            .MaximumLength(500);
    }
}
