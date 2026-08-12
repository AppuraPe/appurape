package com.appurape.app.features.customer.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.appurape.app.core.theme.*
import com.appurape.app.features.customer.data.MenuItemResponse
import com.appurape.app.features.customer.data.PublicMenuCategoryResponse

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BusinessDetailScreen(
    businessId: String,
    viewModel: BusinessDetailViewModel,
    onBackClick: () -> Unit,
    onCheckoutClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val totalCartCount by viewModel.totalCartCount.collectAsState()
    val cartSubtotal by viewModel.cartSubtotal.collectAsState()
    var selectedCategoryId by remember { mutableStateOf<String>("all") }

    LaunchedEffect(businessId) {
        viewModel.loadBusinessDetails(businessId)
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(BackgroundLight)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Header Top Bar
            SmallTopAppBar(
                title = {
                    Text(
                        text = when (val state = uiState) {
                            is BusinessDetailUiState.Success -> state.business.name
                            else -> "Cargando..."
                        },
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Atrás")
                    }
                },
                colors = TopAppBarDefaults.smallTopAppBarColors(containerColor = Color.White)
            )

            when (val state = uiState) {
                is BusinessDetailUiState.Loading -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Primary)
                    }
                }
                is BusinessDetailUiState.Error -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(
                            text = state.message,
                            color = Danger,
                            modifier = Modifier.padding(16.dp)
                        )
                    }
                }
                is BusinessDetailUiState.Success -> {
                    val business = state.business
                    val categories = state.catalog.categories

                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(bottom = 80.dp) // Espacio para el carrito flotante
                    ) {
                        // Business Header Info
                        item {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color.White)
                                    .padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                AsyncImage(
                                    model = business.logoUrl ?: "/img/catalog-placeholder.svg",
                                    contentDescription = business.name,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(140.dp)
                                        .clip(RoundedCornerShape(16.dp))
                                )
                                Text(
                                    text = business.name,
                                    style = Typography.displayLarge,
                                    fontSize = 24.sp
                                )
                                Text(
                                    text = business.description,
                                    style = Typography.bodyMedium,
                                    color = TextMutedLight
                                )
                                Text(
                                    text = "Horario: ${business.openTime} - ${business.closeTime} · ${business.zoneName}",
                                    fontSize = 12.sp,
                                    color = Primary,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        // Categories navigation selector
                        item {
                            LazyRow(
                                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                item {
                                    FilterChip(
                                        selected = selectedCategoryId == "all",
                                        onClick = { selectedCategoryId = "all" },
                                        label = { Text("Todo el menú") }
                                    )
                                }
                                items(categories) { category ->
                                    FilterChip(
                                        selected = selectedCategoryId == category.id,
                                        onClick = { selectedCategoryId = category.id },
                                        label = { Text(category.name) }
                                    )
                                }
                            }
                        }

                        // Filter and render items
                        val filteredCategories = if (selectedCategoryId == "all") {
                            categories
                        } else {
                            categories.filter { it.id == selectedCategoryId }
                        }

                        if (filteredCategories.isEmpty() || filteredCategories.flatMap { it.items }.isEmpty()) {
                            item {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(32.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("Este negocio no tiene productos en esta categoría.", color = TextMutedLight)
                                }
                            }
                        } else {
                            filteredCategories.forEach { category ->
                                item {
                                    Text(
                                        text = category.name,
                                        style = Typography.titleLarge,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                                    )
                                }

                                items(category.items) { item ->
                                    MenuItemRow(
                                        item = item,
                                        onAddClick = {
                                            viewModel.addItemToCart(business.id, business.name, item)
                                        }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Float Cart Action Bar
        if (totalCartCount > 0) {
            Surface(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .padding(16.dp),
                shape = RoundedCornerShape(28.dp),
                color = Primary,
                contentColor = Color.White,
                shadowElevation = 8.dp
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable(onClick = onCheckoutClick)
                        .padding(horizontal = 20.dp, vertical = 14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.ShoppingCart, contentDescription = "Carrito")
                        Text(
                            text = "$totalCartCount plato(s)",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp
                        )
                    }
                    Text(
                        text = "Ver pedido (S/. ${String.format("%.2f", cartSubtotal)})",
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 15.sp
                    )
                }
            }
        }
    }
}

@Composable
fun MenuItemRow(
    item: MenuItemResponse,
    onAddClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(end = 8.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = item.name,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = TextStrongLight
                )
                Text(
                    text = item.description,
                    fontSize = 12.sp,
                    color = TextMutedLight,
                    maxLines = 2
                )
                Text(
                    text = "S/. ${String.format("%.2f", item.price)}",
                    fontWeight = FontWeight.Black,
                    fontSize = 14.sp,
                    color = Primary
                )
            }

            Box(
                modifier = Modifier.size(80.dp)
            ) {
                AsyncImage(
                    model = item.imageUrl ?: "/img/catalog-placeholder.svg",
                    contentDescription = item.name,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(RoundedCornerShape(12.dp))
                )

                if (item.isAvailable) {
                    Button(
                        onClick = onAddClick,
                        shape = CircleShape,
                        colors = ButtonDefaults.buttonColors(containerColor = Primary),
                        contentPadding = PaddingValues(0.dp),
                        modifier = Modifier
                            .align(Alignment.BottomEnd)
                            .size(32.dp)
                            .offset(x = 4.dp, y = 4.dp)
                    ) {
                        Text("+", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    }
                }
            }
        }
    }
}
