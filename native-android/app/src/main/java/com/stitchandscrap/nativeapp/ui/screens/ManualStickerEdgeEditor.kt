package com.stitchandscrap.nativeapp.ui.screens

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas as NativeCanvas
import android.graphics.Paint as NativePaint
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.Path as NativePath
import android.net.Uri
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import java.io.File
import java.util.UUID
import kotlin.math.*

@Composable
fun ManualStickerEdgeEditor(source: String, onDismiss: () -> Unit, onSave: (String) -> Unit) {
    val context = LocalContext.current
    val density = LocalDensity.current
    val cursorOffsetPx = with(density) { 54.dp.toPx() }
    val original = remember(source) {
        runCatching {
            val uri = Uri.parse(source)
            if (uri.scheme == "file") uri.path?.let { BitmapFactory.decodeFile(it) }
            else context.contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it) }
        }.getOrNull()
    }
    if (original == null) {
        AlertDialog(
            onDismissRequest = onDismiss,
            title = { Text("Can't open this image") },
            confirmButton = { TextButton(onClick = onDismiss) { Text("Close") } }
        )
        return
    }

    val edited = remember(source) { original.copy(Bitmap.Config.ARGB_8888, true) }
    val undo = remember(source) { mutableStateListOf<Bitmap>() }
    var erase by remember { mutableStateOf(true) }
    var brush by remember { mutableFloatStateOf(24f) }
    var snap by remember { mutableStateOf(true) }
    var snapStrength by remember { mutableFloatStateOf(18f) }
    var touch by remember { mutableStateOf<Offset?>(null) }
    var imageRect by remember { mutableStateOf(androidx.compose.ui.geometry.Rect.Zero) }
    var changed by remember { mutableIntStateOf(0) }

    fun saveUndo() {
        if (undo.size >= 12) undo.removeAt(0).recycle()
        undo.add(edited.copy(Bitmap.Config.ARGB_8888, true))
    }

    fun edgePoint(point: Offset): Offset {
        if (!snap) return point
        val radius = snapStrength.roundToInt().coerceIn(0, 60)
        val x0 = point.x.roundToInt().coerceIn(1, edited.width - 2)
        val y0 = point.y.roundToInt().coerceIn(1, edited.height - 2)
        var best = point
        var bestScore = -1.0
        for (dy in -radius..radius step 2) for (dx in -radius..radius step 2) {
            val x = (x0 + dx).coerceIn(1, edited.width - 2)
            val y = (y0 + dy).coerceIn(1, edited.height - 2)
            if (dx * dx + dy * dy > radius * radius) continue
            val score = colorDiff(original.getPixel(x - 1, y), original.getPixel(x + 1, y)) +
                colorDiff(original.getPixel(x, y - 1), original.getPixel(x, y + 1))
            if (score > bestScore) {
                bestScore = score
                best = Offset(x.toFloat(), y.toFloat())
            }
        }
        return if (bestScore > 35.0) best else point
    }

    fun paintAt(raw: Offset) {
        val p = edgePoint(raw)
        val canvas = NativeCanvas(edited)
        if (erase) {
            val clear = NativePaint(NativePaint.ANTI_ALIAS_FLAG).apply {
                style = NativePaint.Style.FILL
                xfermode = PorterDuffXfermode(PorterDuff.Mode.CLEAR)
            }
            canvas.drawCircle(p.x, p.y, brush / 2f, clear)
        } else {
            val restorePath = NativePath().apply {
                addCircle(p.x, p.y, brush / 2f, NativePath.Direction.CW)
            }
            canvas.save()
            canvas.clipPath(restorePath)
            canvas.drawBitmap(original, 0f, 0f, NativePaint(NativePaint.ANTI_ALIAS_FLAG))
            canvas.restore()
        }
        // This state is deliberately observed by the preview Canvas below.
        // Without it, mutating a Bitmap in place does not invalidate Compose's draw.
        changed++
    }

    fun toBitmapPoint(pos: Offset): Offset {
        val sx = edited.width / imageRect.width.coerceAtLeast(1f)
        val sy = edited.height / imageRect.height.coerceAtLeast(1f)
        return Offset(
            ((pos.x - imageRect.left) * sx).coerceIn(0f, edited.width.toFloat()),
            ((pos.y - imageRect.top) * sy).coerceIn(0f, edited.height.toFloat())
        )
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            usePlatformDefaultWidth = false,
            decorFitsSystemWindows = false
        )
    ) {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = Color(0xFF211D20)
        ) {
            Column(
                modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp, vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text("Sticker edge studio", style = MaterialTheme.typography.titleLarge,
                            color = Color.White, fontWeight = androidx.compose.ui.text.font.FontWeight.Bold)
                        Text("Every brush stroke updates this preview immediately",
                            style = MaterialTheme.typography.bodySmall, color = Color(0xFFD6C7D0))
                    }
                    TextButton(onClick = onDismiss) { Text("Cancel", color = Color(0xFFF9A8D4)) }
                    Button(onClick = {
                        val folder = File(context.filesDir, "sticker-library").apply { mkdirs() }
                        val file = File(folder, "manual-${UUID.randomUUID()}.png")
                        file.outputStream().use { edited.compress(Bitmap.CompressFormat.PNG, 100, it) }
                        onSave(Uri.fromFile(file).toString())
                    }) { Text("Save") }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = erase,
                        onClick = { erase = true },
                        label = { Text("Erase") }
                    )
                    FilterChip(
                        selected = !erase,
                        onClick = { erase = false },
                        label = { Text("Restore") }
                    )
                    Spacer(Modifier.weight(1f))
                    TextButton(
                        onClick = {
                            if (undo.isNotEmpty()) {
                                val previous = undo.removeAt(undo.lastIndex)
                                edited.eraseColor(android.graphics.Color.TRANSPARENT)
                                NativeCanvas(edited).drawBitmap(previous, 0f, 0f, null)
                                previous.recycle()
                                changed++
                            }
                        },
                        enabled = undo.isNotEmpty()
                    ) { Text("Undo", color = Color(0xFFF9A8D4)) }
                }

                // The checkerboard makes transparent pixels visibly transparent rather
                // than blending into the dialog's white/default surface.
                val previewRevision = changed
                Canvas(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .background(Color(0xFF383239), RoundedCornerShape(14.dp))
                        .pointerInput(source, brush, erase, snap, snapStrength) {
                            var previous: Offset? = null
                            fun point(p: Offset): Offset? =
                                if (imageRect.width <= 0f || !imageRect.contains(p)) null else toBitmapPoint(p)
                            fun brushPosition(finger: Offset) =
                                Offset(finger.x, finger.y - cursorOffsetPx)

                            detectDragGestures(
                                onDragStart = { p ->
                                    saveUndo()
                                    touch = p
                                    previous = point(brushPosition(p))
                                    previous?.let { paintAt(it) }
                                },
                                onDrag = { change, _ ->
                                    change.consume()
                                    touch = change.position
                                    val next = point(brushPosition(change.position))
                                    val from = previous
                                    if (next != null && from != null) {
                                        val distance = hypot(next.x - from.x, next.y - from.y)
                                        val steps = (distance / (brush / 5f).coerceAtLeast(1f))
                                            .roundToInt().coerceAtLeast(1)
                                        for (i in 1..steps) {
                                            paintAt(Offset(
                                                from.x + (next.x - from.x) * i / steps,
                                                from.y + (next.y - from.y) * i / steps
                                            ))
                                        }
                                    }
                                    previous = next
                                },
                                onDragEnd = { touch = null; previous = null },
                                onDragCancel = { touch = null; previous = null }
                            )
                        }
                ) {
                    // Read the revision in the draw scope so in-place Bitmap edits trigger
                    // a fresh draw instead of leaving the old image frozen on screen.
                    if (previewRevision >= 0) {
                        val tile = 18.dp.toPx()
                        var y = 0f
                        while (y < size.height) {
                            var x = 0f
                            while (x < size.width) {
                                val light = ((x / tile).toInt() + (y / tile).toInt()) % 2 == 0
                                drawRect(
                                    color = if (light) Color(0xFF514A53) else Color(0xFF39343B),
                                    topLeft = Offset(x, y),
                                    size = androidx.compose.ui.geometry.Size(tile, tile)
                                )
                                x += tile
                            }
                            y += tile
                        }
                        val fit = min(size.width / edited.width, size.height / edited.height)
                        val w = edited.width * fit
                        val h = edited.height * fit
                        val left = (size.width - w) / 2f
                        val top = (size.height - h) / 2f
                        imageRect = androidx.compose.ui.geometry.Rect(left, top, left + w, top + h)
                        drawImage(
                            edited.asImageBitmap(),
                            dstOffset = androidx.compose.ui.unit.IntOffset(left.roundToInt(), top.roundToInt()),
                            dstSize = androidx.compose.ui.unit.IntSize(w.roundToInt(), h.roundToInt())
                        )
                        touch?.let {
                            val preview = Offset(it.x, (it.y - cursorOffsetPx).coerceAtLeast(12.dp.toPx()))
                            drawCircle(
                                Color(0xFFFF4FA3),
                                radius = (brush * fit / 2f).coerceAtLeast(3f),
                                center = preview,
                                style = Stroke(width = 2.dp.toPx())
                            )
                            drawLine(Color(0xFFFF4FA3), Offset(it.x, preview.y + 8.dp.toPx()),
                                it, strokeWidth = 1.dp.toPx())
                        }
                    }
                }

                Column(
                    modifier = Modifier.fillMaxWidth().heightIn(max = 260.dp).verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text("Brush size: ${brush.roundToInt()} px", color = Color.White,
                        style = MaterialTheme.typography.labelMedium)
                    Slider(value = brush, onValueChange = { brush = it }, valueRange = 4f..100f)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("Snap to detected edges", color = Color.White, modifier = Modifier.weight(1f))
                        Switch(checked = snap, onCheckedChange = { snap = it })
                    }
                    if (snap) {
                        Text("Snap strength: ${snapStrength.roundToInt()} px",
                            color = Color(0xFFD6C7D0), style = MaterialTheme.typography.labelSmall)
                        Slider(value = snapStrength, onValueChange = { snapStrength = it }, valueRange = 0f..60f)
                    }
                    Text(
                        "Drag over the unwanted background to erase it. Switch to Restore to bring back original pixels. The original photo remains unchanged until you save.",
                        color = Color(0xFFD6C7D0), fontSize = 12.sp
                    )
                }
            }
        }
    }
}

private fun colorDiff(a: Int, b: Int): Double {
    val dr = android.graphics.Color.red(a) - android.graphics.Color.red(b)
    val dg = android.graphics.Color.green(a) - android.graphics.Color.green(b)
    val db = android.graphics.Color.blue(a) - android.graphics.Color.blue(b)
    return sqrt((dr * dr + dg * dg).toDouble())
}
