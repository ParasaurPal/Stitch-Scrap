package com.stitchandscrap.nativeapp.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val PinkPrimary = Color(0xFFF472B6)
private val DarkBackground = Color(0xFF12141C)
private val DarkSurface = Color(0xFF1C1F2A)

private val DarkColors = darkColorScheme(
    primary = PinkPrimary,
    secondary = Color(0xFF38BDF8),
    tertiary = Color(0xFFF59E0B),
    background = DarkBackground,
    surface = DarkSurface,
)

private val LightColors = lightColorScheme(
    primary = PinkPrimary,
    secondary = Color(0xFF38BDF8),
    tertiary = Color(0xFFF59E0B),
)

@Composable
fun StitchAndScrapTheme(
    darkTheme: Boolean = true,
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        content = content,
    )
}
