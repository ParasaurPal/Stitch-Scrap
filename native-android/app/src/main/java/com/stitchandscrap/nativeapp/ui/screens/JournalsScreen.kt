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
import androidx.compose.material.icons.filled.CloudDone
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.stitchandscrap.nativeapp.data.model.Journal
import com.stitchandscrap.nativeapp.data.model.JournalEntry

private fun journalColor(hex: String): Color =
    runCatching { Color(android.graphics.Color.parseColor(hex)) }.getOrDefault(Color(0xFFE879A8))

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun JournalsScreen(
    journals: List<Journal>,
    entries: List<JournalEntry>,
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
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("STITCH & SCRAP", fontWeight = FontWeight.ExtraBold, letterSpacing = 1.4.sp)
                        Text("YOUR CREATIVE SPACE", style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant, letterSpacing = 1.6.sp)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { showCreate = true },
                icon = { Icon(Icons.Default.Add, contentDescription = null) },
                text = { Text("New journal") },
            )
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
            contentPadding = PaddingValues(start = 18.dp, end = 18.dp, top = 12.dp, bottom = 100.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            item {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.padding(bottom = 4.dp)) {
                    Text("Make room for memories.", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    Text("Every journal is a little world of its own. Open one to decorate a page, collect photos, and tell your story.",
                        style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        Surface(color = MaterialTheme.colorScheme.secondaryContainer, shape = RoundedCornerShape(50)) {
                            Text("${journals.size} JOURNALS", modifier = Modifier.padding(horizontal = 11.dp, vertical = 6.dp),
                                style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                        }
                        Surface(color = MaterialTheme.colorScheme.tertiaryContainer, shape = RoundedCornerShape(50)) {
                            Text("${entries.size} PAGES", modifier = Modifier.padding(horizontal = 11.dp, vertical = 6.dp),
                                style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            if (journals.isEmpty()) {
                item {
                    Card(shape = RoundedCornerShape(22.dp)) {
                        Column(Modifier.fillMaxWidth().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Text("📔", fontSize = 42.sp)
                            Text("Your shelf is waiting", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                            Text("Create your first journal and start building a scrapbook that's yours.",
                                style = MaterialTheme.typography.bodyMedium)
                            Button(onClick = { showCreate = true }) { Text("Create a journal") }
                        }
                    }
                }
            }

            items(journals, key = { it.id }) { journal ->
                val accent = journalColor(journal.themeColor)
                val pages = entries.filter { it.journalId == journal.id }
                val latest = pages.maxByOrNull { it.updatedAt.ifBlank { it.createdAt } }
                Card(
                    modifier = Modifier.fillMaxWidth().clickable { onOpen(journal.id) },
                    shape = RoundedCornerShape(22.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                ) {
                    Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(Modifier.width(104.dp).height(132.dp)) {
                            Box(Modifier.fillMaxSize().padding(start = 7.dp, top = 5.dp)
                                .clip(RoundedCornerShape(10.dp)).background(accent.copy(alpha = 0.25f)))
                            Box(Modifier.fillMaxSize().padding(end = 5.dp, bottom = 4.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(Brush.linearGradient(listOf(accent, accent.copy(alpha = 0.72f)))),
                                contentAlignment = Alignment.Center) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(7.dp), modifier = Modifier.padding(8.dp)) {
                                    Text(journal.coverPattern ?: "✂️", fontSize = 32.sp)
                                    Text(journal.name.uppercase(), color = Color.White, fontSize = 10.sp,
                                        lineHeight = 13.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = 0.7.sp,
                                        maxLines = 3)
                                    Box(Modifier.width(34.dp).height(2.dp).background(Color.White.copy(alpha = 0.65f)))
                                    Text("STITCH & SCRAP", color = Color.White.copy(alpha = 0.8f), fontSize = 6.sp,
                                        letterSpacing = 0.8.sp)
                                }
                            }
                        }
                        Spacer(Modifier.width(14.dp))
                        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(journal.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            if (journal.description.isNotBlank()) {
                                Text(journal.description, style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 3)
                            }
                            Text("${pages.size} ${if (pages.size == 1) "page" else "pages"}",
                                style = MaterialTheme.typography.labelMedium, color = accent, fontWeight = FontWeight.Bold)
                            if (latest != null) {
                                Text("Latest: ${latest.title.ifBlank { "Untitled page" }}",
                                    style = MaterialTheme.typography.bodySmall, maxLines = 2,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant)
                            } else {
                                Text("Ready for your first memory", style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("OPEN JOURNAL  →", style = MaterialTheme.typography.labelSmall,
                                    color = accent, fontWeight = FontWeight.ExtraBold, letterSpacing = 0.7.sp)
                                Spacer(Modifier.weight(1f))
                                IconButton(onClick = { onDelete(journal.id) }, modifier = Modifier.size(34.dp)) {
                                    Icon(Icons.Default.Delete, contentDescription = "Delete journal",
                                        tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(18.dp))
                                }
                            }
                        }
                    }
                }
            }

            item {
                Card(shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
                    Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.CloudDone, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Spacer(Modifier.width(8.dp))
                            Text(if (userEmail == null) "Cloud backup & sync" else "Cloud account",
                                style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                        }
                        Text(if (userEmail == null) "Sign in to back up your journals and restore them on another device."
                            else "Signed in as $userEmail", style = MaterialTheme.typography.bodySmall)
                        if (syncMessage.isNotBlank()) Text(syncMessage, style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant)
                        if (userEmail == null) {
                            Button(onClick = onSignIn, enabled = !working, modifier = Modifier.fillMaxWidth()) {
                                Text(if (working) "Please wait…" else "Sign in with Google")
                            }
                        } else {
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Button(onClick = onBackup, enabled = !working, modifier = Modifier.weight(1f)) { Text("Back up") }
                                OutlinedButton(onClick = { confirmRestore = true }, enabled = !working,
                                    modifier = Modifier.weight(1f)) { Text("Restore") }
                            }
                            TextButton(onClick = onSignOut, enabled = !working) { Text("Sign out") }
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
            confirmButton = { TextButton(onClick = { confirmRestore = false; onRestore() }) { Text("Restore") } },
            dismissButton = { TextButton(onClick = { confirmRestore = false }) { Text("Cancel") } },
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
                    Text("Cover color", style = MaterialTheme.typography.labelSmall)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("#f472b6", "#38bdf8", "#a78bfa", "#f59e0b", "#10b981", "#c084fc").forEach { c ->
                            Box(Modifier.size(30.dp).clip(RoundedCornerShape(8.dp)).background(journalColor(c))
                                .clickable { color = c }) {
                                if (color == c) Text("✓", color = Color.White, modifier = Modifier.align(Alignment.Center))
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    if (name.isNotBlank()) onCreate(name, desc, color)
                    name = ""; desc = ""; color = "#f472b6"; showCreate = false
                }) { Text("Create") }
            },
            dismissButton = { TextButton(onClick = { showCreate = false }) { Text("Cancel") } },
        )
    }
}
