package com.stitchandscrap.nativeapp.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AddPhotoAlternate
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Mood
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.StickyNote2
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.stitchandscrap.nativeapp.data.DefaultContent
import com.stitchandscrap.nativeapp.data.model.*
import java.util.UUID
import kotlin.math.roundToInt

private fun newId(p: String) = "$p-${UUID.randomUUID().toString().take(8)}"
private fun parseColor(hex: String, fallback: Color = Color(0xFFF472B6)): Color =
    runCatching { Color(android.graphics.Color.parseColor(hex)) }.getOrElse { fallback }

private fun paperColor(texture: String): Color = when (texture) {
    "math-grid-stars", "grid" -> Color(0xFFFFFDF7)
    "pink-grid-wavy", "blush" -> Color(0xFFFFF5F8)
    "lavender-grid-wavy" -> Color(0xFFF8F4FF)
    "strawberry-gingham" -> Color(0xFFFFF1F2)
    "vintage-torn-collage", "kraft" -> Color(0xFFF5E6C8)
    "dot" -> Color(0xFFFFFBF5)
    "night" -> Color(0xFF1A1C24)
    else -> Color(0xFFFFFDF7)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditorScreen(
    entry: JournalEntry,
    journal: Journal?,
    onBack: () -> Unit,
    onSave: (JournalEntry) -> Unit,
    onDelete: () -> Unit,
) {
    var draft by remember(entry.id) { mutableStateOf(entry) }
    var selectedStickerId by remember { mutableStateOf<String?>(null) }
    var selectedTapeId by remember { mutableStateOf<String?>(null) }
    var showStickerSheet by remember { mutableStateOf(false) }
    var showTapeSheet by remember { mutableStateOf(false) }
    var showMoodSheet by remember { mutableStateOf(false) }
    var canvasSize by remember { mutableStateOf(IntSize.Zero) }

    fun save() = onSave(draft)

    val imagePicker = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri: Uri? ->
        uri?.let {
            val highest = (draft.stickers.map { s -> s.zIndex } + draft.tapes.map { t -> t.zIndex }).maxOrNull() ?: 10
            val s = PlacedSticker(
                id = newId("stk"), src = it.toString(), alt = "Photo sticker",
                x = 40f, y = 35f, width = 140f, height = 140f, rotation = 0f, scale = 1f,
                zIndex = highest + 1, borderStyle = "diecut", borderWidth = 4, borderColor = "#ffffff", borderPattern = "solid",
                texture = "glossy", filter = "none"
            )
            draft = draft.copy(stickers = draft.stickers + s)
            selectedStickerId = s.id; selectedTapeId = null
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(draft.title.ifBlank { "Entry" }, maxLines = 1) },
                navigationIcon = { IconButton(onClick = { save(); onBack() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") } },
                actions = {
                    IconButton(onClick = { showMoodSheet = true }) { Icon(Icons.Default.Mood, "Mood & widgets") }
                    IconButton(onClick = { showStickerSheet = true }) { Icon(Icons.Default.AddPhotoAlternate, "Add sticker") }
                    IconButton(onClick = { showTapeSheet = true }) { Icon(Icons.Default.StickyNote2, "Add tape") }
                    IconButton(onClick = { save() }) { Icon(Icons.Default.Save, "Save") }
                    IconButton(onClick = onDelete) { Icon(Icons.Default.Delete, "Delete", tint = MaterialTheme.colorScheme.error) }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface),
            )
        },
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding)) {
            // Metadata/widgets summary
            BlogWidgetsSummary(draft.blogMetadata, onClick = { showMoodSheet = true })

            // Scrapbook canvas
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(8.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(paperColor(draft.paperTexture))
                    .onSizeChanged { canvasSize = it }
                    .clickable { selectedStickerId = null; selectedTapeId = null }
            ) {
                PaperPattern(draft.paperTexture)
                Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(14.dp)) {
                    OutlinedTextField(
                        value = draft.title,
                        onValueChange = { draft = draft.copy(title = it) },
                        label = { Text("Title") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = draft.content,
                        onValueChange = { draft = draft.copy(content = it) },
                        label = { Text("Write your entry...") },
                        modifier = Modifier.fillMaxWidth().heightIn(min = 160.dp),
                    )
                    Spacer(Modifier.height(220.dp))
                }

                // Tapes
                draft.tapes.sortedBy { it.zIndex }.forEach { tape ->
                    TapeItem(
                        tape = tape, selected = selectedTapeId == tape.id, canvasSize = canvasSize,
                        onSelect = { selectedTapeId = tape.id; selectedStickerId = null },
                        onMove = { dx, dy -> draft = draft.copy(tapes = draft.tapes.map { if (it.id == tape.id) it.copy(x = (it.x + dx).coerceIn(2f, 98f), y = (it.y + dy).coerceIn(2f, 98f)) else it }) },
                    )
                }
                // Stickers
                draft.stickers.sortedBy { it.zIndex }.forEach { sticker ->
                    StickerItem(
                        sticker = sticker, selected = selectedStickerId == sticker.id, canvasSize = canvasSize,
                        onSelect = { selectedStickerId = sticker.id; selectedTapeId = null },
                        onMove = { dx, dy -> draft = draft.copy(stickers = draft.stickers.map { if (it.id == sticker.id) it.copy(x = (it.x + dx).coerceIn(0f, 100f), y = (it.y + dy).coerceIn(0f, 100f)) else it }) },
                    )
                }
            }

            // Properties for selected sticker (includes border pattern + thickness + plain white px)
            val selSticker = draft.stickers.find { it.id == selectedStickerId }
            if (selSticker != null) {
                StickerPropertiesPanel(
                    sticker = selSticker,
                    onChange = { updated -> draft = draft.copy(stickers = draft.stickers.map { if (it.id == updated.id) updated else it }) },
                    onDelete = { draft = draft.copy(stickers = draft.stickers.filterNot { it.id == selSticker.id }); selectedStickerId = null },
                    onClose = { selectedStickerId = null },
                )
            }
            val selTape = draft.tapes.find { it.id == selectedTapeId }
            if (selTape != null) {
                TapePropertiesPanel(
                    tape = selTape,
                    onChange = { updated -> draft = draft.copy(tapes = draft.tapes.map { if (it.id == updated.id) updated else it }) },
                    onDelete = { draft = draft.copy(tapes = draft.tapes.filterNot { it.id == selTape.id }); selectedTapeId = null },
                    onClose = { selectedTapeId = null },
                )
            }
        }
    }

    if (showStickerSheet) {
        AddStickerSheet(
            onDismiss = { showStickerSheet = false },
            onPickImage = { imagePicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)); showStickerSheet = false },
            onAddEmoji = { emoji, label ->
                val highest = (draft.stickers.map { it.zIndex } + draft.tapes.map { it.zIndex }).maxOrNull() ?: 10
                val s = PlacedSticker(
                    id = newId("stk"), src = "emoji:$emoji", alt = label,
                    x = 35f + (Math.random() * 20).toFloat(), y = 30f + (Math.random() * 20).toFloat(),
                    width = 96f, height = 96f, zIndex = highest + 1,
                    borderStyle = "diecut", borderWidth = 4, borderColor = "#ffffff", borderPattern = "solid",
                )
                draft = draft.copy(stickers = draft.stickers + s)
                selectedStickerId = s.id; showStickerSheet = false
            }
        )
    }
    if (showTapeSheet) {
        AddTapeSheet(
            onDismiss = { showTapeSheet = false },
            onAdd = { pattern, text ->
                val highest = (draft.stickers.map { it.zIndex } + draft.tapes.map { it.zIndex }).maxOrNull() ?: 10
                val t = PlacedTape(id = newId("tape"), x = 40f, y = 20f, width = 170f, height = 34f, pattern = pattern, text = text)
                draft = draft.copy(tapes = draft.tapes + (t.copy(zIndex = highest + 1)))
                selectedTapeId = t.id; showTapeSheet = false
            }
        )
    }
    if (showMoodSheet) {
        MoodBlogSheet(
            metadata = draft.blogMetadata,
            onDismiss = { showMoodSheet = false },
            onSave = { draft = draft.copy(blogMetadata = it); showMoodSheet = false }
        )
    }
}
