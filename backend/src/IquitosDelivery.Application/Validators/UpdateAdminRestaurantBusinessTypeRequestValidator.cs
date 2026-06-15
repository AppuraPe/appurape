using FluentValidation;
using IquitosDelivery.Application.DTOs.Admin;

namespace IquitosDelivery.Application.Validators;

public class UpdateAdminRestaurantBusinessTypeRequestValidator : AbstractValidator<UpdateAdminRestaurantBusinessTypeRequest>
{
    public UpdateAdminRestaurantBusinessTypeRequestValidator()
    {
        RuleFor(x => x.BusinessTypeId)
            .NotEmpty()
            .WithMessage("Debes seleccionar un tipo de negocio.");
    }
}
