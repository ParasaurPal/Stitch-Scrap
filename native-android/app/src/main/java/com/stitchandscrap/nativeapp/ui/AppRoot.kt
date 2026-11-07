package com.stitchandscrap.nativeapp.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Book
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.stitchandscrap.nativeapp.R
import com.stitchandscrap.nativeapp.data.SampleData
import com.stitchandscrap.nativeapp.data.model.Journal
import com.stitchandscrap.nativeapp.data.model.JournalEntry

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppRoot() {
    var selectedJournal by remember { mutableStateOf<Journal?>(null) }
    var selectedEntry by remember { mutableStateOf<JournalEntry?>(null) }

    val title = when {
        selectedEntry != null -> selectedEntry?.title ?: "Entry"
        selectedJournal != null -> selectedJournal?.name ?: "Journal"
        else -> "Stitch & Scrap (Native)"
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(title, fontWeight = FontWeight.SemiBold) },
                navigationIcon = {
                    if (selectedEntry != null || selectedJournal != null) {
                        IconButton(onClick = {
                            if (selectedEntry != null) selectedEntry = null else selectedJournal = null
                        }) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                ),
            )
        },
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(MaterialTheme.colorScheme.background),
        ) {
            when {
                selectedEntry != null -> EntryDetail(selectedEntry!!)
                selectedJournal != null -> EntryList(
                    journal = selectedJournal!!,
                    entries = SampleData.entries.filter { it.journalId == selectedJournal!!.id },
                    onSelect = { selectedEntry = it },
                )
                else -> JournalsHome(onSelect = { selectedJournal = it })
            }
        }
    }
}

@Composable
private fun JournalsHome(onSelect: (Journal) -> Unit) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Text(
                text = stringResource(R.string.native_foundation_note),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.secondary,
            )
            Spacer(Modifier.height(8.dp))
        }
        items(SampleData.journals, key = { it.id }) { journal ->
            JournalCard(journal = journal, onClick = { onSelect(journal) })
        }
    }
}

@Composable
private fun JournalCard(journal: Journal, onClick: () -> Unit) {
    val accent = runCatching { Color(android.graphics.Color.parseColor(journal.themeColor)) }
        .getOrDefault(MaterialTheme.colorScheme.primary)
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(16.dp),
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(accent.copy(alpha = 0.2f)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(Icons.Default.Book, contentDescription = null, tint = accent)
            }
            Spacer(Modifier.size(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(journal.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                if (journal.description.isNotBlank()) {
                    Text(
                        journal.description,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.75f),
                    )
                }
            }
            Text(journal.coverPattern ?: "📓", style = MaterialTheme.typography.titleLarge)
        }
    }
}

@Composable
private fun EntryList(journal: Journal, entries: List<JournalEntry>, onSelect: (JournalEntry) -> Unit) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        if (entries.isEmpty()) {
            item {
                Text(
                    "No entries yet in this foundation build. Data layer & editor come next.",
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
        }
        items(entries, key = { it.id }) { entry ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onSelect(entry) },
                shape = RoundedCornerShape(14.dp),
            ) {
                Column(Modifier.padding(14.dp)) {
                    Text(entry.title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                    Text(entry.date, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.secondary)
                }
            }
        }
    }
}

@Composable
private fun EntryDetail(entry: JournalEntry) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            entry.blogMetadata.mood?.let { mood ->
                Text(
                    "${mood.emoji} ${mood.label} · ${mood.intensity}%",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.secondary,
                )
            }
        }
        item {
            Text(entry.content, style = MaterialTheme.typography.bodyLarge)
        }
        item {
            Text(
                "Planned native features: scrapbook canvas, draggable stickers/tapes with borders/patterns/thickness, " +
                    "rich text, mood/blog widgets, AI sticker API integration, local persistence (Room), Firebase sync, export.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
            )
        }
    }
}
