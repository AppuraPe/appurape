package com.appurape.app.features.customer.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.appurape.app.core.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CheckoutScreen(
    viewModel: CheckoutViewModel,
    onBackClick: () -> Unit,
    onOrderCreatedSuccess: (orderId: String) -> Unit,
    modifier: Modifier = Modifier
) {
    var address by remember { mutableStateOf("") }
    var reference by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }
    var selectedPaymentMethod by remember { mutableStateOf(0) } // 0 = Cash, 1 = Yape, 2 = Plin, 3 = Card

    val uiState by viewModel.uiState.collectAsState()
    val cartItems by viewModel.cartItems.collectAsState()
    val cartSubtotal by viewModel.cartSubtotal.collectAsState()

    val latitude by viewModel.latitude.collectAsState()
    val longitude by viewModel.longitude.collectAsState()

    LaunchedEffect(uiState) {
        if (uiState is CheckoutUiState.Success) {
            onOrderCreatedSuccess((uiState as CheckoutUiState.Success).response.id)
        }
    }

    Scaffold(
        topBar = {
            SmallTopAppBar(
                title = { Text("Confirmar Pedido", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Atrás")
                    }
                },
                colors = TopAppBarDefaults.smallTopAppBarColors(containerColor = Color.White)
            )
        },
        bottomBar = {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = Color.White,
                shadowElevation = 8.dp
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Subtotal", style = Typography.bodyMedium, color = TextMutedLight)
                        Text("S/. ${String.format("%.2f", cartSubtotal)}", fontWeight = FontWeight.Bold)
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Envío (Comunitario)", style = Typography.bodyMedium, color = TextMutedLight)
                        Text("S/. 3.50", fontWeight = FontWeight.Bold, color = Success)
                    }
                    Divider(modifier = Modifier.padding(vertical = 4.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Total", style = Typography.titleLarge, fontWeight = FontWeight.Black)
                        Text(
                            text = "S/. ${String.format("%.2f", cartSubtotal + 3.50)}",
                            style = Typography.titleLarge,
                            fontWeight = FontWeight.Black,
                            color = Primary
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Button(
                        onClick = {
                            viewModel.createOrder(
                                address = address,
                                reference = reference,
                                notes = notes,
                                paymentMethod = selectedPaymentMethod
                            )
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        shape = RoundedCornerShape(25.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Primary),
                        enabled = uiState !is CheckoutUiState.Loading && cartItems.isNotEmpty()
                    ) {
                        if (uiState is CheckoutUiState.Loading) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                        } else {
                            Text("Confirmar y Pedir", fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
                        }
                    }
                }
            }
        },
        modifier = modifier
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(BackgroundLight),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Cart Items Review Section
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Resumen del Pedido",
                            style = Typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )
                        cartItems.forEach { item ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 6.dp),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "${item.quantity}x ${item.name}",
                                    style = Typography.bodyMedium,
                                    modifier = Modifier.weight(1f)
                                )
                                Text(
                                    text = "S/. ${String.format("%.2f", item.price * item.quantity)}",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                            }
                        }
                    }
                }
            }

            // Geolocation and Map Integration Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(
                            text = "Ubicación Geográfica",
                            style = Typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )

                        // Map Mock Area
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(130.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .background(LoretoTacacho),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(Icons.Default.LocationOn, contentDescription = "Pin", color = Primary, modifier = Modifier.size(36.dp))
                                Text(
                                    text = "Mapa de Leaflet Integrado",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp
                                )
                                Text(
                                    text = "Lat: ${String.format("%.6f", latitude)} · Lng: ${String.format("%.6f", longitude)}",
                                    fontSize = 11.sp,
                                    color = TextMutedLight
                                )
                            }
                        }

                        // Get Location Button
                        Button(
                            onClick = {
                                // Simulador de GPS Nivel de Calle en Iquitos
                                viewModel.updateCoordinates(-3.74912, -73.25383)
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = Accent),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Text("Detectar mi GPS Actual", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Checkout Delivery Form Fields Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(
                            text = "Datos de Entrega",
                            style = Typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )

                        OutlinedTextField(
                            value = address,
                            onValueChange = { address = it },
                            label = { Text("Dirección de entrega") },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Primary,
                                cursorColor = Primary
                            )
                        )

                        OutlinedTextField(
                            value = reference,
                            onValueChange = { reference = it },
                            label = { Text("Referencia (casa, color, etc)") },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Primary,
                                cursorColor = Primary
                            )
                        )

                        OutlinedTextField(
                            value = notes,
                            onValueChange = { notes = it },
                            label = { Text("Notas o instrucciones adicionales") },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Primary,
                                cursorColor = Primary
                            )
                        )
                    }
                }
            }

            // Payment Methods Selector Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Método de Pago",
                            style = Typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(bottom = 12.dp)
                        )

                        val methods = listOf("Efectivo", "Yape", "Plin", "Tarjeta (Visa/MC)")
                        methods.forEachIndexed { index, name ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { selectedPaymentMethod = index }
                                    .padding(vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                RadioButton(
                                    selected = selectedPaymentMethod == index,
                                    onClick = { selectedPaymentMethod = index },
                                    colors = RadioButtonDefaults.colors(selectedColor = Primary)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(text = name, style = Typography.bodyMedium)
                            }
                        }
                    }
                }
            }

            // Loading / Error Notices
            if (uiState is CheckoutUiState.Error) {
                item {
                    Text(
                        text = (uiState as CheckoutUiState.Error).message,
                        color = Danger,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }
    }
}
