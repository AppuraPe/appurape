package com.appurape.app.features.admin.ui

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

data class PendingApproval(
    val id: String,
    val name: String,
    val type: String, // "Restaurante" o "Repartidor"
    val email: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminDashboardScreen(
    onLogoutClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val pendingApprovals = remember {
        listOf(
            PendingApproval("1", "Cocina de Juana", "Restaurante", "juana@cooking.com"),
            PendingApproval("2", "Pedro Armas", "Repartidor", "pedrito@gmail.com")
        )
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(BackgroundLight)
    ) {
        SmallTopAppBar(
            title = { Text("AppuraPe Admin", fontWeight = FontWeight.Black, color = Primary) },
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
                        Column(
                            modifier = Modifier.padding(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text("Total Clientes", fontSize = 11.sp, color = TextMutedLight)
                            Text("1,240", fontWeight = FontWeight.Black, fontSize = 20.sp, color = TextStrongLight)
                        }
                    }
                    Card(
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White)
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text("Drivers Activos", fontSize = 11.sp, color = TextMutedLight)
                            Text("45", fontWeight = FontWeight.Black, fontSize = 20.sp, color = Success)
                        }
                    }
                }
            }

            item {
                Text(
                    text = "Aprobaciones Pendientes",
                    style = Typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
            }

            items(pendingApprovals) { pending ->
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
                            Text(pending.name, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = if (pending.type == "Restaurante") LoretoCrema else LoretoTacacho
                            ) {
                                Text(
                                    text = pending.type,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                    color = if (pending.type == "Restaurante") Primary else TextStrongLight
                                )
                            }
                        }

                        Text("Email: ${pending.email}", fontSize = 13.sp, color = TextMutedLight)

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 8.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Button(
                                onClick = { /* MOCK: Aprobar */ },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = Success),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("Aprobar")
                            }
                            Button(
                                onClick = { /* MOCK: Rechazar */ },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = Danger),
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
