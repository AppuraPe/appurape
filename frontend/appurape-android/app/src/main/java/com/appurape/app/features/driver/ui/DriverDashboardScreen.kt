package com.appurape.app.features.driver.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.appurape.app.core.theme.*

// Mock data class para representar las órdenes disponibles para repartidores
data class AvailableOrder(
    val id: String,
    val restaurantName: String,
    val zoneName: String,
    val deliveryAddress: String,
    val compensation: Double
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DriverDashboardScreen(
    onLogoutClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    // Lista simulada de pedidos disponibles
    val availableOrders = remember {
        listOf(
            AvailableOrder("101", "El Rinconcito Amazónico", "Maynas", "Calle Putumayo 450", 4.50),
            AvailableOrder("102", "Pizzería La Selva", "Belén", "Av. La Marina 122", 6.00),
            AvailableOrder("103", "Juguería Tarapoto", "San Juan", "Jr. Pebas 890", 3.80)
        )
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(BackgroundLight)
    ) {
        SmallTopAppBar(
            title = { Text("AppuraPe Driver", fontWeight = FontWeight.Black, color = Primary) },
            actions = {
                TextButton(onClick = onLogoutClick) {
                    Text("Salir", color = Primary, fontWeight = FontWeight.Bold)
                }
            },
            colors = TopAppBarDefaults.smallTopAppBarColors(containerColor = Color.White)
        )

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Stats banner
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceAround
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("Ganado Hoy", fontSize = 12.sp, color = TextMutedLight)
                            Text("S/. 24.50", fontWeight = FontWeight.Black, fontSize = 20.sp, color = Success)
                        }
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("Viajes", fontSize = 12.sp, color = TextMutedLight)
                            Text("5", fontWeight = FontWeight.Black, fontSize = 20.sp, color = TextStrongLight)
                        }
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("Estado", fontSize = 12.sp, color = TextMutedLight)
                            Text("Disponible", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Success)
                        }
                    }
                }
            }

            item {
                Text(
                    text = "Pedidos Disponibles",
                    style = Typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(vertical = 4.dp)
                )
            }

            items(availableOrders) { order ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(order.restaurantName, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            Text("S/. ${String.format("%.2f", order.compensation)}", fontWeight = FontWeight.Black, color = Primary, fontSize = 15.sp)
                        }

                        Text("Zona: ${order.zoneName}", fontSize = 13.sp, color = TextMutedLight)
                        Text("Destino: ${order.deliveryAddress}", fontSize = 13.sp, color = TextStrongLight)

                        Button(
                            onClick = { /* MOCK: Aceptar pedido */ },
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 8.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Primary),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Aceptar Pedido", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
