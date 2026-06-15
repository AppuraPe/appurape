using FluentValidation;
using IquitosDelivery.Application.DTOs.Businesses;

namespace IquitosDelivery.Application.Validators;

public class UpdateBusinessTypeStatusRequestValidator : AbstractValidator<UpdateBusinessTypeStatusRequest>
{
    public UpdateBusinessTypeStatusRequestValidator()
    {
    }
}
