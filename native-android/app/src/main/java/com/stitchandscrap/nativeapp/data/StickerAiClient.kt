package com.stitchandscrap.nativeapp.data

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID

/**
 * Client for the original Stitch & Scrap Gemini sticker endpoints.
 * The Gemini key stays on the server; it is never stored in the APK.
 */
object StickerAiClient {
    private fun endpoint(baseUrl: String, path: String): URL {
        val clean = baseUrl.trim().trimEnd('/')
        require(clean.startsWith("https://") || clean.startsWith("http://")) {
            "Enter the full server address, starting with https://"
        }
        return URL("$clean$path")
    }

    private fun postJson(url: URL, body: JSONObject): JSONObject {
        val connection = (url.openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 20_000
            readTimeout = 150_000
            doOutput = true
            setRequestProperty("Content-Type", "application/json; charset=utf-8")
            setRequestProperty("Accept", "application/json")
        }
        try {
            connection.outputStream.use { it.write(body.toString().toByteArray(Charsets.UTF_8)) }
            val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
            val response = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
            val json = runCatching { JSONObject(response) }.getOrElse {
                throw IllegalStateException("The sticker server returned an unreadable response (HTTP ${connection.responseCode}).")
            }
            if (connection.responseCode !in 200..299) {
                throw IllegalStateException(json.optString("error").ifBlank { "Sticker server error (HTTP ${connection.responseCode})." })
            }
            return json
        } finally {
            connection.disconnect()
        }
    }

    private fun saveDataImage(context: Context, dataUrl: String): String {
        val comma = dataUrl.indexOf(',')
        require(dataUrl.startsWith("data:image/") && comma > 0) {
            "The server did not return an image. Check that the configured endpoint is the Stitch & Scrap server."
        }
        val header = dataUrl.substring(0, comma)
        val mime = header.substringAfter("data:").substringBefore(';')
        val bytes = Base64.decode(dataUrl.substring(comma + 1), Base64.DEFAULT)
        val extension = when (mime.lowercase()) {
            "image/jpeg", "image/jpg" -> "jpg"
            "image/webp" -> "webp"
            else -> "png"
        }
        val folder = File(context.filesDir, "sticker-library").apply { mkdirs() }
        val file = File(folder, "ai-${UUID.randomUUID()}.$extension")
        file.writeBytes(bytes)
        return Uri.fromFile(file).toString()
    }

    suspend fun generateSticker(
        context: Context,
        baseUrl: String,
        prompt: String,
        aspectRatio: String = "1:1",
        imageSize: String = "1K",
        dieCut: Boolean = true,
    ): String = withContext(Dispatchers.IO) {
        require(prompt.isNotBlank()) { "Describe the sticker you want to create." }
        val request = JSONObject().apply {
            put("prompt", prompt.trim())
            put("aspectRatio", aspectRatio)
            put("imageSize", imageSize)
            put("model", "gemini-3-pro-image-preview")
            put("isDieCutSticker", dieCut)
        }
        val response = postJson(endpoint(baseUrl, "/api/generate-sticker"), request)
        val image = response.optString("imageUrl")
        require(image.isNotBlank()) { "Gemini did not return an image." }
        saveDataImage(context, image)
    }

    suspend fun removeBackground(context: Context, baseUrl: String, source: String): String =
        withContext(Dispatchers.IO) {
            val uri = Uri.parse(source)
            val bitmap = if (uri.scheme == "file") {
                uri.path?.let { BitmapFactory.decodeFile(it) }
            } else {
                context.contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it) }
            } ?: throw IllegalStateException("Couldn't read this photo. Try choosing it again.")

            try {
                val maxSide = maxOf(bitmap.width, bitmap.height).coerceAtLeast(1)
                val scaled = if (maxSide > 1600) {
                    val ratio = 1600f / maxSide
                    Bitmap.createScaledBitmap(bitmap, (bitmap.width * ratio).toInt().coerceAtLeast(1),
                        (bitmap.height * ratio).toInt().coerceAtLeast(1), true)
                } else bitmap
                try {
                    val bytes = ByteArrayOutputStream().use { output ->
                        scaled.compress(Bitmap.CompressFormat.JPEG, 88, output)
                        output.toByteArray()
                    }
                    val encoded = Base64.encodeToString(bytes, Base64.NO_WRAP)
                    val request = JSONObject().apply {
                        put("imageBase64", "data:image/jpeg;base64,$encoded")
                        put("mimeType", "image/jpeg")
                    }
                    val response = postJson(endpoint(baseUrl, "/api/ai-edge-detection"), request)
                    val image = response.optString("imageUrl")
                    require(image.isNotBlank()) { "Gemini did not return a cutout image." }
                    saveDataImage(context, image)
                } finally {
                    if (scaled !== bitmap) scaled.recycle()
                }
            } finally {
                bitmap.recycle()
            }
        }
}
