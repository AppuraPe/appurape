using IquitosDelivery.Domain.Entities;

namespace IquitosDelivery.Application.Interfaces;

public interface IJwtTokenService
{
    string GenerateToken(User user);
}
