using FluentValidation;
using IquitosDelivery.Application.DTOs.Community;

namespace IquitosDelivery.Application.Validators;

public class CompleteCommunityRequestRequestValidator : AbstractValidator<CompleteCommunityRequestRequest>
{
    public CompleteCommunityRequestRequestValidator()
    {
        RuleFor(x => x.ConfirmationCode)
            .NotEmpty()
            .Length(6);
    }
}
