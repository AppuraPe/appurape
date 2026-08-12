package com.appurape.app.features.customer.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.appurape.app.features.customer.data.BusinessListItemResponse
import com.appurape.app.features.customer.data.BusinessesRepository
import com.appurape.app.features.customer.data.PublicBusinessMobileHomeResponse
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface CustomerDashboardUiState {
    object Loading : CustomerDashboardUiState
    data class Success(
        val mobileHome: PublicBusinessMobileHomeResponse?,
        val businesses: List<BusinessListItemResponse>
    ) : CustomerDashboardUiState
    data class Error(val message: String) : CustomerDashboardUiState
}

@HiltViewModel
class CustomerDashboardViewModel @Inject constructor(
    private val repository: BusinessesRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<CustomerDashboardUiState>(CustomerDashboardUiState.Loading)
    val uiState: StateFlow<CustomerDashboardUiState> = _uiState.asStateFlow()

    private var cachedMobileHome: PublicBusinessMobileHomeResponse? = null

    init {
        loadDashboard()
    }

    fun loadDashboard() {
        viewModelScope.launch {
            _uiState.value = CustomerDashboardUiState.Loading
            repository.getMobileHome()
                .onSuccess { mobileHome ->
                    cachedMobileHome = mobileHome
                    // Por defecto cargamos también todos los negocios disponibles
                    loadFilteredBusinesses(null, null, null, null, null)
                }
                .onFailure { error ->
                    _uiState.value = CustomerDashboardUiState.Error(error.localizedMessage ?: "Error de red")
                }
        }
    }

    fun loadFilteredBusinesses(
        query: String?,
        zoneId: String?,
        businessTypeId: String?,
        openNow: Boolean?,
        sort: String?
    ) {
        viewModelScope.launch {
            _uiState.value = CustomerDashboardUiState.Loading
            repository.getBusinesses(query, zoneId, businessTypeId, openNow, sort)
                .onSuccess { businesses ->
                    _uiState.value = CustomerDashboardUiState.Success(
                        mobileHome = cachedMobileHome,
                        businesses = businesses
                    )
                }
                .onFailure { error ->
                    _uiState.value = CustomerDashboardUiState.Error(error.localizedMessage ?: "Error al buscar negocios")
                }
        }
    }
}
