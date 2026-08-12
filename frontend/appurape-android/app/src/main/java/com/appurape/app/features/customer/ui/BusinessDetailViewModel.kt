package com.appurape.app.features.customer.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.appurape.app.features.customer.data.*
import com.appurape.app.features.customer.data.local.CartItem
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface BusinessDetailUiState {
    object Loading : BusinessDetailUiState
    data class Success(
        val business: BusinessDetailResponse,
        val catalog: CatalogResponse
    ) : BusinessDetailUiState
    data class Error(val message: String) : BusinessDetailUiState
}

@HiltViewModel
class BusinessDetailViewModel @Inject constructor(
    private val businessesRepository: BusinessesRepository,
    private val cartRepository: CartRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<BusinessDetailUiState>(BusinessDetailUiState.Loading)
    val uiState: StateFlow<BusinessDetailUiState> = _uiState.asStateFlow()

    val cartItems: StateFlow<List<CartItem>> = cartRepository.cartItems
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val totalCartCount: StateFlow<Int> = cartRepository.cartCount
        .map { it ?: 0 }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    val cartSubtotal: StateFlow<Double> = cartItems
        .map { items -> items.sumOf { it.price * it.quantity } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0.0)

    fun loadBusinessDetails(businessId: String) {
        viewModelScope.launch {
            _uiState.value = BusinessDetailUiState.Loading
            businessesRepository.getBusiness(businessId)
                .onSuccess { business ->
                    businessesRepository.getBusinessCatalog(businessId)
                        .onSuccess { catalog ->
                            _uiState.value = BusinessDetailUiState.Success(business, catalog)
                        }
                        .onFailure { error ->
                            _uiState.value = BusinessDetailUiState.Error(error.localizedMessage ?: "Error al cargar catálogo")
                        }
                }
                .onFailure { error ->
                    _uiState.value = BusinessDetailUiState.Error(error.localizedMessage ?: "Error al cargar negocio")
                }
        }
    }

    fun addItemToCart(businessId: String, businessName: String, item: MenuItemResponse) {
        viewModelScope.launch {
            val existing = cartItems.value.find { it.menuItemId == item.id }
            if (existing != null) {
                cartRepository.addItem(existing.copy(quantity = existing.quantity + 1))
            } else {
                cartRepository.addItem(
                    CartItem(
                        menuItemId = item.id,
                        businessId = businessId,
                        businessName = businessName,
                        name = item.name,
                        price = item.price,
                        quantity = 1
                    )
                )
            }
        }
    }

    fun incrementItemQuantity(menuItemId: String) {
        viewModelScope.launch {
            val existing = cartItems.value.find { it.menuItemId == menuItemId }
            if (existing != null) {
                cartRepository.addItem(existing.copy(quantity = existing.quantity + 1))
            }
        }
    }

    fun decrementItemQuantity(menuItemId: String) {
        viewModelScope.launch {
            val existing = cartItems.value.find { it.menuItemId == menuItemId }
            if (existing != null) {
                if (existing.quantity > 1) {
                    cartRepository.addItem(existing.copy(quantity = existing.quantity - 1))
                } else {
                    cartRepository.deleteItem(existing)
                }
            }
        }
    }

    fun removeItemFromCart(menuItemId: String) {
        viewModelScope.launch {
            cartRepository.deleteById(menuItemId)
        }
    }

    fun clearCart() {
        viewModelScope.launch {
            cartRepository.clearCart()
        }
    }
}
