package com.appurape.app.features.customer.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface CartDao {

    @Query("SELECT * FROM cart_items ORDER BY name ASC")
    fun getCartItems(): Flow<List<CartItem>>

    @Query("SELECT SUM(quantity) FROM cart_items")
    fun getCartCount(): Flow<Int?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(cartItem: CartItem)

    @Update
    suspend fun update(cartItem: CartItem)

    @Delete
    suspend fun delete(cartItem: CartItem)

    @Query("DELETE FROM cart_items WHERE menuItemId = :menuItemId")
    suspend fun deleteById(menuItemId: String)

    @Query("DELETE FROM cart_items")
    suspend fun clearCart()
}
