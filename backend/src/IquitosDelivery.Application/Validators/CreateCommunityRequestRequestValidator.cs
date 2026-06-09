using FluentValidation;
using IquitosDelivery.Application.DTOs.Community;

namespace IquitosDelivery.Application.Validators;

public class CreateCommunityRequestRequestValidator : AbstractValidator<CreateCommunityRequestRequest>
{
    public CreateCommunityRequestRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .MaximumLength(150);

        RuleFor(x => x.Description)
            .NotEmpty()
            .MaximumLength(2000);

        RuleFor(x => x.OriginLabel)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.DestinationLabel)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.CompensationAmount)
            .GreaterThanOrEqualTo(0);

        RuleFor(x => x.EstimatedPurchaseAmount)
            .GreaterThanOrEqualTo(0);
    }
}
