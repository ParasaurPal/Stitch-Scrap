package com.stitchandscrap.nativeapp.data.local

import android.content.Context
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.File

class JsonStore(private val context: Context) {
    val json: Json = Json {
        prettyPrint = true
        ignoreUnknownKeys = true
        encodeDefaults = true
        coerceInputValues = true
    }

    private fun file(name: String): File = File(context.filesDir, name)

    inline fun <reified T> read(name: String, default: () -> T): T {
        val f = file(name)
        if (!f.exists()) return default()
        return runCatching { json.decodeFromString<T>(f.readText()) }.getOrElse { default() }
    }

    inline fun <reified T> write(name: String, value: T) {
        file(name).writeText(json.encodeToString(value))
    }
}
