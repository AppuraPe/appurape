package com.appurape.app.features.customer.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "cart_items")
data class CartItem(
    @PrimaryKey val menuItemId: String,
    val businessId: String,
    val businessName: String,
    val name: String,
    val price: Double,
    val quantity: Int
)
