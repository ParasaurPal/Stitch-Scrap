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
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.Alignment
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.drawscope.scale
import java.io.File
import java.util.UUID
import kotlin.math.*

@Composable
fun ManualStickerEdgeEditor(source: String, onDismiss: () -> Unit, onSave: (String) -> Unit) {
    val context = LocalContext.current
    val cursorOffsetPx = with(LocalDensity.current) { 54.dp.toPx() }
    val original = remember(source) {
        runCatching {
            val uri = Uri.parse(source)
            if (uri.scheme == "file") uri.path?.let { BitmapFactory.decodeFile(it) }
            else context.contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it) }
        }.getOrNull()
    }
    if (original == null) {
        AlertDialog(onDismissRequest = onDismiss, title = { Text("Can't open this image") },
            confirmButton = { TextButton(onClick = onDismiss) { Text("Close") } })
        return
    }
    val edited = remember(source) { original.copy(Bitmap.Config.ARGB_8888, true) }
    val undo = remember(source) { mutableStateListOf<Bitmap>() }
    var erase by remember { mutableStateOf(true) }
    var brush by remember { mutableFloatStateOf(24f) }
    var snap by remember { mutableStateOf(true) }
    var snapStrength by remember { mutableFloatStateOf(18f) }
    var touch by remember { mutableStateOf<Offset?>(null) }
    var canvasSize by remember { mutableStateOf(androidx.compose.ui.geometry.Size.Zero) }
    var imageRect by remember { mutableStateOf(androidx.compose.ui.geometry.Rect.Zero) }
    var changed by remember { mutableIntStateOf(0) }

    fun saveUndo() {
        if (undo.size >= 12) { undo.removeAt(0).recycle() }
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
            val a = original.getPixel(x - 1, y)
            val b = original.getPixel(x + 1, y)
            val c = original.getPixel(x, y - 1)
            val d = original.getPixel(x, y + 1)
            val score = colorDiff(a, b) + colorDiff(c, d)
            if (score > bestScore) { bestScore = score; best = Offset(x.toFloat(), y.toFloat()) }
        }
        return if (bestScore > 35.0) best else point
    }
    fun paintAt(raw: Offset) {
        val p = edgePoint(raw)
        val paint = NativePaint(NativePaint.ANTI_ALIAS_FLAG).apply {
            style = NativePaint.Style.STROKE
            strokeWidth = brush
            strokeCap = NativePaint.Cap.ROUND
            strokeJoin = NativePaint.Join.ROUND
            xfermode = if (erase) PorterDuffXfermode(PorterDuff.Mode.CLEAR) else null
        }
        val c = NativeCanvas(edited)
        val mask = NativePaint(NativePaint.ANTI_ALIAS_FLAG).apply {
            style = NativePaint.Style.FILL
            if (erase) xfermode = PorterDuffXfermode(PorterDuff.Mode.CLEAR)
        }
        val path = NativePath().apply { addCircle(p.x, p.y, brush / 2f, NativePath.Direction.CW) }
        if (erase) c.drawPath(path, mask) else {
            c.save()
            c.clipPath(path)
            c.drawBitmap(original, 0f, 0f, NativePaint(NativePaint.ANTI_ALIAS_FLAG))
            c.restore()
        }
        changed++
    }
    fun toBitmapPoint(pos: Offset): Offset {
        val sx = edited.width / imageRect.width.coerceAtLeast(1f)
        val sy = edited.height / imageRect.height.coerceAtLeast(1f)
        return Offset(((pos.x - imageRect.left) * sx).coerceIn(0f, edited.width.toFloat()),
            ((pos.y - imageRect.top) * sy).coerceIn(0f, edited.height.toFloat()))
    }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Refine sticker edges") },
        text = {
            Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Erase removes pixels; Restore brings back the original photo. The original stays untouched until Save.")
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(selected = erase, onClick = { erase = true }, label = { Text("Erase") })
                    FilterChip(selected = !erase, onClick = { erase = false }, label = { Text("Restore") })
                    TextButton(onClick = { if (undo.isNotEmpty()) { val previous = undo.removeAt(undo.lastIndex); edited.eraseColor(android.graphics.Color.TRANSPARENT); NativeCanvas(edited).drawBitmap(previous, 0f, 0f, null); previous.recycle(); changed++ } }, enabled = undo.isNotEmpty()) { Text("Undo") }
                }
                Text("Brush size: ${brush.roundToInt()} px", style = MaterialTheme.typography.labelMedium)
                Slider(value = brush, onValueChange = { brush = it }, valueRange = 4f..100f)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Snap to edges", modifier = Modifier.weight(1f))
                    Switch(checked = snap, onCheckedChange = { snap = it })
                }
                if (snap) {
                    Text("Snap strength: ${snapStrength.roundToInt()} px", style = MaterialTheme.typography.labelSmall)
                    Slider(value = snapStrength, onValueChange = { snapStrength = it }, valueRange = 0f..60f)
                }
                Text("The cursor preview sits above your finger for a clearer view.", fontSize = 12.sp)
                Canvas(Modifier.fillMaxWidth().height(330.dp).pointerInput(source, brush, erase, snap, snapStrength) {
                    var previous: Offset? = null
                    fun point(p: Offset): Offset? = if (imageRect.width <= 0f || !imageRect.contains(p)) null else toBitmapPoint(p)
                    // The brush follows the raised preview, not the finger's contact point.
                    fun brushPosition(finger: Offset) = Offset(finger.x, finger.y - cursorOffsetPx)
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
                                val steps = (distance / (brush / 5f).coerceAtLeast(1f)).roundToInt().coerceAtLeast(1)
                                for (i in 1..steps) paintAt(Offset(from.x + (next.x - from.x) * i / steps, from.y + (next.y - from.y) * i / steps))
                            }
                            previous = next
                        },
                        onDragEnd = { touch = null; previous = null },
                        onDragCancel = { touch = null; previous = null }
                    )
                }) {
                    canvasSize = size
                    val fit = min(size.width / edited.width, size.height / edited.height)
                    val w = edited.width * fit
                    val h = edited.height * fit
                    val left = (size.width - w) / 2f
                    val top = (size.height - h) / 2f
                    imageRect = androidx.compose.ui.geometry.Rect(left, top, left + w, top + h)
                    drawImage(edited.asImageBitmap(), dstOffset = androidx.compose.ui.unit.IntOffset(left.roundToInt(), top.roundToInt()),
                        dstSize = androidx.compose.ui.unit.IntSize(w.roundToInt(), h.roundToInt()))
                    touch?.let {
                        val preview = Offset(it.x, (it.y - cursorOffsetPx).coerceAtLeast(12.dp.toPx()))
                        drawCircle(Color(0xFFFF4FA3), radius = (brush * fit / 2f).coerceAtLeast(3f),
                            center = preview, style = Stroke(width = 2.dp.toPx()))
                        drawLine(Color(0xFFFF4FA3), Offset(it.x, preview.y + 8.dp.toPx()), it, strokeWidth = 1.dp.toPx())
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = {
                val folder = File(context.filesDir, "sticker-library").apply { mkdirs() }
                val file = File(folder, "manual-${UUID.randomUUID()}.png")
                file.outputStream().use { edited.compress(Bitmap.CompressFormat.PNG, 100, it) }
                onSave(Uri.fromFile(file).toString())
            }) { Text("Save changes") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}

private fun colorDiff(a: Int, b: Int): Double {
    val dr = android.graphics.Color.red(a) - android.graphics.Color.red(b)
    val dg = android.graphics.Color.green(a) - android.graphics.Color.green(b)
    val db = android.graphics.Color.blue(a) - android.graphics.Color.blue(b)
    return sqrt((dr * dr + dg * dg + db * db).toDouble())
}
