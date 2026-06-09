using FluentValidation;
using IquitosDelivery.Application.DTOs.Admin;

namespace IquitosDelivery.Application.Validators;

public class UpdateAdminEntityStatusRequestValidator : AbstractValidator<UpdateAdminEntityStatusRequest>
{
    private static readonly string[] AllowedActions = ["approve", "reject", "suspend", "reactivate", "trust", "verify"];

    public UpdateAdminEntityStatusRequestValidator()
    {
        RuleFor(x => x.Action)
            .NotEmpty()
            .Must(action => AllowedActions.Contains(action.Trim().ToLowerInvariant()))
            .WithMessage("Action must be one of: approve, reject, suspend, reactivate, trust, verify.");
    }
}
