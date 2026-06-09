using FluentValidation;
using IquitosDelivery.Application.DTOs.Community;

namespace IquitosDelivery.Application.Validators;

public class RateCommunityCollaboratorRequestValidator : AbstractValidator<RateCommunityCollaboratorRequest>
{
    public RateCommunityCollaboratorRequestValidator()
    {
        RuleFor(x => x.Rating)
            .InclusiveBetween(1, 5);

        RuleFor(x => x.Comment)
            .MaximumLength(1000);
    }
}
