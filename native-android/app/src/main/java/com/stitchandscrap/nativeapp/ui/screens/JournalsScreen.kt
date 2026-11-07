package com.stitchandscrap.nativeapp.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.stitchandscrap.nativeapp.data.model.Journal

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun JournalsScreen(
    journals: List<Journal>,
    ready: Boolean,
    userEmail: String?,
    syncMessage: String,
    working: Boolean,
    onSignIn: () -> Unit,
    onSignOut: () -> Unit,
    onBackup: () -> Unit,
    onRestore: () -> Unit,
    onOpen: (String) -> Unit,
    onCreate: (name: String, description: String, themeColor: String) -> Unit,
    onDelete: (String) -> Unit,
) {
    var showCreate by remember { mutableStateOf(false) }
    var name by remember { mutableStateOf("") }
    var desc by remember { mutableStateOf("") }
    var color by remember { mutableStateOf("#f472b6") }
    var confirmRestore by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Stitch & Scrap", fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface),
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { showCreate = true }) {
                Icon(Icons.Default.Add, contentDescription = "New journal")
            }
        },
    ) { padding ->
        if (!ready) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            return@Scaffold
        }
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                ) {
                    Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            if (userEmail == null) "Cloud backup" else "Signed in as " + userEmail,
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.SemiBold,
                        )
                        Text(syncMessage, style = MaterialTheme.typography.bodySmall)
                        if (userEmail == null) {
                            Button(onClick = onSignIn, enabled = !working, modifier = Modifier.fillMaxWidth()) {
                                Text(if (working) "Please wait…" else "Sign in with Google")
                            }
                        } else {
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Button(onClick = onBackup, enabled = !working, modifier = Modifier.weight(1f)) {
                                    Text("Back up")
                                }
                                OutlinedButton(onClick = { confirmRestore = true }, enabled = !working, modifier = Modifier.weight(1f)) {
                                    Text("Restore")
                                }
                            }
                            TextButton(onClick = onSignOut, enabled = !working) { Text("Sign out") }
                        }
                    }
                }
            }
            if (journals.isEmpty()) {
                item { Text("No journals yet. Tap + to create one.", style = MaterialTheme.typography.bodyLarge) }
            }
            items(journals, key = { it.id }) { journal ->
                val accent = runCatching { Color(android.graphics.Color.parseColor(journal.themeColor)) }
                    .getOrDefault(MaterialTheme.colorScheme.primary)
                Card(
                    modifier = Modifier.fillMaxWidth().clickable { onOpen(journal.id) },
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                ) {
                    Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            Modifier.size(48.dp).clip(RoundedCornerShape(12.dp)).background(accent.copy(alpha = 0.22f)),
                            contentAlignment = Alignment.Center,
                        ) { Text(journal.coverPattern ?: "📓", style = MaterialTheme.typography.titleLarge) }
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(journal.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                            if (journal.description.isNotBlank()) {
                                Text(journal.description, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.75f))
                            }
                        }
                        IconButton(onClick = { onDelete(journal.id) }) {
                            Icon(Icons.Default.Delete, contentDescription = "Delete journal", tint = MaterialTheme.colorScheme.error)
                        }
                    }
                }
            }
        }
    }

    if (confirmRestore) {
        AlertDialog(
            onDismissRequest = { confirmRestore = false },
            title = { Text("Restore cloud backup?") },
            text = { Text("Restoring replaces the journals and entries currently stored on this device. Back up first if you want to keep this device's latest changes.") },
            confirmButton = {
                TextButton(onClick = { confirmRestore = false; onRestore() }) { Text("Restore") }
            },
            dismissButton = {
                TextButton(onClick = { confirmRestore = false }) { Text("Cancel") }
            },
        )
    }

    if (showCreate) {
        AlertDialog(
            onDismissRequest = { showCreate = false },
            title = { Text("New Journal") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Name") }, singleLine = true)
                    OutlinedTextField(value = desc, onValueChange = { desc = it }, label = { Text("Description") })
                    Text("Theme color (hex)", style = MaterialTheme.typography.labelSmall)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("#f472b6", "#38bdf8", "#a78bfa", "#f59e0b", "#10b981").forEach { c ->
                            Box(
                                Modifier.size(28.dp).clip(RoundedCornerShape(8.dp)).background(Color(android.graphics.Color.parseColor(c)))
                                    .clickable { color = c }.then(if (color == c) Modifier.background(Color.White.copy(alpha = 0.25f)) else Modifier)
                            )
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    onCreate(name, desc, color)
                    name = ""; desc = ""; color = "#f472b6"; showCreate = false
                }) { Text("Create") }
            },
            dismissButton = { TextButton(onClick = { showCreate = false }) { Text("Cancel") } },
        )
    }
}
