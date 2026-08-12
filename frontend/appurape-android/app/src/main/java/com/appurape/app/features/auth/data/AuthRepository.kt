package com.appurape.app.features.auth.data

import com.appurape.app.core.data.local.SessionManager
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val authApi: AuthApi,
    private val sessionManager: SessionManager
) {
    val tokenFlow: Flow<String?> = sessionManager.tokenFlow
    val roleFlow: Flow<String?> = sessionManager.roleFlow
    val emailFlow: Flow<String?> = sessionManager.emailFlow

    suspend fun login(email: String, password: String): Result<AuthResponse> {
        return try {
            val response = authApi.login(LoginRequest(email, password))
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                sessionManager.saveSession(body.token, body.role, body.email)
                Result.success(body)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Error de autenticación"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun loginWithGoogle(idToken: String): Result<AuthResponse> {
        return try {
            val response = authApi.loginWithGoogle(GoogleLoginRequest(idToken))
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                sessionManager.saveSession(body.token, body.role, body.email)
                Result.success(body)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Error de autenticación con Google"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun logout() {
        sessionManager.clearSession()
    }
}
