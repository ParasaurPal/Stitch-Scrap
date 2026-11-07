package com.stitchandscrap.nativeapp.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
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

private fun fontFor(name: String): FontFamily = when (name) {
    "typewriter" -> FontFamily.Monospace
    "marker" -> FontFamily.SansSerif
    "doodle" -> FontFamily.Cursive
    "sans" -> FontFamily.SansSerif
    else -> FontFamily.Cursive
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
    var showPageDesign by remember { mutableStateOf(false) }
    var canvasSize by remember { mutableStateOf(IntSize.Zero) }
    val textColors = listOf("#292524", "#7F1D1D", "#9D174D", "#6B21A8", "#1D4ED8", "#166534", "#FFFFFF")
    val papers = listOf(
        "lined" to "Notebook", "grid" to "Math grid", "dot" to "Dot grid",
        "blush" to "Blush", "kraft" to "Kraft", "night" to "Night",
        "lavender-grid-wavy" to "Lavender", "strawberry-gingham" to "Gingham",
        "vintage-torn-collage" to "Vintage"
    )

    fun save() = onSave(draft)

    val imagePicker = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri: Uri? ->
        uri?.let {
            val highest = (draft.stickers.map { s -> s.zIndex } + draft.tapes.map { t -> t.zIndex }).maxOrNull() ?: 10
            val sticker = PlacedSticker(
                id = newId("stk"), src = it.toString(), alt = "Photo sticker",
                x = 40f, y = 35f, width = 140f, height = 140f, rotation = 0f, scale = 1f,
                zIndex = highest + 1, borderStyle = "diecut", borderWidth = 4,
                borderColor = "#ffffff", borderPattern = "solid", texture = "glossy", filter = "none"
            )
            draft = draft.copy(stickers = draft.stickers + sticker)
            selectedStickerId = sticker.id
            selectedTapeId = null
        }
    }

    Scaffold(
        containerColor = Color(0xFF292524),
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(draft.title.ifBlank { "Untitled scrapbook page" }, maxLines = 1)
                        Text(journal?.name ?: "Stitch & Scrap", style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                },
                navigationIcon = { IconButton(onClick = { save(); onBack() }) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") } },
                actions = {
                    IconButton(onClick = { showPageDesign = true }) { Text("Aa", fontWeight = FontWeight.Bold) }
                    IconButton(onClick = { showMoodSheet = true }) { Icon(Icons.Default.Mood, "Mood and widgets") }
                    IconButton(onClick = { showStickerSheet = true }) { Icon(Icons.Default.AddPhotoAlternate, "Add photo or sticker") }
                    IconButton(onClick = { showTapeSheet = true }) { Icon(Icons.Default.StickyNote2, "Add washi tape") }
                    IconButton(onClick = { save() }) { Icon(Icons.Default.Save, "Save page") }
                    IconButton(onClick = onDelete) { Icon(Icons.Default.Delete, "Delete page", tint = MaterialTheme.colorScheme.error) }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF292524), titleContentColor = Color.White,
                    navigationIconContentColor = Color.White, actionIconContentColor = Color.White)
            )
        }
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding)) {
            Row(
                Modifier.fillMaxWidth().background(Color(0xFF3B3430)).horizontalScroll(rememberScrollState()).padding(horizontal = 10.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically
            ) {
                Text("PAGE", color = Color(0xFFFBCFE8), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                papers.forEach { (id, label) ->
                    FilterChip(
                        selected = draft.paperTexture == id,
                        onClick = { draft = draft.copy(paperTexture = id) },
                        label = { Text(label, maxLines = 1) },
                        colors = FilterChipDefaults.filterChipColors(selectedContainerColor = Color(0xFFF9A8D4), selectedLabelColor = Color(0xFF3B1830))
                    )
                }
            }
            BlogWidgetsSummary(draft.blogMetadata, onClick = { showMoodSheet = true })

            Box(
                modifier = Modifier.weight(1f).fillMaxWidth().padding(horizontal = 10.dp, vertical = 8.dp)
                    .clip(RoundedCornerShape(8.dp)).background(paperColor(draft.paperTexture))
                    .border(1.dp, Color.Black.copy(alpha = 0.12f), RoundedCornerShape(8.dp))
                    .onSizeChanged { canvasSize = it }
            ) {
                PaperPattern(draft.paperTexture)
                Column(
                    Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 20.dp, vertical = 18.dp)
                ) {
                    OutlinedTextField(
                        value = draft.date,
                        onValueChange = { draft = draft.copy(date = it) },
                        label = { Text("Date / memory") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        textStyle = TextStyle(fontFamily = FontFamily.Monospace, fontSize = 12.sp, color = parseColor(draft.textColor))
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = draft.title,
                        onValueChange = { draft = draft.copy(title = it) },
                        placeholder = { Text("Give this page a title…") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = false,
                        textStyle = TextStyle(fontFamily = fontFor(draft.fontFamily), fontSize = 26.sp,
                            fontWeight = FontWeight.Bold, color = parseColor(draft.textColor)),
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedContainerColor = Color.White.copy(alpha = 0.24f),
                            focusedContainerColor = Color.White.copy(alpha = 0.32f),
                            unfocusedBorderColor = Color.Transparent, focusedBorderColor = Color(0xFFDB7093)
                        )
                    )
                    Spacer(Modifier.height(10.dp))
                    HorizontalDivider(color = parseColor(draft.textColor).copy(alpha = 0.18f))
                    Spacer(Modifier.height(12.dp))
                    OutlinedTextField(
                        value = draft.content,
                        onValueChange = { draft = draft.copy(content = it) },
                        placeholder = { Text("Start arranging your memory here…") },
                        modifier = Modifier.fillMaxWidth().defaultMinSize(minHeight = 320.dp),
                        textStyle = TextStyle(fontFamily = fontFor(draft.fontFamily),
                            fontSize = draft.fontSize.coerceIn(12, 36).sp,
                            color = parseColor(draft.textColor), lineHeight = (draft.fontSize.coerceIn(12, 36) * 1.65f).sp),
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedContainerColor = Color.White.copy(alpha = 0.12f),
                            focusedContainerColor = Color.White.copy(alpha = 0.2f),
                            unfocusedBorderColor = Color.Transparent, focusedBorderColor = Color(0xFFDB7093)
                        )
                    )
                    Spacer(Modifier.height(280.dp))
                }

                draft.tapes.sortedBy { it.zIndex }.forEach { tape ->
                    TapeItem(
                        tape = tape, selected = selectedTapeId == tape.id, canvasSize = canvasSize,
                        onSelect = { selectedTapeId = tape.id; selectedStickerId = null },
                        onMove = { dx, dy ->
                            draft = draft.copy(tapes = draft.tapes.map {
                                if (it.id == tape.id) it.copy(x = (it.x + dx).coerceIn(2f, 98f), y = (it.y + dy).coerceIn(2f, 98f)) else it
                            })
                        }
                    )
                }
                draft.stickers.sortedBy { it.zIndex }.forEach { sticker ->
                    StickerItem(
                        sticker = sticker, selected = selectedStickerId == sticker.id, canvasSize = canvasSize,
                        onSelect = { selectedStickerId = sticker.id; selectedTapeId = null },
                        onMove = { dx, dy ->
                            draft = draft.copy(stickers = draft.stickers.map {
                                if (it.id == sticker.id) it.copy(x = (it.x + dx).coerceIn(0f, 100f), y = (it.y + dy).coerceIn(0f, 100f)) else it
                            })
                        }
                    )
                }
            }

            val selectedSticker = draft.stickers.find { it.id == selectedStickerId }
            if (selectedSticker != null) {
                StickerPropertiesPanel(
                    sticker = selectedSticker,
                    onChange = { updated -> draft = draft.copy(stickers = draft.stickers.map { if (it.id == updated.id) updated else it }) },
                    onDelete = { draft = draft.copy(stickers = draft.stickers.filterNot { it.id == selectedSticker.id }); selectedStickerId = null },
                    onClose = { selectedStickerId = null }
                )
            }
            val selectedTape = draft.tapes.find { it.id == selectedTapeId }
            if (selectedTape != null) {
                TapePropertiesPanel(
                    tape = selectedTape,
                    onChange = { updated -> draft = draft.copy(tapes = draft.tapes.map { if (it.id == updated.id) updated else it }) },
                    onDelete = { draft = draft.copy(tapes = draft.tapes.filterNot { it.id == selectedTape.id }); selectedTapeId = null },
                    onClose = { selectedTapeId = null }
                )
            }
        }
    }

    if (showPageDesign) {
        ModalBottomSheet(onDismissRequest = { showPageDesign = false }) {
            Column(Modifier.fillMaxWidth().padding(20.dp).verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Text("Page typography", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Text("Font style", style = MaterialTheme.typography.labelLarge)
                Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("handwriting" to "Handwriting", "marker" to "Marker", "typewriter" to "Typewriter", "doodle" to "Doodle", "sans" to "Modern").forEach { (id, label) ->
                        FilterChip(selected = draft.fontFamily == id, onClick = { draft = draft.copy(fontFamily = id) }, label = { Text(label) })
                    }
                }
                Text("Body text size: ${draft.fontSize} sp", style = MaterialTheme.typography.labelLarge)
                Slider(value = draft.fontSize.coerceIn(12, 36).toFloat(), onValueChange = { draft = draft.copy(fontSize = it.roundToInt()) }, valueRange = 12f..36f, steps = 23)
                Text("Ink color", style = MaterialTheme.typography.labelLarge)
                Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    textColors.forEach { hex ->
                        Box(Modifier.size(36.dp).clip(CircleShape).background(parseColor(hex))
                            .border(if (draft.textColor.equals(hex, true)) 3.dp else 1.dp,
                                if (draft.textColor.equals(hex, true)) MaterialTheme.colorScheme.primary else Color.Gray, CircleShape)
                            .clickable { draft = draft.copy(textColor = hex) })
                    }
                }
                Text("Page paper can also be changed from the strip above the canvas.", style = MaterialTheme.typography.bodySmall)
                Button(onClick = { showPageDesign = false }, modifier = Modifier.fillMaxWidth()) { Text("Done") }
                Spacer(Modifier.height(16.dp))
            }
        }
    }

    if (showStickerSheet) {
        AddStickerSheet(
            onDismiss = { showStickerSheet = false },
            onPickImage = { imagePicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)); showStickerSheet = false },
            onAddEmoji = { emoji, label ->
                val highest = (draft.stickers.map { it.zIndex } + draft.tapes.map { it.zIndex }).maxOrNull() ?: 10
                val sticker = PlacedSticker(
                    id = newId("stk"), src = "emoji:$emoji", alt = label,
                    x = 35f, y = 30f, width = 96f, height = 96f, zIndex = highest + 1,
                    borderStyle = "diecut", borderWidth = 4, borderColor = "#ffffff", borderPattern = "solid"
                )
                draft = draft.copy(stickers = draft.stickers + sticker)
                selectedStickerId = sticker.id
                selectedTapeId = null
                showStickerSheet = false
            }
        )
    }
    if (showTapeSheet) {
        AddTapeSheet(
            onDismiss = { showTapeSheet = false },
            onAdd = { pattern, text ->
                val highest = (draft.stickers.map { it.zIndex } + draft.tapes.map { it.zIndex }).maxOrNull() ?: 10
                val tape = PlacedTape(id = newId("tape"), x = 40f, y = 20f, width = 170f, height = 34f,
                    pattern = pattern, text = text, zIndex = highest + 1)
                draft = draft.copy(tapes = draft.tapes + tape)
                selectedTapeId = tape.id
                selectedStickerId = null
                showTapeSheet = false
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
