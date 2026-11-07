package com.stitchandscrap.nativeapp.data.model

import kotlinx.serialization.Serializable

/**
 * Native foundation models mirroring the core Stitch & Scrap concepts.
 * Persistence (Room/DataStore) and full feature parity are implemented in later phases.
 */

@Serializable
data class MoodItem(
    val id: String,
    val label: String,
    val emoji: String,
    val color: String,
    val intensity: Int,
    val note: String? = null,
)

@Serializable
data class PlacedSticker(
    val id: String,
    val src: String,
    val alt: String,
    val x: Float,
    val y: Float,
    val width: Float,
    val height: Float,
    val rotation: Float,
    val scale: Float = 1f,
    val zIndex: Int = 0,
    val filter: String = "none",
    val texture: String = "none",
    val borderStyle: String = "diecut",
    val borderWidth: Int? = 4,
    val borderColor: String? = "#ffffff",
    val borderPattern: String? = "solid",
)

@Serializable
data class PlacedTape(
    val id: String,
    val x: Float,
    val y: Float,
    val width: Float,
    val height: Float,
    val rotation: Float,
    val pattern: String,
    val text: String,
    val textColor: String,
    val fontFamily: String,
    val zIndex: Int = 0,
    val opacity: Float = 0.92f,
)

@Serializable
data class BlogMetadata(
    val mood: MoodItem? = null,
    val currentlyListening: String? = null,
    val currentlyReading: String? = null,
    val currentlyWatching: String? = null,
    val location: String? = null,
)

@Serializable
data class JournalEntry(
    val id: String,
    val journalId: String,
    val title: String,
    val date: String,
    val content: String = "",
    val paperTexture: String = "lined",
    val blogMetadata: BlogMetadata = BlogMetadata(),
    val stickers: List<PlacedSticker> = emptyList(),
    val tapes: List<PlacedTape> = emptyList(),
    val createdAt: String = "",
    val updatedAt: String = "",
)

@Serializable
data class Journal(
    val id: String,
    val name: String,
    val description: String = "",
    val themeColor: String = "#f472b6",
    val icon: String = "heart",
    val defaultPaper: String = "lined",
    val coverPattern: String? = null,
    val createdAt: String = "",
)
