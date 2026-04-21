using FluentValidation;
using IquitosDelivery.Application.DTOs.Orders;
using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Application.Validators;

public class UpdateOrderStatusRequestValidator : AbstractValidator<UpdateOrderStatusRequest>
{
    public UpdateOrderStatusRequestValidator()
    {
        RuleFor(x => x.Status)
            .Must(status => status is OrderStatus.Accepted or OrderStatus.Preparing or OrderStatus.ReadyForPickup or OrderStatus.Cancelled)
            .WithMessage("Status is not allowed in this stage.");
    }
}
