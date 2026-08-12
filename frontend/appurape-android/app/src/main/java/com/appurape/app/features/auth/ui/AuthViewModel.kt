package com.appurape.app.features.auth.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.appurape.app.features.auth.data.AuthRepository
import com.appurape.app.features.auth.data.AuthResponse
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface AuthUiState {
    object Idle : AuthUiState
    object Loading : AuthUiState
    data class Success(val response: AuthResponse) : AuthUiState
    data class Error(val message: String) : AuthUiState
}

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    fun login(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            _uiState.value = AuthUiState.Error("Completa todos los campos")
            return
        }

        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            authRepository.login(email.trim(), password)
                .onSuccess { response ->
                    _uiState.value = AuthUiState.Success(response)
                }
                .onFailure { error ->
                    _uiState.value = AuthUiState.Error(error.localizedMessage ?: "Error de conexión")
                }
        }
    }

    fun loginWithGoogle(idToken: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            authRepository.loginWithGoogle(idToken)
                .onSuccess { response ->
                    _uiState.value = AuthUiState.Success(response)
                }
                .onFailure { error ->
                    _uiState.value = AuthUiState.Error(error.localizedMessage ?: "Error al autenticar con Google")
                }
        }
    }

    fun clearError() {
        if (_uiState.value is AuthUiState.Error) {
            _uiState.value = AuthUiState.Idle
        }
    }
}
