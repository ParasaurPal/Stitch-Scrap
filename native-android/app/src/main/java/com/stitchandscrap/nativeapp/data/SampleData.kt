package com.stitchandscrap.nativeapp.data

import com.stitchandscrap.nativeapp.data.model.BlogMetadata
import com.stitchandscrap.nativeapp.data.model.Journal
import com.stitchandscrap.nativeapp.data.model.JournalEntry
import com.stitchandscrap.nativeapp.data.model.MoodItem

object SampleData {
    val journals = listOf(
        Journal(
            id = "journal-scrapbook",
            name = "Daily Scrapbook",
            description = "Personal diary, stickers & daily musings",
            themeColor = "#f472b6",
            icon = "heart",
            defaultPaper = "math-grid-stars",
            coverPattern = "💖",
        ),
        Journal(
            id = "journal-mood",
            name = "Mood Tracker",
            description = "Feelings, reflections & emotional check-ins",
            themeColor = "#38bdf8",
            icon = "cloud",
            defaultPaper = "lavender-grid-wavy",
            coverPattern = "☁️",
        ),
    )

    val entries = listOf(
        JournalEntry(
            id = "entry-native-1",
            journalId = "journal-scrapbook",
            title = "Native Rewrite Foundation",
            date = "Today",
            content = "This screen is rendered by the new Jetpack Compose native app foundation. " +
                "Next phases: local persistence, full editor/canvas, stickers & tapes, cloud sync.",
            blogMetadata = BlogMetadata(
                mood = MoodItem("inspired", "Inspired", "🎨", "#e11d48", 92, "Building native"),
            ),
        ),
    )
}
