using FluentValidation;
using IquitosDelivery.Application.DTOs.Auth;

namespace IquitosDelivery.Application.Validators;

public class ResendCustomerRegistrationCodeRequestValidator : AbstractValidator<ResendCustomerRegistrationCodeRequest>
{
    public ResendCustomerRegistrationCodeRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(256);
    }
}
