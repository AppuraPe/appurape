package com.appurape.app.features.restaurant.ui

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

data class IncomingOrder(
    val id: String,
    val itemsSummary: String,
    val totalPrice: Double,
    val status: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RestaurantDashboardScreen(
    onLogoutClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val orders = remember {
        listOf(
            IncomingOrder("201", "2x Juanes, 1x Chicha Helada", 35.00, "Pendiente"),
            IncomingOrder("202", "1x Tacacho con Cecina Grande", 22.00, "En preparación")
        )
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(BackgroundLight)
    ) {
        SmallTopAppBar(
            title = { Text("AppuraPe Restaurante", fontWeight = FontWeight.Black, color = Primary) },
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
            // Stats Row
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Card(
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Pedidos Hoy", fontSize = 12.sp, color = TextMutedLight)
                            Text("18", fontWeight = FontWeight.Black, fontSize = 24.sp, color = TextStrongLight)
                        }
                    }
                    Card(
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Vendido Hoy", fontSize = 12.sp, color = TextMutedLight)
                            Text("S/. 392.00", fontWeight = FontWeight.Black, fontSize = 24.sp, color = Primary)
                        }
                    }
                }
            }

            item {
                Text(
                    text = "Órdenes Activas",
                    style = Typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
            }

            items(orders) { order ->
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
                            Text("Orden #${order.id}", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            Text(order.status, color = Primary, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }

                        Text(order.itemsSummary, style = Typography.bodyMedium, color = TextStrongLight)
                        Text("Monto Total: S/. ${String.format("%.2f", order.totalPrice)}", fontWeight = FontWeight.Bold, fontSize = 14.sp)

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 8.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Button(
                                onClick = { /* MOCK: Aceptar orden */ },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = Primary),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("Aceptar")
                            }
                            OutlinedButton(
                                onClick = { /* MOCK: Cancelar orden */ },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("Rechazar")
                            }
                        }
                    }
                }
            }
        }
    }
}
