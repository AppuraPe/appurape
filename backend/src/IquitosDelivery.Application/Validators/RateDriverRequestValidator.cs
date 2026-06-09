using FluentValidation;
using IquitosDelivery.Application.DTOs.Orders;

namespace IquitosDelivery.Application.Validators;

public class RateDriverRequestValidator : AbstractValidator<RateDriverRequest>
{
    public RateDriverRequestValidator()
    {
        RuleFor(x => x.Rating)
            .InclusiveBetween(1, 5);

        RuleFor(x => x.Comment)
            .MaximumLength(1000);
    }
}
