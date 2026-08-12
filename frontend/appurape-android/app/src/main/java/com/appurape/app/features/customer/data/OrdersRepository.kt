package com.appurape.app.features.customer.data

import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class OrdersRepository @Inject constructor(
    private val ordersApi: OrdersApi
) {
    suspend fun createOrder(request: CreateOrderRequest): Result<CreateOrderResponse> {
        return try {
            val response = ordersApi.createOrder(request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Error al registrar el pedido"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
