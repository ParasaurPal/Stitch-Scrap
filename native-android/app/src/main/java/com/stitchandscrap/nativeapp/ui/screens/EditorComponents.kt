package com.stitchandscrap.nativeapp.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.ColorMatrix
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.stitchandscrap.nativeapp.data.DefaultContent
import com.stitchandscrap.nativeapp.data.model.*
import kotlin.math.roundToInt

private fun parseColor(hex: String?, fallback: Color = Color.White): Color =
    runCatching { if (hex.isNullOrBlank()) fallback else Color(android.graphics.Color.parseColor(hex)) }.getOrElse { fallback }

private fun borderStroke(pattern: String?, width: Int?, color: String?): BorderStroke? {
    val w = (width ?: 0).coerceIn(0, 48)
    if (w <= 0) return null
    val c = parseColor(color, Color.White)
    // Compose BorderStroke is solid; for dashed/dotted we layer with Canvas in StickerItem.
    return BorderStroke(w.dp, c)
}

private fun pathEffectFor(pattern: String?): PathEffect? = when (pattern) {
    "dashed" -> PathEffect.dashPathEffect(floatArrayOf(18f, 12f), 0f)
    "dotted" -> PathEffect.dashPathEffect(floatArrayOf(4f, 10f), 0f)
    else -> null
}

@Composable
fun BlogWidgetsSummary(metadata: BlogMetadata, onClick: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f))
            .clickable(onClick = onClick).padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        val mood = metadata.mood
        Text("${mood.emoji} ${mood.label}", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
        Spacer(Modifier.width(10.dp))
        val listening = metadata.currentlyListening
        if (listening.song.isNotBlank()) Text("🎧 ${listening.song}", fontSize = 12.sp, maxLines = 1)
        Spacer(Modifier.width(8.dp))
        val reading = metadata.currentlyReading
        if (reading.title.isNotBlank()) Text("📖 ${reading.title}", fontSize = 12.sp, maxLines = 1)
        Spacer(Modifier.weight(1f))
        Text("Edit", color = MaterialTheme.colorScheme.primary, fontSize = 12.sp)
    }
}

@Composable
fun PaperPattern(texture: String) {
    // Simple visual hint; full texture parity can be added with drawables/patterns.
    val tint = when (texture) {
        "night" -> Color.White.copy(alpha = 0.06f)
        "kraft", "vintage-torn-collage" -> Color(0xFF8B6B4A).copy(alpha = 0.08f)
        else -> Color(0xFFB8A89A).copy(alpha = 0.12f)
    }
    Canvas(Modifier.fillMaxSize()) {
        val step = 24.dp.toPx()
        var x = 0f
        while (x < size.width) {
            drawLine(tint, Offset(x, 0f), Offset(x, size.height), strokeWidth = 1f)
            x += step
        }
        var y = 0f
        while (y < size.height) {
            drawLine(tint, Offset(0f, y), Offset(size.width, y), strokeWidth = 1f)
            y += step
        }
    }
}

