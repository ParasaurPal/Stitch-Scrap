package com.stitchandscrap.nativeapp.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.stitchandscrap.nativeapp.data.model.Journal
import com.stitchandscrap.nativeapp.data.model.JournalEntry

private fun pagePaperColor(texture: String): Color = when (texture) {
    "night" -> Color(0xFF25283A)
    "kraft", "vintage-torn-collage" -> Color(0xFFF1DFC0)
    "blush", "pink-grid-wavy", "strawberry-gingham" -> Color(0xFFFFEAF0)
    "lavender-grid-wavy" -> Color(0xFFF0EAFE)
    else -> Color(0xFFFFFCF3)
}

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
                title = {
                    Column {
                        Text(journal?.name ?: "Journal", fontWeight = FontWeight.Bold)
                        Text("SCRAPBOOK PAGES", style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant, letterSpacing = 1.2.sp)
                    }
                },
                navigationIcon = { IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface),
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(onClick = onCreateEntry,
                icon = { Icon(Icons.Default.Add, contentDescription = null) },
                text = { Text("New page") })
        },
    ) { padding ->
        if (entries.isEmpty()) {
            Box(Modifier.fillMaxSize().padding(padding).padding(28.dp), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("📒", fontSize = 52.sp)
                    Text("A blank page is a beginning", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Text("Create a page, add your photos, and decorate it with stickers and washi tape.",
                        style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Button(onClick = onCreateEntry) { Text("Create your first page") }
                }
            }
        } else {
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(start = 14.dp, end = 14.dp, top = 14.dp, bottom = 100.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                item {
                    Column(Modifier.fillMaxWidth().padding(bottom = 2.dp)) {
                        Text("${entries.size} ${if (entries.size == 1) "page" else "pages"}",
                            style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text("Tap a page to open the editor", style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
                item { Spacer(Modifier.height(1.dp)) }
                items(entries, key = { it.id }) { entry ->
                    Card(
                        modifier = Modifier.fillMaxWidth().clickable { onOpenEntry(entry.id) },
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    ) {
                        Column(Modifier.padding(9.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Box(Modifier.fillMaxWidth().aspectRatio(0.78f)
                                .clip(RoundedCornerShape(11.dp)).background(pagePaperColor(entry.paperTexture))
                                .clickable { onOpenEntry(entry.id) }) {
                                Column(Modifier.fillMaxSize().padding(12.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
                                    Text(entry.date.ifBlank { "A little memory" }, fontSize = 8.sp,
                                        color = if (entry.paperTexture == "night") Color.White.copy(alpha = 0.7f) else Color(0xFF8A7568))
                                    Text(entry.title.ifBlank { "Untitled page" }, fontSize = 15.sp,
                                        lineHeight = 18.sp, fontWeight = FontWeight.Bold,
                                        color = if (entry.paperTexture == "night") Color.White else Color(0xFF493A32),
                                        maxLines = 3)
                                    Box(Modifier.fillMaxWidth().height(1.dp).background(
                                        if (entry.paperTexture == "night") Color.White.copy(alpha = 0.18f) else Color(0x338A7568)))
                                    Text(entry.content.replace(Regex("<[^>]*>"), "").take(105),
                                        fontSize = 9.sp, lineHeight = 13.sp, maxLines = 5,
                                        color = if (entry.paperTexture == "night") Color.White.copy(alpha = 0.8f) else Color(0xFF66574D))
                                    Spacer(Modifier.weight(1f))
                                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                        if (entry.stickers.isNotEmpty()) Text("✦ ${entry.stickers.size}", fontSize = 9.sp,
                                            color = if (entry.paperTexture == "night") Color.White else Color(0xFF8A5267))
                                        if (entry.tapes.isNotEmpty()) Text("▰ ${entry.tapes.size}", fontSize = 9.sp,
                                            color = if (entry.paperTexture == "night") Color.White else Color(0xFF8A5267))
                                        Text(entry.blogMetadata.mood.emoji, fontSize = 11.sp)
                                    }
                                }
                                IconButton(onClick = { onDeleteEntry(entry.id) },
                                    modifier = Modifier.align(Alignment.TopEnd).size(30.dp)) {
                                    Icon(Icons.Default.Delete, contentDescription = "Delete page",
                                        tint = Color(0xFF8A5267), modifier = Modifier.size(16.dp))
                                }
                            }
                            Text(entry.title.ifBlank { "Untitled page" }, style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold, maxLines = 1)
                            Text(entry.date, style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)
                        }
                    }
                }
            }
        }
    }
}
