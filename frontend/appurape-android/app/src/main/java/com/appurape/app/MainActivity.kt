package com.appurape.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.appurape.app.core.theme.AppuraPeTheme
import com.appurape.app.features.auth.ui.AuthViewModel
import com.appurape.app.features.auth.ui.LoginScreen
import com.appurape.app.features.customer.ui.BusinessDetailScreen
import com.appurape.app.features.customer.ui.BusinessDetailViewModel
import com.appurape.app.features.customer.ui.CheckoutScreen
import com.appurape.app.features.customer.ui.CheckoutViewModel
import com.appurape.app.features.customer.ui.CustomerDashboardScreen
import com.appurape.app.features.customer.ui.CustomerDashboardViewModel
import com.appurape.app.features.driver.ui.DriverDashboardScreen
import com.appurape.app.features.restaurant.ui.RestaurantDashboardScreen
import com.appurape.app.features.admin.ui.AdminDashboardScreen
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AppuraPeTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppNavigation()
                }
            }
        }
    }
}

@Composable
fun AppNavigation() {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = "login") {

        composable("login") {
            val authViewModel: AuthViewModel = hiltViewModel()
            LoginScreen(
                viewModel = authViewModel,
                onLoginSuccess = { role ->
                    when (role) {
                        "Customer" -> navController.navigate("customer_dashboard") {
                            popUpTo("login") { inclusive = true }
                        }
                        "Driver" -> navController.navigate("driver_dashboard") {
                            popUpTo("login") { inclusive = true }
                        }
                        "Restaurant" -> navController.navigate("restaurant_dashboard") {
                            popUpTo("login") { inclusive = true }
                        }
                        "Admin" -> navController.navigate("admin_dashboard") {
                            popUpTo("login") { inclusive = true }
                        }
                        else -> navController.navigate("customer_dashboard") {
                            popUpTo("login") { inclusive = true }
                        }
                    }
                },
                onNavigateToRegister = {
                    // MOCK: Redirección a registro
                }
            )
        }

        composable("customer_dashboard") {
            val customerViewModel: CustomerDashboardViewModel = hiltViewModel()
            CustomerDashboardScreen(
                viewModel = customerViewModel,
                onNavigateToBusiness = { businessId ->
                    navController.navigate("business_detail/$businessId")
                }
            )
        }

        composable(
            route = "business_detail/{businessId}",
            arguments = listOf(navArgument("businessId") { type = NavType.StringType })
        ) { backStackEntry ->
            val businessId = backStackEntry.arguments?.getString("businessId") ?: ""
            val detailViewModel: BusinessDetailViewModel = hiltViewModel()
            BusinessDetailScreen(
                businessId = businessId,
                viewModel = detailViewModel,
                onBackClick = { navController.popBackStack() },
                onCheckoutClick = { navController.navigate("checkout") }
            )
        }

        composable("checkout") {
            val checkoutViewModel: CheckoutViewModel = hiltViewModel()
            CheckoutScreen(
                viewModel = checkoutViewModel,
                onBackClick = { navController.popBackStack() },
                onOrderCreatedSuccess = { orderId ->
                    // MOCK: Redirige a detalle de pedido o home tras éxito
                    navController.navigate("customer_dashboard") {
                        popUpTo("customer_dashboard") { inclusive = false }
                    }
                }
            )
        }

        composable("driver_dashboard") {
            DriverDashboardScreen(
                onLogoutClick = {
                    navController.navigate("login") {
                        popUpTo("driver_dashboard") { inclusive = true }
                    }
                }
            )
        }

        composable("restaurant_dashboard") {
            RestaurantDashboardScreen(
                onLogoutClick = {
                    navController.navigate("login") {
                        popUpTo("restaurant_dashboard") { inclusive = true }
                    }
                }
            )
        }

        composable("admin_dashboard") {
            AdminDashboardScreen(
                onLogoutClick = {
                    navController.navigate("login") {
                        popUpTo("admin_dashboard") { inclusive = true }
                    }
                }
            )
        }
    }
}
