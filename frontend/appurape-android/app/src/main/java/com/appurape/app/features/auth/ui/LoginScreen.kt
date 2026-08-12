package com.appurape.app.features.auth.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.appurape.app.core.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    viewModel: AuthViewModel,
    onLoginSuccess: (role: String) -> Unit,
    onNavigateToRegister: () -> Unit,
    modifier: Modifier = Modifier
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState) {
        if (uiState is AuthUiState.Success) {
            onLoginSuccess((uiState as AuthUiState.Success).response.role)
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(BackgroundLight, LoretoCrema)
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Eyebrow label
                Text(
                    text = "APPURAPE DELIVERY",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    color = Primary,
                    letterSpacing = 2.sp,
                    textAlign = TextAlign.Center
                )

                Text(
                    text = "Iniciar Sesión",
                    style = Typography.headlineMedium,
                    textAlign = TextAlign.Center
                )

                Text(
                    text = "Ingresa tus credenciales para explorar restaurantes y gestionar tus pedidos.",
                    style = Typography.bodyMedium,
                    color = TextMutedLight,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Email Input
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Correo electrónico") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Primary,
                        focusedLabelColor = Primary,
                        cursorColor = Primary
                    )
                )

                // Password Input
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Contraseña") },
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Primary,
                        focusedLabelColor = Primary,
                        cursorColor = Primary
                    )
                )

                Spacer(modifier = Modifier.height(4.dp))

                // Error Message Notice
                if (uiState is AuthUiState.Error) {
                    Text(
                        text = (uiState as AuthUiState.Error).message,
                        color = Danger,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                // Login Button
                Button(
                    onClick = { viewModel.login(email, password) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = RoundedCornerShape(25.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Primary),
                    enabled = uiState !is AuthUiState.Loading
                ) {
                    if (uiState is AuthUiState.Loading) {
                        CircularProgressIndicator(
                            color = Color.White,
                            modifier = Modifier.size(24.dp),
                            strokeWidth = 2.5.dp
                        )
                    } else {
                        Text(
                            text = "Iniciar Sesión",
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 15.sp
                        )
                    }
                }

                // Google Login Button
                OutlinedButton(
                    onClick = {
                        // Mock Google One Tap Sign-In token trigger
                        viewModel.loginWithGoogle("mock-google-id-token")
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = RoundedCornerShape(25.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = TextStrongLight),
                    enabled = uiState !is AuthUiState.Loading
                ) {
                    Text(
                        text = "Entrar con Google",
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }

                // Footer Links
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    TextButton(onClick = { /* MOCK: Forgot Password */ }) {
                        Text(
                            text = "¿Olvidaste tu contraseña?",
                            color = Primary,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    TextButton(onClick = onNavigateToRegister) {
                        Text(
                            text = "Registrarme",
                            color = Primary,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}
