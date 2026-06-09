using FluentValidation;
using IquitosDelivery.Application.DTOs.Community;

namespace IquitosDelivery.Application.Validators;

public class UpdateCommunityCollaboratorRequestValidator : AbstractValidator<UpdateCommunityCollaboratorRequest>
{
    public UpdateCommunityCollaboratorRequestValidator()
    {
        RuleFor(x => x.AvailabilityRadiusKm)
            .GreaterThan(0)
            .LessThanOrEqualTo(50);
    }
}
