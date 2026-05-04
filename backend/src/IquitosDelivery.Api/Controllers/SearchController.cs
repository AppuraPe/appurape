using IquitosDelivery.Application.DTOs.Search;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IquitosDelivery.Api.Controllers;

[ApiController]
[Route("api/search")]
[AllowAnonymous]
public class SearchController : ControllerBase
{
    private readonly ISearchService _searchService;

    public SearchController(ISearchService searchService)
    {
        _searchService = searchService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PublicSearchResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<PublicSearchResponse>> Search([FromQuery] string? q, CancellationToken cancellationToken)
    {
        var response = await _searchService.SearchPublicAsync(q, cancellationToken);
        return Ok(response);
    }
}
