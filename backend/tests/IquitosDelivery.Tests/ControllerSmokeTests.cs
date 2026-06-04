using IquitosDelivery.Api.Controllers;
using IquitosDelivery.Application.DTOs.Auth;
using IquitosDelivery.Application.DTOs.Menu;
using IquitosDelivery.Application.DTOs.Orders;
using IquitosDelivery.Application.DTOs.Restaurants;
using IquitosDelivery.Application.DTOs.Search;
using IquitosDelivery.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace IquitosDelivery.Tests;

public class ControllerSmokeTests
{
    [Fact]
    public async Task AuthController_Login_ReturnsOkAndCallsService()
    {
        var authService = new Mock<IAuthService>(MockBehavior.Strict);
        authService
            .Setup(service => service.LoginAsync(It.IsAny<LoginRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AuthResponse());

        var controller = new AuthController(
            authService.Object,
            Mock.Of<ICustomerRegistrationService>(),
            Mock.Of<IRestaurantRegistrationService>(),
            Mock.Of<IDriverRegistrationService>());

        var result = await controller.Login(new LoginRequest { Email = "demo@appurape.com", Password = "secret" }, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status200OK, ok.StatusCode);
        authService.Verify(service => service.LoginAsync(It.IsAny<LoginRequest>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RestaurantsController_GetRestaurants_ReturnsOkAndCallsService()
    {
        var restaurantService = new Mock<IRestaurantService>(MockBehavior.Strict);
        restaurantService
            .Setup(service => service.GetPublicRestaurantsAsync(It.IsAny<PublicRestaurantFilterRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<RestaurantListItemResponse>());

        var menuService = new Mock<IMenuService>(MockBehavior.Strict);
        var controller = new RestaurantsController(restaurantService.Object, menuService.Object);

        var result = await controller.GetRestaurants(new PublicRestaurantFilterRequest { Q = "pollo" }, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status200OK, ok.StatusCode);
        restaurantService.Verify(service => service.GetPublicRestaurantsAsync(It.IsAny<PublicRestaurantFilterRequest>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RestaurantsController_GetPublicMenu_ReturnsOkAndCallsService()
    {
        var restaurantService = Mock.Of<IRestaurantService>();
        var menuService = new Mock<IMenuService>(MockBehavior.Strict);
        menuService
            .Setup(service => service.GetPublicMenuAsync(It.IsAny<Guid>(), It.IsAny<PublicMenuFilterRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PublicMenuResponse());

        var controller = new RestaurantsController(restaurantService, menuService.Object);

        var restaurantId = Guid.NewGuid();
        var result = await controller.GetPublicMenu(restaurantId, new PublicMenuFilterRequest { Q = "menu" }, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status200OK, ok.StatusCode);
        menuService.Verify(service => service.GetPublicMenuAsync(restaurantId, It.IsAny<PublicMenuFilterRequest>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SearchController_Search_ReturnsOkAndCallsService()
    {
        var searchService = new Mock<ISearchService>(MockBehavior.Strict);
        searchService
            .Setup(service => service.SearchPublicAsync(It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PublicSearchResponse());

        var controller = new SearchController(searchService.Object);

        var result = await controller.Search("mondongo", CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status200OK, ok.StatusCode);
        searchService.Verify(service => service.SearchPublicAsync("mondongo", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task OrdersController_CreateOrder_ReturnsOkAndCallsService()
    {
        var orderService = new Mock<IOrderService>(MockBehavior.Strict);
        orderService
            .Setup(service => service.CreateOrderAsync(It.IsAny<CreateOrderRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CustomerOrderDetailResponse());

        var controller = new OrdersController(orderService.Object);

        var request = new CreateOrderRequest
        {
            RestaurantId = Guid.NewGuid(),
            ZoneId = Guid.NewGuid(),
            DeliveryAddress = "Av. Luna 123",
            DeliveryReference = "Porton azul",
            PaymentMethod = IquitosDelivery.Domain.Enums.PaymentMethod.Cash,
            Items = [new CreateOrderItemRequest { MenuItemId = Guid.NewGuid(), Quantity = 1 }]
        };

        var result = await controller.CreateOrder(request, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status200OK, ok.StatusCode);
        orderService.Verify(service => service.CreateOrderAsync(It.IsAny<CreateOrderRequest>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}
