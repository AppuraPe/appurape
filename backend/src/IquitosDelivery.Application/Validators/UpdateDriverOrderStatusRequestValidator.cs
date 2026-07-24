using FluentValidation;
using IquitosDelivery.Application.DTOs.Drivers;
using IquitosDelivery.Domain.Enums;

namespace IquitosDelivery.Application.Validators;

public class UpdateDriverOrderStatusRequestValidator : AbstractValidator<UpdateDriverOrderStatusRequest>
{
    public UpdateDriverOrderStatusRequestValidator()
    {
        RuleFor(x => x.Status)
            .Must(status => status is OrderStatus.PickedUp or OrderStatus.OnTheWay or OrderStatus.Delivered)
            .WithMessage("Status is not allowed in this driver stage.");
    }
}
