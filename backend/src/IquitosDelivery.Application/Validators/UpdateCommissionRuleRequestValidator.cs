using FluentValidation;
using IquitosDelivery.Application.DTOs.Finance;

namespace IquitosDelivery.Application.Validators;

public class UpdateCommissionRuleRequestValidator : AbstractValidator<UpdateCommissionRuleRequest>
{
    public UpdateCommissionRuleRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(150);

        RuleFor(x => x.Description)
            .MaximumLength(1000);

        RuleFor(x => x.Value)
            .GreaterThanOrEqualTo(0);

        RuleFor(x => x.MinAmount)
            .GreaterThanOrEqualTo(0)
            .When(x => x.MinAmount.HasValue);

        RuleFor(x => x.MaxAmount)
            .GreaterThanOrEqualTo(0)
            .When(x => x.MaxAmount.HasValue);

        RuleFor(x => x)
            .Must(x => !x.MinAmount.HasValue || !x.MaxAmount.HasValue || x.MaxAmount.Value >= x.MinAmount.Value)
            .WithMessage("MaxAmount must be greater than or equal to MinAmount.");
    }
}
