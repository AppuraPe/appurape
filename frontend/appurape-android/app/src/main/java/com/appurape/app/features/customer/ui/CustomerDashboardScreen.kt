package com.appurape.app.features.customer.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.appurape.app.core.theme.*
import com.appurape.app.features.customer.data.BusinessListItemResponse
import com.appurape.app.features.customer.data.BusinessTypeListItemResponse

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomerDashboardScreen(
    viewModel: CustomerDashboardViewModel,
    onNavigateToBusiness: (businessId: String) -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategoryId by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(BackgroundLight)
    ) {
        // App Header
        SmallTopAppBar(
            title = {
                Text(
                    text = "AppuraPe",
                    fontWeight = FontWeight.Black,
                    fontSize = 24.sp,
                    color = Primary
                )
            },
            colors = TopAppBarDefaults.smallTopAppBarColors(containerColor = Color.White)
        )

        // Search Bar Section
        OutlinedTextField(
            value = searchQuery,
            onValueChange = {
                searchQuery = it
                viewModel.loadFilteredBusinesses(it, null, selectedCategoryId, null, null)
            },
            placeholder = { Text("Buscar platos, restaurantes...") },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Buscar") },
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(20.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Primary,
                cursorColor = Primary
            )
        )

        when (val state = uiState) {
            is CustomerDashboardUiState.Loading -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Primary)
                }
            }
            is CustomerDashboardUiState.Error -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        text = state.message,
                        color = Danger,
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }
            is CustomerDashboardUiState.Success -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(bottom = 16.dp)
                ) {
                    // Category list (Horizontal Carousel)
                    state.mobileHome?.categories?.let { categories ->
                        item {
                            Text(
                                text = "Categorías Populares",
                                style = Typography.titleLarge,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                            )
                            LazyRow(
                                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                items(categories) { category ->
                                    CategoryChip(
                                        category = category,
                                        isSelected = category.id == selectedCategoryId,
                                        onClick = {
                                            selectedCategoryId = if (selectedCategoryId == category.id) null else category.id
                                            viewModel.loadFilteredBusinesses(searchQuery, null, selectedCategoryId, null, null)
                                        }
                                    )
                                }
                            }
                        }
                    }

                    // Section Heading
                    item {
                        Text(
                            text = "Todos los Negocios",
                            style = Typography.titleLarge,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 16.dp)
                        )
                    }

                    if (state.businesses.isEmpty()) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(32.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "No se encontraron negocios activos",
                                    color = TextMutedLight,
                                    fontSize = 14.sp
                                )
                            }
                        }
                    } else {
                        items(state.businesses) { business ->
                            BusinessCard(
                                business = business,
                                onClick = { onNavigateToBusiness(business.id) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CategoryChip(
    category: BusinessTypeListItemResponse,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(20.dp),
        color = if (isSelected) Primary else LoretoCrema,
        contentColor = if (isSelected) Color.White else TextStrongLight,
        modifier = Modifier.height(40.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = category.name,
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp
            )
        }
    }
}

@Composable
fun BusinessCard(
    business: BusinessListItemResponse,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column {
            // Business Logo
            AsyncImage(
                model = business.logoUrl ?: "/img/catalog-placeholder.svg",
                contentDescription = business.name,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(160.dp)
            )

            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = business.name,
                        style = Typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )

                    // Open now badge
                    val badgeColor = if (business.isOpenNow) Success else Warning
                    val badgeText = if (business.isOpenNow) "Abierto" else "Cerrado"
                    Surface(
                        shape = CircleShape,
                        color = badgeColor.copy(alpha = 0.15f),
                        contentColor = badgeColor
                    ) {
                        Text(
                            text = badgeText,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }

                Text(
                    text = business.description,
                    style = Typography.bodyMedium,
                    color = TextMutedLight,
                    maxLines = 2
                )

                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(top = 4.dp)
                ) {
                    Text(
                        text = business.zoneName,
                        fontSize = 12.sp,
                        color = Primary,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "·",
                        fontSize = 12.sp,
                        color = TextMutedLight
                    )
                    Text(
                        text = "${business.openTime} - ${business.closeTime}",
                        fontSize = 12.sp,
                        color = TextMutedLight
                    )
                }
            }
        }
    }
}
