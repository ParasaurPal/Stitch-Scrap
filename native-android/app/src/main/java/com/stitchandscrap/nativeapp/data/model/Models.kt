package com.stitchandscrap.nativeapp.data.model

import kotlinx.serialization.Serializable

@Serializable
data class MoodItem(
    val id: String = "",
    val label: String = "",
    val emoji: String = "🙂",
    val color: String = "#f472b6",
    val intensity: Int = 50,
    val note: String? = null,
)

@Serializable
data class CurrentlyListening(
    val song: String = "",
    val artist: String = "",
    val coverUrl: String? = null,
    val isPlaying: Boolean? = null,
)

@Serializable
data class CurrentlyReading(
    val title: String = "",
    val author: String = "",
    val progress: String = "",
    val rating: Int? = null,
)

@Serializable
data class WeatherInfo(
    val condition: String = "",
    val temp: String = "",
    val icon: String = "",
)

@Serializable
data class BlogMetadata(
    val mood: MoodItem = MoodItem(id = "calm", label = "Calm", emoji = "🌿", color = "#14b8a6", intensity = 70),
    val currentlyListening: CurrentlyListening = CurrentlyListening(),
    val currentlyReading: CurrentlyReading = CurrentlyReading(),
    val currentlyWatching: String? = null,
    val location: String? = null,
    val weather: WeatherInfo? = null,
    val currentlyEating: String? = null,
    val currentObsession: String? = null,
)

@Serializable
data class PlacedSticker(
    val id: String,
    val src: String, // URI string, URL, or drawable/resource key
    val alt: String = "Sticker",
    val x: Float, // percent 0..100
    val y: Float, // percent 0..100
    val width: Float, // dp
    val height: Float, // dp
    val rotation: Float = 0f,
    val scale: Float = 1f,
    val zIndex: Int = 0,
    val filter: String = "none",
    val texture: String = "none",
    val borderStyle: String = "diecut",
    val borderWidth: Int? = 4,
    val borderColor: String? = "#ffffff",
    val borderPattern: String? = "solid",
    val isFlippedX: Boolean = false,
    val caption: String? = null,
)

@Serializable
data class PlacedTape(
    val id: String,
    val x: Float,
    val y: Float,
    val width: Float,
    val height: Float,
    val rotation: Float = 0f,
    val pattern: String = "grid",
    val text: String = "",
    val textColor: String = "#3d2b1f",
    val fontFamily: String = "handwriting",
    val zIndex: Int = 0,
    val opacity: Float = 0.92f,
)

@Serializable
data class JournalEntry(
    val id: String,
    val journalId: String,
    val title: String = "",
    val date: String = "",
    val content: String = "",
    val fontFamily: String = "handwriting",
    val fontSize: Int = 18,
    val isBold: Boolean = false,
    val isItalic: Boolean = false,
    val isUnderlined: Boolean = false,
    val textColor: String = "#3d2b1f",
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
    val coverImage: String = "",
    val icon: String = "heart",
    val defaultPaper: String = "lined",
    val coverPattern: String? = null,
    val createdAt: String = "",
)
