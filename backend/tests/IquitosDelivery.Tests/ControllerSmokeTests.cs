using IquitosDelivery.Api.Controllers;
using IquitosDelivery.Api.Controllers.Requests.Auth;
using IquitosDelivery.Application.DTOs.Admin;
using IquitosDelivery.Application.DTOs.Auth;
using IquitosDelivery.Application.DTOs.Businesses;
using IquitosDelivery.Application.DTOs.Drivers;
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
            Mock.Of<IDriverRegistrationService>(),
            Mock.Of<IFileStorageService>());

        var result = await controller.Login(new LoginRequest { Email = "demo@appurape.com", Password = "secret" }, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status200OK, ok.StatusCode);
        authService.Verify(service => service.LoginAsync(It.IsAny<LoginRequest>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task AuthController_RestaurantVerificationFlow_ReturnsOkAndCallsServices()
    {
        var authService = Mock.Of<IAuthService>();
        var customerService = Mock.Of<ICustomerRegistrationService>();
        var restaurantService = new Mock<IRestaurantRegistrationService>(MockBehavior.Strict);

        restaurantService
            .Setup(service => service.StartRestaurantRegistrationAsync(It.IsAny<StartRestaurantRegistrationRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new VerificationCodeResponse());
        restaurantService
            .Setup(service => service.VerifyRestaurantCodeAsync(It.IsAny<VerifyRestaurantRegistrationCodeRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new VerificationStatusResponse());
        restaurantService
            .Setup(service => service.CompleteRestaurantRegistrationAsync(It.IsAny<CompleteRestaurantRegistrationRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AuthResponse());
        restaurantService
            .Setup(service => service.ResendRestaurantCodeAsync(It.IsAny<ResendRestaurantRegistrationCodeRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new VerificationCodeResponse());

        var controller = new AuthController(
            authService,
            customerService,
            restaurantService.Object,
            Mock.Of<IDriverRegistrationService>(),
            Mock.Of<IFileStorageService>());

        var startResult = await controller.StartRestaurantRegistration(new StartRestaurantRegistrationFormRequest(), CancellationToken.None);
        var verifyResult = await controller.VerifyRestaurantRegistrationCode(new VerifyRestaurantRegistrationCodeRequest(), CancellationToken.None);
        var completeResult = await controller.CompleteRestaurantRegistration(new CompleteRestaurantRegistrationRequest(), CancellationToken.None);
        var resendResult = await controller.ResendRestaurantRegistrationCode(new ResendRestaurantRegistrationCodeRequest(), CancellationToken.None);

        Assert.IsType<OkObjectResult>(startResult.Result);
        Assert.IsType<OkObjectResult>(verifyResult.Result);
        Assert.IsType<OkObjectResult>(completeResult.Result);
        Assert.IsType<OkObjectResult>(resendResult.Result);
        restaurantService.Verify(service => service.StartRestaurantRegistrationAsync(It.IsAny<StartRestaurantRegistrationRequest>(), It.IsAny<CancellationToken>()), Times.Once);
        restaurantService.Verify(service => service.VerifyRestaurantCodeAsync(It.IsAny<VerifyRestaurantRegistrationCodeRequest>(), It.IsAny<CancellationToken>()), Times.Once);
        restaurantService.Verify(service => service.CompleteRestaurantRegistrationAsync(It.IsAny<CompleteRestaurantRegistrationRequest>(), It.IsAny<CancellationToken>()), Times.Once);
        restaurantService.Verify(service => service.ResendRestaurantCodeAsync(It.IsAny<ResendRestaurantRegistrationCodeRequest>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task AuthController_DriverVerificationFlow_ReturnsOkAndCallsServices()
    {
        var authService = Mock.Of<IAuthService>();
        var customerService = Mock.Of<ICustomerRegistrationService>();
        var driverService = new Mock<IDriverRegistrationService>(MockBehavior.Strict);

        driverService
            .Setup(service => service.StartDriverRegistrationAsync(It.IsAny<StartDriverRegistrationRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new VerificationCodeResponse());
        driverService
            .Setup(service => service.VerifyDriverCodeAsync(It.IsAny<VerifyDriverRegistrationCodeRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new VerificationStatusResponse());
        driverService
            .Setup(service => service.CompleteDriverRegistrationAsync(It.IsAny<CompleteDriverRegistrationRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AuthResponse());
        driverService
            .Setup(service => service.ResendDriverCodeAsync(It.IsAny<ResendDriverRegistrationCodeRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new VerificationCodeResponse());

        var controller = new AuthController(
            authService,
            customerService,
            Mock.Of<IRestaurantRegistrationService>(),
            driverService.Object,
            Mock.Of<IFileStorageService>());

        var startResult = await controller.StartDriverRegistration(new StartDriverRegistrationFormRequest(), CancellationToken.None);
        var verifyResult = await controller.VerifyDriverRegistrationCode(new VerifyDriverRegistrationCodeRequest(), CancellationToken.None);
        var completeResult = await controller.CompleteDriverRegistration(new CompleteDriverRegistrationRequest(), CancellationToken.None);
        var resendResult = await controller.ResendDriverRegistrationCode(new ResendDriverRegistrationCodeRequest(), CancellationToken.None);

        Assert.IsType<OkObjectResult>(startResult.Result);
        Assert.IsType<OkObjectResult>(verifyResult.Result);
        Assert.IsType<OkObjectResult>(completeResult.Result);
        Assert.IsType<OkObjectResult>(resendResult.Result);
        driverService.Verify(service => service.StartDriverRegistrationAsync(It.IsAny<StartDriverRegistrationRequest>(), It.IsAny<CancellationToken>()), Times.Once);
        driverService.Verify(service => service.VerifyDriverCodeAsync(It.IsAny<VerifyDriverRegistrationCodeRequest>(), It.IsAny<CancellationToken>()), Times.Once);
        driverService.Verify(service => service.CompleteDriverRegistrationAsync(It.IsAny<CompleteDriverRegistrationRequest>(), It.IsAny<CancellationToken>()), Times.Once);
        driverService.Verify(service => service.ResendDriverCodeAsync(It.IsAny<ResendDriverRegistrationCodeRequest>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task AdminRestaurantsController_PendingAndApprovalEndpoints_ReturnOk()
    {
        var service = new Mock<IAdminRestaurantService>(MockBehavior.Strict);
        service
            .Setup(x => x.GetRestaurantsAsync(It.IsAny<AdminRestaurantFilterRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<AdminRestaurantListItemResponse>());
        service
            .Setup(x => x.GetPendingRestaurantsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<PendingRestaurantResponse>());
        service
            .Setup(x => x.GetRestaurantByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AdminRestaurantDetailResponse());
        service
            .Setup(x => x.UpdateRestaurantStatusAsync(It.IsAny<Guid>(), It.IsAny<UpdateAdminEntityStatusRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AdminRestaurantDetailResponse());
        service
            .Setup(x => x.ApproveRestaurantAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PendingRestaurantResponse());
        service
            .Setup(x => x.RejectRestaurantAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PendingRestaurantResponse());

        var controller = new AdminRestaurantsController(service.Object);
        var restaurantId = Guid.NewGuid();

        Assert.IsType<OkObjectResult>((await controller.GetRestaurants(new AdminRestaurantFilterRequest(), CancellationToken.None)).Result);
        Assert.IsType<OkObjectResult>((await controller.GetPending(CancellationToken.None)).Result);
        Assert.IsType<OkObjectResult>((await controller.GetRestaurant(restaurantId, CancellationToken.None)).Result);
        Assert.IsType<OkObjectResult>((await controller.UpdateStatus(restaurantId, new UpdateAdminEntityStatusRequest(), CancellationToken.None)).Result);
        Assert.IsType<OkObjectResult>((await controller.Approve(restaurantId, CancellationToken.None)).Result);
        Assert.IsType<OkObjectResult>((await controller.Reject(restaurantId, CancellationToken.None)).Result);
    }

    [Fact]
    public async Task AdminDriversController_PendingAndApprovalEndpoints_ReturnOk()
    {
        var service = new Mock<IAdminDriverService>(MockBehavior.Strict);
        service
            .Setup(x => x.GetDriversAsync(It.IsAny<AdminDriverFilterRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<AdminDriverListItemResponse>());
        service
            .Setup(x => x.GetPendingDriversAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<PendingDriverResponse>());
        service
            .Setup(x => x.GetDriverByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AdminDriverDetailResponse());
        service
            .Setup(x => x.UpdateDriverStatusAsync(It.IsAny<Guid>(), It.IsAny<UpdateAdminEntityStatusRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AdminDriverDetailResponse());
        service
            .Setup(x => x.ApproveDriverAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PendingDriverResponse());
        service
            .Setup(x => x.RejectDriverAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PendingDriverResponse());

        var controller = new AdminDriversController(service.Object);
        var driverId = Guid.NewGuid();

        Assert.IsType<OkObjectResult>((await controller.GetDrivers(new AdminDriverFilterRequest(), CancellationToken.None)).Result);
        Assert.IsType<OkObjectResult>((await controller.GetPending(CancellationToken.None)).Result);
        Assert.IsType<OkObjectResult>((await controller.GetDriver(driverId, CancellationToken.None)).Result);
        Assert.IsType<OkObjectResult>((await controller.UpdateStatus(driverId, new UpdateAdminEntityStatusRequest(), CancellationToken.None)).Result);
        Assert.IsType<OkObjectResult>((await controller.Approve(driverId, CancellationToken.None)).Result);
        Assert.IsType<OkObjectResult>((await controller.Reject(driverId, CancellationToken.None)).Result);
    }

    [Fact]
    public async Task AdminBusinessTypesController_CrudEndpoints_ReturnOk()
    {
        var service = new Mock<IAdminBusinessTypeService>(MockBehavior.Strict);
        service
            .Setup(x => x.GetBusinessTypesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<AdminBusinessTypeResponse>());
        service
            .Setup(x => x.CreateBusinessTypeAsync(It.IsAny<UpsertAdminBusinessTypeRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AdminBusinessTypeResponse());
        service
            .Setup(x => x.UpdateBusinessTypeAsync(It.IsAny<Guid>(), It.IsAny<UpsertAdminBusinessTypeRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AdminBusinessTypeResponse());
        service
            .Setup(x => x.UpdateBusinessTypeStatusAsync(It.IsAny<Guid>(), It.IsAny<UpdateBusinessTypeStatusRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AdminBusinessTypeResponse());

        var controller = new AdminBusinessTypesController(service.Object);
        var businessTypeId = Guid.NewGuid();

        Assert.IsType<OkObjectResult>((await controller.GetBusinessTypes(CancellationToken.None)).Result);
        Assert.IsType<OkObjectResult>((await controller.CreateBusinessType(new UpsertAdminBusinessTypeRequest(), CancellationToken.None)).Result);
        Assert.IsType<OkObjectResult>((await controller.UpdateBusinessType(businessTypeId, new UpsertAdminBusinessTypeRequest(), CancellationToken.None)).Result);
        Assert.IsType<OkObjectResult>((await controller.UpdateBusinessTypeStatus(businessTypeId, new UpdateBusinessTypeStatusRequest(), CancellationToken.None)).Result);
    }

    [Fact]
    public async Task AdminPaymentsController_Endpoints_ReturnOk()
    {
        var service = new Mock<IAdminPaymentService>(MockBehavior.Strict);
        service
            .Setup(x => x.GetPendingPaymentsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<AdminPaymentListItemResponse>());
        service
            .Setup(x => x.GetPaymentByOrderIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AdminPaymentDetailResponse());
        service
            .Setup(x => x.ConfirmPaymentAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AdminPaymentDetailResponse());
        service
            .Setup(x => x.RejectPaymentAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AdminPaymentDetailResponse());

        var controller = new AdminPaymentsController(service.Object);
        var orderId = Guid.NewGuid();

        Assert.IsType<OkObjectResult>((await controller.GetPending(CancellationToken.None)).Result);
        Assert.IsType<OkObjectResult>((await controller.GetPayment(orderId, CancellationToken.None)).Result);
        Assert.IsType<OkObjectResult>((await controller.ConfirmPayment(orderId, CancellationToken.None)).Result);
        Assert.IsType<OkObjectResult>((await controller.RejectPayment(orderId, CancellationToken.None)).Result);
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
    public async Task BusinessesController_GetPublicProduct_ReturnsOkAndCallsService()
    {
        var businessService = Mock.Of<IBusinessService>();
        var catalogService = new Mock<ICatalogService>(MockBehavior.Strict);
        var businessId = Guid.NewGuid();
        var productId = Guid.NewGuid();

        catalogService
            .Setup(service => service.GetPublicProductAsync(businessId, productId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PublicProductDetailResponse());

        var controller = new BusinessesController(businessService, catalogService.Object);

        var result = await controller.GetPublicProduct(businessId, productId, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status200OK, ok.StatusCode);
        catalogService.Verify(service => service.GetPublicProductAsync(businessId, productId, It.IsAny<CancellationToken>()), Times.Once);
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
            ClientRequestId = Guid.NewGuid().ToString("N"),
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

    [Fact]
    public async Task OrdersController_ValidateOrder_ReturnsOkAndCallsService()
    {
        var orderService = new Mock<IOrderService>(MockBehavior.Strict);
        orderService
            .Setup(service => service.ValidateOrderAsync(It.IsAny<CreateOrderRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValidateOrderResponse());

        var controller = new OrdersController(orderService.Object);

        var request = new CreateOrderRequest
        {
            ClientRequestId = Guid.NewGuid().ToString("N"),
            RestaurantId = Guid.NewGuid(),
            ZoneId = Guid.NewGuid(),
            DeliveryAddress = "Av. Luna 123",
            DeliveryReference = "Porton azul",
            PaymentMethod = IquitosDelivery.Domain.Enums.PaymentMethod.Cash,
            Items = [new CreateOrderItemRequest { MenuItemId = Guid.NewGuid(), Quantity = 1, ClientUnitPrice = 15.5m }]
        };

        var result = await controller.ValidateOrder(request, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status200OK, ok.StatusCode);
        orderService.Verify(service => service.ValidateOrderAsync(It.IsAny<CreateOrderRequest>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RestaurantOrdersController_PaymentEndpoints_ReturnOkAndCallService()
    {
        var orderService = new Mock<IOrderService>(MockBehavior.Strict);
        orderService
            .Setup(service => service.GetRestaurantOrderPaymentAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RestaurantOrderPaymentResponse());
        orderService
            .Setup(service => service.ConfirmRestaurantOrderPaymentAsync(It.IsAny<Guid>(), It.IsAny<ConfirmRestaurantOrderPaymentRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RestaurantOrderPaymentResponse());
        orderService
            .Setup(service => service.RejectRestaurantOrderPaymentAsync(It.IsAny<Guid>(), It.IsAny<RejectRestaurantOrderPaymentRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RestaurantOrderPaymentResponse());

        var controller = new RestaurantOrdersController(orderService.Object);
        var orderId = Guid.NewGuid();

        var getResult = await controller.GetPayment(orderId, CancellationToken.None);
        var confirmResult = await controller.ConfirmPayment(orderId, new ConfirmRestaurantOrderPaymentRequest(), CancellationToken.None);
        var rejectResult = await controller.RejectPayment(orderId, new RejectRestaurantOrderPaymentRequest { FailureReason = "No se encontro el pago." }, CancellationToken.None);

        Assert.IsType<OkObjectResult>(getResult.Result);
        Assert.IsType<OkObjectResult>(confirmResult.Result);
        Assert.IsType<OkObjectResult>(rejectResult.Result);
        orderService.Verify(service => service.GetRestaurantOrderPaymentAsync(orderId, It.IsAny<CancellationToken>()), Times.Once);
        orderService.Verify(service => service.ConfirmRestaurantOrderPaymentAsync(orderId, It.IsAny<ConfirmRestaurantOrderPaymentRequest>(), It.IsAny<CancellationToken>()), Times.Once);
        orderService.Verify(service => service.RejectRestaurantOrderPaymentAsync(orderId, It.IsAny<RejectRestaurantOrderPaymentRequest>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task BusinessOrdersController_ListDetailAndStatusEndpoints_ReturnOkAndCallService()
    {
        var service = new Mock<IBusinessOrderService>(MockBehavior.Strict);
        service
            .Setup(x => x.GetBusinessOrdersAsync(It.IsAny<RestaurantOrderFilterRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<RestaurantOrderListItemResponse>());
        service
            .Setup(x => x.GetBusinessOrderByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RestaurantOrderDetailResponse());
        service
            .Setup(x => x.UpdateBusinessOrderStatusAsync(It.IsAny<Guid>(), It.IsAny<UpdateOrderStatusRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RestaurantOrderDetailResponse());

        var controller = new BusinessOrdersController(service.Object);
        var orderId = Guid.NewGuid();

        Assert.IsType<OkObjectResult>((await controller.GetOrders(new RestaurantOrderFilterRequest(), CancellationToken.None)).Result);
        Assert.IsType<OkObjectResult>((await controller.GetOrder(orderId, CancellationToken.None)).Result);
        Assert.IsType<OkObjectResult>((await controller.UpdateStatus(orderId, new UpdateOrderStatusRequest(), CancellationToken.None)).Result);
    }
}
