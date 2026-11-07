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
import java.util.UUID
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.sin
import kotlin.math.sqrt

/**
 * Local die-cut sticker processing. Estimates the background from the four corners,
 * removes pixels close to that color, then creates a smooth white contour around
 * the remaining subject. The original photo is never modified.
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
        if (uri.scheme == "file") {
            uri.path?.let { BitmapFactory.decodeFile(it) }
        } else {
            context.contentResolver.openInputStream(uri)?.use(BitmapFactory::decodeStream)
        }
    }.getOrNull() ?: return@withContext null

    try {
        val maxDimension = maxOf(original.width, original.height).coerceAtLeast(1)
        val scale = min(1f, 1000f / maxDimension)
        val width = (original.width * scale).toInt().coerceAtLeast(1)
        val height = (original.height * scale).toInt().coerceAtLeast(1)
        val scaled = if (width != original.width || height != original.height)
            Bitmap.createScaledBitmap(original, width, height, true) else original

        val pixels = IntArray(width * height)
        scaled.getPixels(pixels, 0, width, 0, 0, width, height)
        val corners = intArrayOf(pixels[0], pixels[width - 1], pixels[(height - 1) * width], pixels[height * width - 1])
        val bgR = corners.map { Color.red(it) }.average()
        val bgG = corners.map { Color.green(it) }.average()
        val bgB = corners.map { Color.blue(it) }.average()
        val distanceLimit = (threshold.coerceIn(0, 100) / 100.0) * sqrt(3.0 * 255.0 * 255.0)

        val cutoutPixels = IntArray(pixels.size)
        val silhouettePixels = IntArray(pixels.size)
        for (i in pixels.indices) {
            val pixel = pixels[i]
            val alpha = Color.alpha(pixel)
            val dr = Color.red(pixel) - bgR
            val dg = Color.green(pixel) - bgG
            val db = Color.blue(pixel) - bgB
            val distance = sqrt(dr * dr + dg * dg + db * db)
            if (alpha < 18 || distance < distanceLimit) {
                cutoutPixels[i] = Color.TRANSPARENT
                silhouettePixels[i] = Color.TRANSPARENT
            } else {
                cutoutPixels[i] = pixel
                silhouettePixels[i] = Color.WHITE
            }
        }

        val foreground = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        foreground.setPixels(cutoutPixels, 0, width, 0, 0, width, height)
        val silhouette = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        silhouette.setPixels(silhouettePixels, 0, width, 0, 0, width, height)

        val radius = borderWidth.coerceIn(0, 24).toFloat()
        val padding = (radius * 2 + 10).toInt()
        val output = Bitmap.createBitmap(width + padding * 2, height + padding * 2, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(output)
        val borderPaint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG).apply {
            colorFilter = PorterDuffColorFilter(Color.WHITE, PorterDuff.Mode.SRC_IN)
        }
        if (radius > 0f) {
            val steps = 24
            for (step in 0 until steps) {
                val angle = step * (Math.PI * 2.0 / steps)
                val dx = cos(angle).toFloat() * radius
                val dy = sin(angle).toFloat() * radius
                canvas.drawBitmap(silhouette, padding + dx, padding + dy, borderPaint)
            }
        }
        canvas.drawBitmap(foreground, padding.toFloat(), padding.toFloat(), Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG))

        val folder = File(context.filesDir, "sticker-library").apply { mkdirs() }
        val destination = File(folder, "cutout-${UUID.randomUUID()}.png")
        destination.outputStream().use { output.compress(Bitmap.CompressFormat.PNG, 100, it) }
        foreground.recycle()
        silhouette.recycle()
        if (scaled !== original) scaled.recycle()
        output.recycle()
        Uri.fromFile(destination).toString()
    } catch (_: Throwable) {
        null
    } finally {
        original.recycle()
    }
}
