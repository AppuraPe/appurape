package com.appurape.app.core.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColorScheme = lightColorScheme(
    primary = Primary,
    onPrimary = Color.White,
    secondary = Accent,
    onSecondary = Color.White,
    background = BackgroundLight,
    onBackground = TextStrongLight,
    surface = SurfaceLight,
    onSurface = TextStrongLight,
    error = Danger,
    onError = Color.White
)

@Composable
fun AppuraPeTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    // AppuraPe tiene una sola identidad visual (claridad y luz de Iquitos),
    // por lo que mantenemos el LightColorScheme consistente.
    val colorScheme = LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
