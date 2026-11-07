package com.stitchandscrap.nativeapp.data

import com.stitchandscrap.nativeapp.data.model.*
import java.time.Instant
import java.util.UUID

object DefaultContent {
    private fun now(): String = Instant.now().toString()
    private fun id(prefix: String): String = "$prefix-${UUID.randomUUID().toString().take(8)}"

    fun journals(): List<Journal> = listOf(
        Journal(
            id = "journal-scrapbook",
            name = "Daily Scrapbook",
            description = "Personal diary, stickers & daily musings",
            themeColor = "#f472b6",
            icon = "heart",
            defaultPaper = "math-grid-stars",
            coverPattern = "💖",
            createdAt = now(),
        ),
        Journal(
            id = "journal-mood",
            name = "Mood Tracker",
            description = "Feelings, reflections & emotional check-ins",
            themeColor = "#38bdf8",
            icon = "cloud",
            defaultPaper = "lavender-grid-wavy",
            coverPattern = "☁️",
            createdAt = now(),
        ),
    )

    fun entries(): List<JournalEntry> = listOf(
        JournalEntry(
            id = id("entry"),
            journalId = "journal-scrapbook",
            title = "Welcome to Stitch & Scrap",
            date = "Today",
            content = "This is your native scrapbook. Tap + to add a new entry, use Stickers and Tape to decorate, and add mood/blog widgets from the toolbar.\n\nTry adding a sticker, then select it to move, rotate, resize, or change its border (plain white with selectable px thickness, plus patterns).",
            paperTexture = "math-grid-stars",
            blogMetadata = BlogMetadata(
                mood = MoodItem("inspired", "Inspired", "🎨", "#e11d48", 92, "Starting fresh"),
                currentlyListening = CurrentlyListening("Dreams", "Fleetwood Mac"),
                currentlyReading = CurrentlyReading("The Creative Act", "Rick Rubin", "Chapter 1"),
                location = "Home",
                weather = WeatherInfo("Sunny", "72°F", "☀️"),
            ),
            stickers = emptyList(),
            tapes = emptyList(),
            createdAt = now(),
            updatedAt = now(),
        )
    )

    fun moodPresets(): List<MoodItem> = listOf(
        MoodItem("nostalgic", "Nostalgic", "📼", "#ec4899", 85),
        MoodItem("cozy", "Cozy & Soft", "☕", "#f59e0b", 90),
        MoodItem("dreamy", "Dreamy", "✨", "#8b5cf6", 75),
        MoodItem("melancholy", "Sweet Melancholy", "🌧️", "#38bdf8", 60),
        MoodItem("ecstatic", "Euphoric / Hyped", "🎉", "#10b981", 95),
        MoodItem("chaotic", "Chaotic Good", "⚡", "#f43f5e", 88),
        MoodItem("zen", "Peaceful / Zen", "🍃", "#14b8a6", 80),
        MoodItem("inspired", "Artistic Fire", "🎨", "#e11d48", 92),
    )
}
