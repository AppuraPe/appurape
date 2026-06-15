using FluentValidation;
using IquitosDelivery.Application.DTOs.Businesses;

namespace IquitosDelivery.Application.Validators;

public class UpsertAdminBusinessTypeRequestValidator : AbstractValidator<UpsertAdminBusinessTypeRequest>
{
    public UpsertAdminBusinessTypeRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(120);
        RuleFor(x => x.IconKey).MaximumLength(80);
        RuleFor(x => x.SortOrder).GreaterThanOrEqualTo(0);
    }
}
