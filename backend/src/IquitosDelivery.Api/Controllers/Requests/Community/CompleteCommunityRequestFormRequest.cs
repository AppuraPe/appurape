namespace IquitosDelivery.Api.Controllers.Requests.Community;

public class CompleteCommunityRequestFormRequest
{
    public string ConfirmationCode { get; set; } = string.Empty;

    public IFormFile? ProofImageFile { get; set; }
}
