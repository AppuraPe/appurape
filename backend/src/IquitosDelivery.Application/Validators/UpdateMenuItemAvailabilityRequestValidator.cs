using FluentValidation;
using IquitosDelivery.Application.DTOs.Menu;

namespace IquitosDelivery.Application.Validators;

public class UpdateMenuItemAvailabilityRequestValidator : AbstractValidator<UpdateMenuItemAvailabilityRequest>
{
    public UpdateMenuItemAvailabilityRequestValidator()
    {
        RuleFor(x => x.IsAvailable).NotNull();
    }
}