@Composable
fun StickerItem(
    sticker: PlacedSticker,
    selected: Boolean,
    canvasSize: IntSize,
    onSelect: () -> Unit,
    onMove: (dxPercent: Float, dyPercent: Float) -> Unit,
) {
    val density = LocalDensity.current
    val w = with(density) { (sticker.width * sticker.scale).dp }
    val h = with(density) { (sticker.height * sticker.scale).dp }
    val borderW = if (sticker.borderStyle == "none") 0 else (sticker.borderWidth ?: 0).coerceIn(0, 48)
    val borderColor = when (sticker.borderStyle) {
        "gold" -> Color(0xFFD6A83E)
        "neon" -> Color(0xFFFF4FCB)
        else -> parseColor(sticker.borderColor, Color.White)
    }
    val pattern = sticker.borderPattern ?: "solid"
    val pe = pathEffectFor(pattern)
    val filter = when (sticker.filter) {
        "monochrome" -> ColorFilter.colorMatrix(ColorMatrix().apply { setToSaturation(0f) })
        "sepia", "vintage" -> ColorFilter.colorMatrix(ColorMatrix(floatArrayOf(
            0.393f, 0.769f, 0.189f, 0f, 0f,
            0.349f, 0.686f, 0.168f, 0f, 0f,
            0.272f, 0.534f, 0.131f, 0f, 0f,
            0f, 0f, 0f, 1f, 0f
        )))
        "warm" -> ColorFilter.tint(Color(0x33F59E0B))
        "cyan" -> ColorFilter.tint(Color(0x3345D9E8))
        "polaroid" -> ColorFilter.colorMatrix(ColorMatrix().apply { setToSaturation(0.72f) })
        "highcontrast" -> ColorFilter.colorMatrix(ColorMatrix(floatArrayOf(
            1.25f, 0f, 0f, 0f, -0.1f,
            0f, 1.25f, 0f, 0f, -0.1f,
            0f, 0f, 1.25f, 0f, -0.1f,
            0f, 0f, 0f, 1f, 0f
        )))
        else -> null
    }

    Box(
        modifier = Modifier
            .offset {
                if (canvasSize.width == 0 || canvasSize.height == 0) IntOffset.Zero
                else IntOffset(
                    (sticker.x / 100f * canvasSize.width - with(density) { w.toPx() } / 2).roundToInt(),
                    (sticker.y / 100f * canvasSize.height - with(density) { h.toPx() } / 2).roundToInt(),
                )
            }
            .size(w, h)
            .rotate(sticker.rotation)
            .then(if (selected) Modifier.border(2.dp, MaterialTheme.colorScheme.primary, RoundedCornerShape(6.dp)) else Modifier)
            .pointerInput(sticker.id, canvasSize) {
                detectDragGestures(
                    onDragStart = { onSelect() },
                    onDrag = { change, dragAmount ->
                        change.consume()
                        if (canvasSize.width > 0 && canvasSize.height > 0) {
                            onMove(dragAmount.x / canvasSize.width * 100f, dragAmount.y / canvasSize.height * 100f)
                        }
                    }
                )
            }
            .clickable { onSelect() }
    ) {
        Box(
            Modifier.fillMaxSize().padding((borderW / 2).dp).let { m ->
                if (borderW > 0 && pe == null) m.border(borderW.dp, borderColor, RoundedCornerShape(8.dp))
                else m
            }.clip(RoundedCornerShape(8.dp)).background(Color.White.copy(alpha = 0.88f)),
            contentAlignment = Alignment.Center
        ) {
            if (sticker.src.startsWith("emoji:")) {
                Text(sticker.src.removePrefix("emoji:"), fontSize = 42.sp)
            } else {
                AsyncImage(
                    model = sticker.src,
                    contentDescription = sticker.alt,
                    modifier = Modifier.fillMaxSize().graphicsLayer { scaleX = if (sticker.isFlippedX) -1f else 1f },
                    contentScale = ContentScale.Fit,
                    colorFilter = filter,
                )
            }
            when (sticker.texture) {
                "glossy" -> Box(Modifier.fillMaxSize().background(
                    Brush.verticalGradient(listOf(Color.White.copy(alpha = 0.28f), Color.Transparent, Color.Transparent))))
                "holographic" -> Box(Modifier.fillMaxSize().background(
                    Brush.linearGradient(listOf(Color(0x44FF80AB), Color(0x4438BDF8), Color(0x44C084FC), Color(0x44FDE68A)))))
                "glitter" -> Box(Modifier.fillMaxSize().background(
                    Brush.radialGradient(listOf(Color.White.copy(alpha = 0.25f), Color.Transparent))))
                "acetate" -> Box(Modifier.fillMaxSize().background(Color.White.copy(alpha = 0.18f)))
                else -> Unit
            }
            if (!sticker.caption.isNullOrBlank()) {
                Box(Modifier.align(Alignment.BottomCenter).fillMaxWidth().background(Color.Black.copy(alpha = 0.48f)).padding(3.dp)) {
                    Text(sticker.caption, color = Color.White, fontSize = 9.sp, maxLines = 2,
                        textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
                }
            }
        }
        if (borderW > 0 && pe != null) {
            Canvas(Modifier.fillMaxSize()) {
                drawRoundRect(
                    color = borderColor,
                    topLeft = Offset(borderW.dp.toPx() / 2, borderW.dp.toPx() / 2),
                    size = Size(size.width - borderW.dp.toPx(), size.height - borderW.dp.toPx()),
                    cornerRadius = androidx.compose.ui.geometry.CornerRadius(8.dp.toPx()),
                    style = Stroke(width = borderW.dp.toPx(), pathEffect = pe)
                )
            }
        }
    }
}

@Composable
fun TapeItem(
    tape: PlacedTape,
    selected: Boolean,
    canvasSize: IntSize,
    onSelect: () -> Unit,
    onMove: (dxPercent: Float, dyPercent: Float) -> Unit,
) {
    val density = LocalDensity.current
    val w = with(density) { tape.width.dp }
    val h = with(density) { tape.height.dp }
    val bg = when (tape.pattern) {
        "stripes" -> Color(0xFFFDE68A)
        "dots" -> Color(0xFFFBCFE8)
        "kraft" -> Color(0xFFE7D3B0)
        "caution" -> Color(0xFFFACC15)
        "lavender" -> Color(0xFFDDD6FE)
        "frosted" -> Color.White.copy(alpha = 0.65f)
        "cyan" -> Color(0xFFA5F3FC)
        else -> Color(0xFFE9D5FF)
    }
    Box(
        modifier = Modifier
            .offset {
                if (canvasSize.width == 0 || canvasSize.height == 0) IntOffset.Zero
                else IntOffset(
                    (tape.x / 100f * canvasSize.width - with(density) { w.toPx() } / 2).roundToInt(),
                    (tape.y / 100f * canvasSize.height - with(density) { h.toPx() } / 2).roundToInt(),
                )
            }
            .size(w, h)
            .rotate(tape.rotation)
            .then(if (selected) Modifier.border(2.dp, MaterialTheme.colorScheme.primary, RoundedCornerShape(4.dp)) else Modifier)
            .clip(RoundedCornerShape(4.dp))
            .background(bg.copy(alpha = tape.opacity))
            .pointerInput(tape.id, canvasSize) {
                detectDragGestures(onDragStart = { onSelect() }) { change, dragAmount ->
                    change.consume()
                    if (canvasSize.width > 0 && canvasSize.height > 0) onMove(dragAmount.x / canvasSize.width * 100f, dragAmount.y / canvasSize.height * 100f)
                }
            }
            .clickable { onSelect() },
        contentAlignment = Alignment.Center
    ) {
        Canvas(Modifier.fillMaxSize()) {
            val ink = Color(0xFF6B4B5B).copy(alpha = 0.16f * tape.opacity)
            when (tape.pattern) {
                "dots" -> {
                    var y = 5.dp.toPx()
                    while (y < size.height) {
                        var x = 5.dp.toPx()
                        while (x < size.width) {
                            drawCircle(ink, radius = 1.7.dp.toPx(), center = Offset(x, y))
                            x += 10.dp.toPx()
                        }
                        y += 10.dp.toPx()
                    }
                }
                "stripes", "caution" -> {
                    var x = -size.height
                    while (x < size.width) {
                        drawLine(if (tape.pattern == "caution") Color.Black.copy(alpha = 0.16f) else ink,
                            Offset(x, size.height), Offset(x + size.height, 0f), strokeWidth = 5.dp.toPx())
                        x += 13.dp.toPx()
                    }
                }
                "grid" -> {
                    var x = 0f
                    while (x < size.width) {
                        drawLine(ink, Offset(x, 0f), Offset(x, size.height), strokeWidth = 1.dp.toPx())
                        x += 9.dp.toPx()
                    }
                    var y = 0f
                    while (y < size.height) {
                        drawLine(ink, Offset(0f, y), Offset(size.width, y), strokeWidth = 1.dp.toPx())
                        y += 9.dp.toPx()
                    }
                }
                "lavender" -> {
                    var x = 8.dp.toPx()
                    while (x < size.width) {
                        drawCircle(Color(0xFF9B7BC5).copy(alpha = 0.22f), 3.dp.toPx(), Offset(x, size.height / 2))
                        x += 17.dp.toPx()
                    }
                }
                "frosted" -> {
                    drawLine(Color.White.copy(alpha = 0.4f), Offset(0f, 3.dp.toPx()), Offset(size.width, 3.dp.toPx()), 2.dp.toPx())
                }
                "kraft" -> {
                    var x = 4.dp.toPx()
                    while (x < size.width) {
                        drawCircle(Color(0xFF795B3B).copy(alpha = 0.13f), 1.dp.toPx(), Offset(x, size.height * 0.35f))
                        drawCircle(Color(0xFF795B3B).copy(alpha = 0.1f), 1.dp.toPx(), Offset(x + 5.dp.toPx(), size.height * 0.72f))
                        x += 14.dp.toPx()
                    }
                }
            }
        }
        Text(tape.text, color = parseColor(tape.textColor, Color(0xFF3D2B1F)), fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold, maxLines = 1, textAlign = TextAlign.Center,
            fontFamily = when (tape.fontFamily) {
                "typewriter", "mono" -> FontFamily.Monospace
                "marker" -> FontFamily.SansSerif
                "doodle" -> FontFamily.Cursive
                else -> FontFamily.Cursive
            })
    }
}

@Composable
fun StickerPropertiesPanel(sticker: PlacedSticker, onChange: (PlacedSticker) -> Unit, onDelete: () -> Unit, onDuplicate: () -> Unit, onClose: () -> Unit) {
    var borderWidth by remember(sticker.id) { mutableIntStateOf((sticker.borderWidth ?: 4).coerceIn(0, 24)) }
    var borderColor by remember(sticker.id) { mutableStateOf(sticker.borderColor ?: "#ffffff") }
    var borderPattern by remember(sticker.id) { mutableStateOf(sticker.borderPattern ?: "solid") }
    var caption by remember(sticker.id) { mutableStateOf(sticker.caption.orEmpty()) }
    fun applyBorder() = onChange(sticker.copy(borderWidth = borderWidth, borderColor = borderColor, borderPattern = borderPattern))
    Surface(tonalElevation = 2.dp, shadowElevation = 4.dp) {
        Column(Modifier.fillMaxWidth().padding(12.dp).verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Sticker: ${sticker.alt}", fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f), maxLines = 1)
                TextButton(onClick = onDuplicate) { Text("Duplicate") }
                TextButton(onClick = onDelete) { Text("Delete", color = MaterialTheme.colorScheme.error) }
                TextButton(onClick = onClose) { Text("Done") }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                OutlinedButton(onClick = { onChange(sticker.copy(rotation = sticker.rotation - 15f)) }) { Text("↺ Rotate") }
                OutlinedButton(onClick = { onChange(sticker.copy(rotation = sticker.rotation + 15f)) }) { Text("Rotate ↻") }
                OutlinedButton(onClick = { onChange(sticker.copy(scale = (sticker.scale - 0.1f).coerceAtLeast(0.3f))) }) { Text("− Size") }
                OutlinedButton(onClick = { onChange(sticker.copy(scale = (sticker.scale + 0.1f).coerceAtMost(3f))) }) { Text("+ Size") }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = { onChange(sticker.copy(isFlippedX = !sticker.isFlippedX)) }) {
                    Text(if (sticker.isFlippedX) "Unflip" else "Flip horizontal")
                }
                OutlinedButton(onClick = { onChange(sticker.copy(zIndex = sticker.zIndex + 1)) }) { Text("Bring forward ↑") }
                OutlinedButton(onClick = { onChange(sticker.copy(zIndex = (sticker.zIndex - 1).coerceAtLeast(0))) }) { Text("Send back ↓") }
            }

            Text("Photo filter", style = MaterialTheme.typography.labelLarge)
            Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                listOf("none", "vintage", "sepia", "monochrome", "warm", "cyan", "polaroid", "highcontrast").forEach { option ->
                    FilterChip(selected = sticker.filter == option, onClick = { onChange(sticker.copy(filter = option)) },
                        label = { Text(option.replaceFirstChar { it.uppercase() }) })
                }
            }
            Text("Surface finish", style = MaterialTheme.typography.labelLarge)
            Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                listOf("none", "glossy", "holographic", "matte", "crinkled", "glitter", "acetate").forEach { option ->
                    FilterChip(selected = sticker.texture == option, onClick = { onChange(sticker.copy(texture = option)) },
                        label = { Text(option.replaceFirstChar { it.uppercase() }) })
                }
            }
            Text("Sticker edge", style = MaterialTheme.typography.labelLarge)
            Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                listOf("diecut", "polaroid", "stamp", "gold", "neon", "none").forEach { option ->
                    FilterChip(selected = sticker.borderStyle == option, onClick = { onChange(sticker.copy(borderStyle = option)) },
                        label = { Text(option.replaceFirstChar { it.uppercase() }) })
                }
            }
            Text("Border thickness: ${borderWidth}px", style = MaterialTheme.typography.labelMedium)
            Slider(value = borderWidth.toFloat(), onValueChange = { borderWidth = it.roundToInt(); applyBorder() },
                valueRange = 0f..24f, steps = 23)
            Text("Border pattern", style = MaterialTheme.typography.labelMedium)
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                listOf("solid", "dashed", "dotted", "double").forEach { p ->
                    FilterChip(selected = borderPattern == p, onClick = { borderPattern = p; applyBorder() }, label = { Text(p) })
                }
            }
            Text("Border color", style = MaterialTheme.typography.labelMedium)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                listOf("#ffffff", "#111827", "#f472b6", "#38bdf8", "#f59e0b", "#a78bfa").forEach { hex ->
                    Box(Modifier.size(30.dp).clip(RoundedCornerShape(8.dp)).background(parseColor(hex))
                        .border(if (borderColor.equals(hex, true)) 3.dp else 1.dp,
                            if (borderColor.equals(hex, true)) MaterialTheme.colorScheme.primary else Color.Gray,
                            RoundedCornerShape(8.dp))
                        .clickable { borderColor = hex; applyBorder() })
                }
            }
            OutlinedTextField(value = caption, onValueChange = { caption = it; onChange(sticker.copy(caption = it)) },
                label = { Text("Sticker caption (optional)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        }
    }
}

@Composable
fun TapePropertiesPanel(tape: PlacedTape, onChange: (PlacedTape) -> Unit, onDelete: () -> Unit, onClose: () -> Unit) {
    var text by remember(tape.id) { mutableStateOf(tape.text) }
    Surface(tonalElevation = 2.dp, shadowElevation = 4.dp) {
        Column(Modifier.fillMaxWidth().padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Washi Tape", fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                TextButton(onClick = onDelete) { Text("Delete", color = MaterialTheme.colorScheme.error) }
                TextButton(onClick = onClose) { Text("Close") }
            }
            OutlinedTextField(value = text, onValueChange = { text = it; onChange(tape.copy(text = it)) }, label = { Text("Tape text") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = { onChange(tape.copy(rotation = tape.rotation - 10f)) }) { Text("↺ Rotate") }
                OutlinedButton(onClick = { onChange(tape.copy(rotation = tape.rotation + 10f)) }) { Text("Rotate ↻") }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddStickerSheet(onDismiss: () -> Unit, onPickImage: () -> Unit, savedPhotos: List<String>, onAddSavedPhoto: (String) -> Unit, onAddEmoji: (emoji: String, label: String) -> Unit) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var query by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("All") }
    val stock = listOf(
        Triple("Nature", "🌸", "Cherry blossom"), Triple("Nature", "🌷", "Tulip"),
        Triple("Nature", "🌻", "Sunflower"), Triple("Nature", "🌿", "Leaf"),
        Triple("Nature", "🍄", "Mushroom"), Triple("Nature", "🦋", "Butterfly"),
        Triple("Nature", "🐝", "Bumblebee"), Triple("Nature", "🐞", "Ladybug"),
        Triple("Nature", "🌙", "Moon"), Triple("Nature", "⭐", "Star"),
        Triple("Nature", "☁️", "Cloud"), Triple("Nature", "🌈", "Rainbow"),
        Triple("Cozy", "☕", "Coffee"), Triple("Cozy", "🧸", "Teddy bear"),
        Triple("Cozy", "🕯️", "Candle"), Triple("Cozy", "🧶", "Yarn"),
        Triple("Cozy", "🧦", "Cozy socks"), Triple("Cozy", "🛋️", "Sofa"),
        Triple("Cozy", "📖", "Open book"), Triple("Cozy", "🫖", "Teapot"),
        Triple("Food", "🍓", "Strawberry"), Triple("Food", "🍒", "Cherries"),
        Triple("Food", "🍋", "Lemon"), Triple("Food", "🍰", "Cake"),
        Triple("Food", "🍪", "Cookie"), Triple("Food", "🍯", "Honey"),
        Triple("Food", "🥐", "Croissant"), Triple("Food", "🍵", "Tea"),
        Triple("Music", "🎧", "Headphones"), Triple("Music", "📼", "Cassette"),
        Triple("Music", "🎵", "Music note"), Triple("Music", "🎸", "Guitar"),
        Triple("Music", "💿", "CD"), Triple("Music", "🎤", "Microphone"),
        Triple("Travel", "✈️", "Airplane"), Triple("Travel", "🗺️", "Map"),
        Triple("Travel", "🧳", "Suitcase"), Triple("Travel", "📷", "Camera"),
        Triple("Travel", "🎟️", "Ticket"), Triple("Travel", "🚂", "Train"),
        Triple("Travel", "🏕️", "Camping"), Triple("Travel", "🌊", "Ocean"),
        Triple("Decor", "💖", "Heart"), Triple("Decor", "✨", "Sparkles"),
        Triple("Decor", "🎀", "Bow"), Triple("Decor", "🪞", "Mirror"),
        Triple("Decor", "💌", "Love letter"), Triple("Decor", "🧷", "Safety pin"),
        Triple("Decor", "✂️", "Scissors"), Triple("Decor", "🪡", "Needle"),
    )
    val categories = listOf("All", "Nature", "Cozy", "Food", "Music", "Travel", "Decor")
    val visible = stock.filter { (group, emoji, label) ->
        (category == "All" || category == group) &&
            (query.isBlank() || label.contains(query, true) || emoji.contains(query))
    }

    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState) {
        Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("Sticker collection", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text("Choose a decoration or add one of your own photos.", style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
            Button(onClick = onPickImage, modifier = Modifier.fillMaxWidth()) { Text("＋  Add photo from device") }
            if (savedPhotos.isNotEmpty()) {
                Text("My saved photo stickers", style = MaterialTheme.typography.labelLarge)
                androidx.compose.foundation.lazy.grid.LazyVerticalGrid(
                    columns = androidx.compose.foundation.lazy.grid.GridCells.Fixed(4),
                    modifier = Modifier.fillMaxWidth().heightIn(max = 150.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    items(savedPhotos.size) { index ->
                        val photo = savedPhotos[index]
                        Surface(onClick = { onAddSavedPhoto(photo) }, shape = RoundedCornerShape(12.dp), tonalElevation = 2.dp) {
                            AsyncImage(model = photo, contentDescription = "Saved photo sticker",
                                modifier = Modifier.fillMaxWidth().aspectRatio(1f), contentScale = ContentScale.Crop)
                        }
                    }
                }
            }
            OutlinedTextField(value = query, onValueChange = { query = it },
                label = { Text("Search stickers") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                categories.forEach { item ->
                    FilterChip(selected = category == item, onClick = { category = item }, label = { Text(item) })
                }
            }
            androidx.compose.foundation.lazy.grid.LazyVerticalGrid(
                columns = androidx.compose.foundation.lazy.grid.GridCells.Fixed(4),
                modifier = Modifier.fillMaxWidth().heightIn(max = 360.dp),
                contentPadding = PaddingValues(bottom = 18.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                items(visible.size) { index ->
                    val (_, emoji, label) = visible[index]
                    Surface(onClick = { onAddEmoji(emoji, label) },
                        shape = RoundedCornerShape(14.dp), tonalElevation = 2.dp,
                        modifier = Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(vertical = 10.dp, horizontal = 3.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(3.dp)) {
                            Text(emoji, fontSize = 28.sp)
                            Text(label, fontSize = 9.sp, maxLines = 1)
                        }
                    }
                }
            }
            Text("New stickers start with a white die-cut border. Select one on the page to adjust its size, angle, and border.",
                style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(Modifier.height(10.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddTapeSheet(
    onDismiss: () -> Unit,
    onAdd: (pattern: String, text: String, textColor: String, fontFamily: String) -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var text by remember { mutableStateOf("★ FAVORITE MEMORY ★") }
    var pattern by remember { mutableStateOf("grid") }
    var textColor by remember { mutableStateOf("#BE185D") }
    var fontFamily by remember { mutableStateOf("marker") }
    val colors = listOf("#BE185D", "#854D0E", "#065F46", "#334155", "#581C87", "#0E7490", "#292524")
    val phrases = listOf("★ FAVORITE MEMORY ★", "TOP SECRET", "CHAPTER ONE", "COZY VIBES", "LOVE THIS", "GOOD DAYS")
    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState) {
        Column(Modifier.fillMaxWidth().padding(16.dp).verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("Washi tape studio", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text("Choose a pattern, add a phrase, and style your tape.", style = MaterialTheme.typography.bodySmall)
            Surface(shape = RoundedCornerShape(8.dp), color = when (pattern) {
                "dots" -> Color(0xFFFBCFE8)
                "stripes", "caution" -> Color(0xFFFDE68A)
                "kraft" -> Color(0xFFE7D3B0)
                "lavender" -> Color(0xFFDDD6FE)
                "cyan" -> Color(0xFFA5F3FC)
                "frosted" -> Color(0xFFE8EDF2)
                else -> Color(0xFFE9D5FF)
            }) {
                Box(Modifier.fillMaxWidth().height(48.dp), contentAlignment = Alignment.Center) {
                    Text(text.ifBlank { "Your tape preview" }, color = parseColor(textColor, Color(0xFFBE185D)),
                        fontWeight = FontWeight.Bold, fontSize = 14.sp, maxLines = 1)
                }
            }
            OutlinedTextField(value = text, onValueChange = { text = it }, label = { Text("Tape text") },
                modifier = Modifier.fillMaxWidth(), singleLine = true)
            Text("Quick phrases", style = MaterialTheme.typography.labelLarge)
            Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                phrases.forEach { phrase -> AssistChip(onClick = { text = phrase }, label = { Text(phrase) }) }
            }
            Text("Pattern", style = MaterialTheme.typography.labelLarge)
            Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                listOf("grid", "dots", "stripes", "kraft", "caution", "lavender", "frosted", "cyan").forEach { p ->
                    FilterChip(selected = pattern == p, onClick = { pattern = p }, label = { Text(p) })
                }
            }
            Text("Ink color", style = MaterialTheme.typography.labelLarge)
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                colors.forEach { hex ->
                    Box(Modifier.size(30.dp).clip(CircleShape).background(parseColor(hex))
                        .border(if (textColor == hex) 3.dp else 1.dp,
                            if (textColor == hex) MaterialTheme.colorScheme.primary else Color.Gray, CircleShape)
                        .clickable { textColor = hex })
                }
            }
            Text("Lettering", style = MaterialTheme.typography.labelLarge)
            Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                listOf("handwriting", "marker", "typewriter", "mono", "doodle").forEach { font ->
                    FilterChip(selected = fontFamily == font, onClick = { fontFamily = font }, label = { Text(font) })
                }
            }
            Button(onClick = { onAdd(pattern, text, textColor, fontFamily) }, modifier = Modifier.fillMaxWidth()) {
                Text("Add washi tape to page")
            }
            Spacer(Modifier.height(16.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MoodBlogSheet(metadata: BlogMetadata, onDismiss: () -> Unit, onSave: (BlogMetadata) -> Unit) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var moodId by remember { mutableStateOf(metadata.mood.id.ifBlank { "inspired" }) }
    var listeningSong by remember { mutableStateOf(metadata.currentlyListening.song) }
    var listeningArtist by remember { mutableStateOf(metadata.currentlyListening.artist) }
    var readingTitle by remember { mutableStateOf(metadata.currentlyReading.title) }
    var readingAuthor by remember { mutableStateOf(metadata.currentlyReading.author) }
    var watching by remember { mutableStateOf(metadata.currentlyWatching ?: "") }
    var location by remember { mutableStateOf(metadata.location ?: "") }
    val presets = DefaultContent.moodPresets()

    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState) {
        Column(Modifier.fillMaxWidth().padding(16.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("Mood & Blog Widgets", style = MaterialTheme.typography.titleLarge)
            Text("Mood", style = MaterialTheme.typography.labelLarge)
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                presets.forEach { m ->
                    FilterChip(selected = moodId == m.id, onClick = { moodId = m.id }, label = { Text("${m.emoji} ${m.label}") })
                }
            }
            OutlinedTextField(listeningSong, { listeningSong = it }, label = { Text("Listening: song") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
            OutlinedTextField(listeningArtist, { listeningArtist = it }, label = { Text("Listening: artist") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
            OutlinedTextField(readingTitle, { readingTitle = it }, label = { Text("Reading: title") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
            OutlinedTextField(readingAuthor, { readingAuthor = it }, label = { Text("Reading: author") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
            OutlinedTextField(watching, { watching = it }, label = { Text("Watching") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
            OutlinedTextField(location, { location = it }, label = { Text("Location") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
            Button(onClick = {
                val mood = presets.find { it.id == moodId } ?: metadata.mood
                onSave(metadata.copy(
                    mood = mood,
                    currentlyListening = CurrentlyListening(listeningSong, listeningArtist),
                    currentlyReading = CurrentlyReading(readingTitle, readingAuthor, metadata.currentlyReading.progress),
                    currentlyWatching = watching.ifBlank { null },
                    location = location.ifBlank { null },
                ))
            }, modifier = Modifier.fillMaxWidth()) { Text("Save") }
            Spacer(Modifier.height(20.dp))
        }
    }
}
