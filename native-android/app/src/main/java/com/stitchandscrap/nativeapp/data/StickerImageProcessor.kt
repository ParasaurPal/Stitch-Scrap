package com.stitchandscrap.nativeapp.data

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.net.Uri
import android.graphics.PorterDuff
import android.graphics.PorterDuffColorFilter
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.util.ArrayDeque
import java.util.UUID
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.sin
import kotlin.math.sqrt

/**
 * On-device die-cut processing. Only removes background-colored pixels connected
 * to the image boundary, so similarly colored details inside the subject survive.
 * The original photo is never modified.
 */
suspend fun createDieCutSticker(
    context: Context,
    source: String,
    threshold: Int = 26,
    borderWidth: Int = 8,
): String? = withContext(Dispatchers.IO) {
    if (source.startsWith("emoji:")) return@withContext null

    val original = runCatching {
        val uri = Uri.parse(source)
        if (uri.scheme == "file") uri.path?.let { BitmapFactory.decodeFile(it) }
        else context.contentResolver.openInputStream(uri)?.use(BitmapFactory::decodeStream)
    }.getOrNull() ?: return@withContext null

    var scaled: Bitmap? = null
    var foreground: Bitmap? = null
    var silhouette: Bitmap? = null
    var output: Bitmap? = null
    try {
        val maxDimension = maxOf(original.width, original.height).coerceAtLeast(1)
        val scale = min(1f, 1000f / maxDimension)
        val width = (original.width * scale).toInt().coerceAtLeast(1)
        val height = (original.height * scale).toInt().coerceAtLeast(1)
        val working = if (width != original.width || height != original.height)
            Bitmap.createScaledBitmap(original, width, height, true) else original
        scaled = working

        val count = width * height
        val pixels = IntArray(count)
        working.getPixels(pixels, 0, width, 0, 0, width, height)

        val corners = intArrayOf(
            pixels[0], pixels[width - 1],
            pixels[(height - 1) * width], pixels[count - 1]
        )
        val bgR = corners.map { Color.red(it) }.average()
        val bgG = corners.map { Color.green(it) }.average()
        val bgB = corners.map { Color.blue(it) }.average()
        val distanceLimit = ((threshold.coerceIn(0, 100) / 100.0) *
            sqrt(3.0 * 255.0 * 255.0)).coerceAtLeast(1.0)

        fun matchesBackground(index: Int): Boolean {
            val pixel = pixels[index]
            if (Color.alpha(pixel) < 18) return true
            val dr = Color.red(pixel) - bgR
            val dg = Color.green(pixel) - bgG
            val db = Color.blue(pixel) - bgB
            return sqrt(dr * dr + dg * dg + db * db) <= distanceLimit
        }

        // Flood-fill from every edge. Unlike a global color key, this preserves
        // white clothing, eyes, paper, and other details enclosed by the subject.
        val background = BooleanArray(count)
        val queue = IntArray(count)
        var head = 0
        var tail = 0
        fun addSeed(index: Int) {
            if (!background[index] && matchesBackground(index)) {
                background[index] = true
                queue[tail++] = index
            }
        }
        for (x in 0 until width) {
            addSeed(x)
            if (height > 1) addSeed((height - 1) * width + x)
        }
        for (y in 1 until height - 1) {
            addSeed(y * width)
            if (width > 1) addSeed(y * width + width - 1)
        }
        while (head < tail) {
            val index = queue[head++]
            val x = index % width
            val y = index / width
            if (x > 0) addSeed(index - 1)
            if (x + 1 < width) addSeed(index + 1)
            if (y > 0) addSeed(index - width)
            if (y + 1 < height) addSeed(index + width)
        }

        val cutoutPixels = IntArray(count)
        val silhouettePixels = IntArray(count)
        for (i in pixels.indices) {
            val pixel = pixels[i]
            if (background[i] || Color.alpha(pixel) < 18) {
                cutoutPixels[i] = Color.TRANSPARENT
                silhouettePixels[i] = Color.TRANSPARENT
            } else {
                cutoutPixels[i] = pixel
                silhouettePixels[i] = Color.argb(Color.alpha(pixel), 255, 255, 255)
            }
        }

        foreground = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        foreground.setPixels(cutoutPixels, 0, width, 0, 0, width, height)
        silhouette = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        silhouette.setPixels(silhouettePixels, 0, width, 0, 0, width, height)

        val radius = borderWidth.coerceIn(0, 24).toFloat()
        val padding = (radius * 2 + 10).toInt()
        output = Bitmap.createBitmap(width + padding * 2, height + padding * 2, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(output!!)
        val borderPaint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG).apply {
            colorFilter = PorterDuffColorFilter(Color.WHITE, PorterDuff.Mode.SRC_IN)
        }
        if (radius > 0f) {
            val steps = 32
            for (step in 0 until steps) {
                val angle = step * (Math.PI * 2.0 / steps)
                val dx = cos(angle).toFloat() * radius
                val dy = sin(angle).toFloat() * radius
                canvas.drawBitmap(silhouette!!, padding + dx, padding + dy, borderPaint)
            }
        }
        canvas.drawBitmap(foreground!!, padding.toFloat(), padding.toFloat(),
            Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG))

        val folder = File(context.filesDir, "sticker-library").apply { mkdirs() }
        val destination = File(folder, "cutout-${UUID.randomUUID()}.png")
        destination.outputStream().use { output!!.compress(Bitmap.CompressFormat.PNG, 100, it) }
        Uri.fromFile(destination).toString()
    } catch (_: Throwable) {
        null
    } finally {
        foreground?.recycle()
        silhouette?.recycle()
        output?.recycle()
        if (scaled != null && scaled !== original) scaled?.recycle()
        original.recycle()
    }
}
