package com.appurape.app.features.customer.data

import com.appurape.app.features.customer.data.local.CartDao
import com.appurape.app.features.customer.data.local.CartItem
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CartRepository @Inject constructor(
    private val cartDao: CartDao
) {
    val cartItems: Flow<List<CartItem>> = cartDao.getCartItems()
    val cartCount: Flow<Int?> = cartDao.getCartCount()

    suspend fun addItem(item: CartItem) {
        cartDao.insert(item)
    }

    suspend fun updateItem(item: CartItem) {
        cartDao.update(item)
    }

    suspend fun deleteItem(item: CartItem) {
        cartDao.delete(item)
    }

    suspend fun deleteById(menuItemId: String) {
        cartDao.deleteById(menuItemId)
    }

    suspend fun clearCart() {
        cartDao.clearCart()
    }
}
