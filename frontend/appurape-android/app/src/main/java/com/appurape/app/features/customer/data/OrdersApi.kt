package com.appurape.app.features.customer.data

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface OrdersApi {

    @POST("api/orders")
    suspend fun createOrder(
        @Body request: CreateOrderRequest
    ): Response<CreateOrderResponse>
}
