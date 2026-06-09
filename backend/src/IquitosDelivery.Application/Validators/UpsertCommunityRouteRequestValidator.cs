using FluentValidation;
using IquitosDelivery.Application.DTOs.Community;

namespace IquitosDelivery.Application.Validators;

public class UpsertCommunityRouteRequestValidator : AbstractValidator<UpsertCommunityRouteRequest>
{
    public UpsertCommunityRouteRequestValidator()
    {
        RuleFor(x => x.OriginLabel)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.DestinationLabel)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.EstimatedMinutes)
            .GreaterThan(0)
            .LessThanOrEqualTo(1440);

        RuleFor(x => x.DeviationRadiusKm)
            .GreaterThan(0)
            .LessThanOrEqualTo(50);
    }
}
