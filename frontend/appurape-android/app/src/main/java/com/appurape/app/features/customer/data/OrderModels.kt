package com.appurape.app.features.customer.data

import com.google.gson.annotations.SerializedName

data class OrderItemInput(
    @SerializedName("menuItemId") val menuItemId: String,
    @SerializedName("quantity") val quantity: Int
)

data class CreateOrderRequest(
    @SerializedName("clientRequestId") val clientRequestId: String,
    @SerializedName("restaurantId") val restaurantId: String,
    @SerializedName("zoneId") val zoneId: String,
    @SerializedName("deliveryAddress") val deliveryAddress: String,
    @SerializedName("deliveryReference") val deliveryReference: String,
    @SerializedName("notes") val notes: String?,
    @SerializedName("paymentMethod") val paymentMethod: Int,
    @SerializedName("items") val items: List<OrderItemInput>
)

data class CreateOrderResponse(
    @SerializedName("id") val id: String,
    @SerializedName("restaurantId") val restaurantId: String,
    @SerializedName("restaurantName") val restaurantName: String,
    @SerializedName("status") val status: String,
    @SerializedName("totalPrice") val totalPrice: Double
)
