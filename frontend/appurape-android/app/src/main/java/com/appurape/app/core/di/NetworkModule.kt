package com.appurape.app.core.di

import com.appurape.app.core.data.network.AuthInterceptor
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    // En Android, 10.0.2.2 apunta al localhost del equipo host desde el emulador
    private const val BASE_URL = "http://10.0.2.2:5263/"

    @Provides
    @Singleton
    fun provideLoggingInterceptor(): HttpLoggingInterceptor {
        return HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
    }

    @Provides
    @Singleton
    fun provideOkHttpClient(
        authInterceptor: AuthInterceptor,
        loggingInterceptor: HttpLoggingInterceptor
    ): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(loggingInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(
        okHttpClient: OkHttpClient
    ): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    @Provides
    @Singleton
    fun provideAuthApi(retrofit: Retrofit): com.appurape.app.features.auth.data.AuthApi {
        return retrofit.create(com.appurape.app.features.auth.data.AuthApi::class.java)
    }

    @Provides
    @Singleton
    fun provideBusinessesApi(retrofit: Retrofit): com.appurape.app.features.customer.data.BusinessesApi {
        return retrofit.create(com.appurape.app.features.customer.data.BusinessesApi::class.java)
    }

    @Provides
    @Singleton
    fun provideOrdersApi(retrofit: Retrofit): com.appurape.app.features.customer.data.OrdersApi {
        return retrofit.create(com.appurape.app.features.customer.data.OrdersApi::class.java)
    }
}
