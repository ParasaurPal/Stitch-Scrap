package com.stitchandscrap.nativeapp.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.stitchandscrap.nativeapp.data.model.Journal
import com.stitchandscrap.nativeapp.data.model.JournalEntry

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EntriesScreen(
    journal: Journal?,
    entries: List<JournalEntry>,
    onBack: () -> Unit,
    onOpenEntry: (String) -> Unit,
    onCreateEntry: () -> Unit,
    onDeleteEntry: (String) -> Unit,
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(journal?.name ?: "Journal", fontWeight = FontWeight.SemiBold) },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back") }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface),
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = onCreateEntry) { Icon(Icons.Default.Add, contentDescription = "New entry") }
        },
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            if (entries.isEmpty()) {
                item {
                    Text(
                        "No entries yet. Tap + to create your first scrapbook entry.",
                        style = MaterialTheme.typography.bodyLarge,
                    )
                }
            }
            items(entries, key = { it.id }) { entry ->
                Card(
                    modifier = Modifier.fillMaxWidth().clickable { onOpenEntry(entry.id) },
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                ) {
                    Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(entry.title.ifBlank { "Untitled" }, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                            Text(entry.date, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.secondary)
                            val mood = entry.blogMetadata.mood
                            Text("${mood.emoji} ${mood.label}", style = MaterialTheme.typography.bodySmall)
                            if (entry.content.isNotBlank()) {
                                Text(entry.content.take(80) + if (entry.content.length > 80) "…" else "",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f))
                            }
                        }
                        IconButton(onClick = { onDeleteEntry(entry.id) }) {
                            Icon(Icons.Default.Delete, contentDescription = "Delete", tint = MaterialTheme.colorScheme.error)
                        }
                    }
                }
            }
        }
    }
}
