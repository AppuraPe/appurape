using System.Text.Json;
using FluentValidation;
using IquitosDelivery.Application.Exceptions;

namespace IquitosDelivery.Api.Middlewares;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ValidationException exception)
        {
            _logger.LogWarning(exception, "Validation failure for request {Method} {Path}", context.Request.Method, context.Request.Path);
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            context.Response.ContentType = "application/json";

            var payload = new
            {
                message = "Validation failed.",
                errors = exception.Errors.Select(x => new
                {
                    field = x.PropertyName,
                    error = x.ErrorMessage
                })
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
        }
        catch (UnauthorizedException exception)
        {
            _logger.LogWarning(exception, "Unauthorized request {Method} {Path}", context.Request.Method, context.Request.Path);
            await WriteErrorAsync(context, StatusCodes.Status401Unauthorized, exception.Message);
        }
        catch (ForbiddenException exception)
        {
            _logger.LogWarning(exception, "Forbidden request {Method} {Path}", context.Request.Method, context.Request.Path);
            await WriteErrorAsync(context, StatusCodes.Status403Forbidden, exception.Message);
        }
        catch (NotFoundException exception)
        {
            _logger.LogWarning(exception, "Resource not found for request {Method} {Path}", context.Request.Method, context.Request.Path);
            await WriteErrorAsync(context, StatusCodes.Status404NotFound, exception.Message);
        }
        catch (AppException exception)
        {
            _logger.LogWarning(exception, "Application error for request {Method} {Path}", context.Request.Method, context.Request.Path);
            await WriteErrorAsync(context, StatusCodes.Status400BadRequest, exception.Message);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unhandled error for request {Method} {Path}", context.Request.Method, context.Request.Path);
            await WriteErrorAsync(context, StatusCodes.Status500InternalServerError, "An unexpected error occurred.");
        }
    }

    private static Task WriteErrorAsync(HttpContext context, int statusCode, string message)
    {
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        var payload = JsonSerializer.Serialize(new { message });
        return context.Response.WriteAsync(payload);
    }
}
