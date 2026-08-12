package com.appurape.app.features.customer.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.appurape.app.features.customer.data.*
import com.appurape.app.features.customer.data.local.CartItem
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

sealed interface CheckoutUiState {
    object Idle : CheckoutUiState
    object Loading : CheckoutUiState
    data class Success(val response: CreateOrderResponse) : CheckoutUiState
    data class Error(val message: String) : CheckoutUiState
}

@HiltViewModel
class CheckoutViewModel @Inject constructor(
    private val ordersRepository: OrdersRepository,
    private val cartRepository: CartRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<CheckoutUiState>(CheckoutUiState.Idle)
    val uiState: StateFlow<CheckoutUiState> = _uiState.asStateFlow()

    val cartItems: StateFlow<List<CartItem>> = cartRepository.cartItems
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val totalCartCount: StateFlow<Int> = cartRepository.cartCount
        .map { it ?: 0 }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    val cartSubtotal: StateFlow<Double> = cartItems
        .map { items -> items.sumOf { it.price * it.quantity } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0.0)

    // Coordenadas GPS del mapa
    var latitude = MutableStateFlow(0.0)
    var longitude = MutableStateFlow(0.0)

    fun createOrder(
        address: String,
        reference: String,
        notes: String?,
        paymentMethod: Int
    ) {
        val items = cartItems.value
        if (items.isEmpty()) {
            _uiState.value = CheckoutUiState.Error("El carrito está vacío")
            return
        }

        if (address.isBlank() || reference.isBlank()) {
            _uiState.value = CheckoutUiState.Error("Por favor completa dirección y referencia")
            return
        }

        val businessId = items.first().businessId
        // Para simplificar, la zona se asume mapeada o por defecto
        val zoneId = "8a2f4c4c-47bc-4672-88ba-38a49ff2c8d2" // Mock ZoneId matching database

        viewModelScope.launch {
            _uiState.value = CheckoutUiState.Loading

            val payload = CreateOrderRequest(
                clientRequestId = UUID.randomUUID().toString(),
                restaurantId = businessId,
                zoneId = zoneId,
                deliveryAddress = address.trim(),
                deliveryReference = reference.trim(),
                notes = notes?.trim()?.takeIf { it.isNotBlank() },
                paymentMethod = paymentMethod,
                items = items.map { OrderItemInput(it.menuItemId, it.quantity) }
            )

            ordersRepository.createOrder(payload)
                .onSuccess { response ->
                    cartRepository.clearCart() // Limpiamos el carrito local al crear el pedido
                    _uiState.value = CheckoutUiState.Success(response)
                }
                .onFailure { error ->
                    _uiState.value = CheckoutUiState.Error(error.localizedMessage ?: "Error al registrar pedido")
                }
        }
    }

    fun updateCoordinates(lat: Double, lng: Double) {
        latitude.value = lat
        longitude.value = lng
    }
}
