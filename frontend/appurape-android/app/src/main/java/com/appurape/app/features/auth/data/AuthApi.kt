package com.appurape.app.features.auth.data

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface AuthApi {

    @POST("api/auth/login")
    suspend fun login(
        @Body request: LoginRequest
    ): Response<AuthResponse>

    @POST("api/auth/google")
    suspend fun loginWithGoogle(
        @Body request: GoogleLoginRequest
    ): Response<AuthResponse>
}
