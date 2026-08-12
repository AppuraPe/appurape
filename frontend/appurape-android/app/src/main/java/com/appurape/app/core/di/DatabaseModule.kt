package com.appurape.app.core.di

import android.content.Context
import androidx.room.Room
import com.appurape.app.features.customer.data.local.CartDao
import com.appurape.app.features.customer.data.local.CartDatabase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideCartDatabase(
        @ApplicationContext context: Context
    ): CartDatabase {
        return Room.databaseBuilder(
            context,
            CartDatabase::class.java,
            "appurape_cart_db"
        ).fallbackToDestructiveMigration().build()
    }

    @Provides
    @Singleton
    fun provideCartDao(database: CartDatabase): CartDao {
        return database.cartDao()
    }
}
