package com.stitchandscrap.nativeapp.ui.screens

import android.net.Uri
import android.content.Context
import android.graphics.BitmapFactory
import android.graphics.Paint as AndroidPaint
import android.graphics.RectF
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
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
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.stitchandscrap.nativeapp.data.createDieCutSticker
import com.stitchandscrap.nativeapp.data.StickerAiClient
import com.stitchandscrap.nativeapp.data.model.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.UUID
import kotlin.math.roundToInt

private data class CanvasLayer(val zIndex: Int, val id: String, val isTape: Boolean)

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

private fun exportScrapbookPdf(context: Context, uri: Uri, entry: JournalEntry) {
    val document = PdfDocument()
    try {
        val pageInfo = PdfDocument.PageInfo.Builder(595, 842, 1).create()
        val page = document.startPage(pageInfo)
        val canvas = page.canvas
        val paper = when (entry.paperTexture) {
            "night" -> android.graphics.Color.rgb(31, 34, 48)
            "kraft", "vintage-torn-collage" -> android.graphics.Color.rgb(245, 230, 200)
            "blush", "pink-grid-wavy", "strawberry-gingham" -> android.graphics.Color.rgb(255, 242, 247)
            "lavender-grid-wavy" -> android.graphics.Color.rgb(248, 244, 255)
            else -> android.graphics.Color.rgb(255, 253, 247)
        }
        canvas.drawColor(paper)
        val dark = entry.paperTexture == "night"
        val ink = runCatching { android.graphics.Color.parseColor(entry.textColor) }
            .getOrDefault(if (dark) android.graphics.Color.WHITE else android.graphics.Color.rgb(55, 45, 40))
        val paint = AndroidPaint(AndroidPaint.ANTI_ALIAS_FLAG).apply { color = ink }
        val guide = AndroidPaint(AndroidPaint.ANTI_ALIAS_FLAG).apply {
            color = if (dark) 0x33FFFFFF else 0x228A7568
            strokeWidth = 0.7f
        }
        when (entry.paperTexture) {
            "lined", "blush" -> {
                var y = 42f
                while (y < 842f) { canvas.drawLine(30f, y, 565f, y, guide); y += 27f }
            }
            "grid", "math-grid-stars", "lavender-grid-wavy" -> {
                var x = 30f
                while (x < 595f) { canvas.drawLine(x, 0f, x, 842f, guide); x += 24f }
                var y = 24f
                while (y < 842f) { canvas.drawLine(0f, y, 595f, y, guide); y += 24f }
            }
            "dot" -> {
                var y = 12f
                while (y < 842f) {
                    var x = 12f
                    while (x < 595f) { canvas.drawCircle(x, y, 1.1f, guide); x += 24f }
                    y += 24f
                }
            }
        }

        val titlePaint = AndroidPaint(AndroidPaint.ANTI_ALIAS_FLAG).apply {
            color = ink; textSize = 27f; typeface = Typeface.create("casual", Typeface.BOLD)
        }
        val datePaint = AndroidPaint(AndroidPaint.ANTI_ALIAS_FLAG).apply {
            color = ink; alpha = 180; textSize = 11f; typeface = Typeface.create(Typeface.MONOSPACE, Typeface.NORMAL)
        }
        canvas.drawText(entry.date.take(70), 42f, 54f, datePaint)
        val title = entry.title.ifBlank { "Untitled scrapbook page" }
        val titleLayout = StaticLayout.Builder.obtain(title, 0, title.length,
            TextPaint(titlePaint), 510).setAlignment(Layout.Alignment.ALIGN_NORMAL)
            .setIncludePad(false).build()
        canvas.save()
        canvas.translate(42f, 72f)
        titleLayout.draw(canvas)
        canvas.restore()

        val bodyStyle = (if (entry.isBold) Typeface.BOLD else Typeface.NORMAL) or
            (if (entry.isItalic) Typeface.ITALIC else Typeface.NORMAL)
        val bodyPaint = TextPaint(AndroidPaint.ANTI_ALIAS_FLAG).apply {
            color = ink
            textSize = entry.fontSize.coerceIn(12, 36).toFloat()
            typeface = when (entry.fontFamily) {
                "typewriter" -> Typeface.create(Typeface.MONOSPACE, bodyStyle)
                "marker" -> Typeface.create("sans-serif-condensed", bodyStyle)
                "sans" -> Typeface.create(Typeface.SANS_SERIF, bodyStyle)
                else -> Typeface.create("casual", bodyStyle)
            }
            if (entry.isUnderlined) flags = flags or AndroidPaint.UNDERLINE_TEXT_FLAG
        }
        val body = entry.content.replace(Regex("<[^>]*>"), "").ifBlank { " " }
        val bodyLayout = StaticLayout.Builder.obtain(body, 0, body.length, bodyPaint, 510)
            .setAlignment(Layout.Alignment.ALIGN_NORMAL).setLineSpacing(7f, 1.12f)
            .setIncludePad(false).build()
        canvas.save()
        canvas.translate(42f, 160f)
        bodyLayout.draw(canvas)
        canvas.restore()

        entry.tapes.sortedBy { it.zIndex }.forEach { tape ->
            val cx = tape.x / 100f * 595f
            val cy = tape.y / 100f * 842f
            val rect = RectF(cx - tape.width * 0.65f, cy - tape.height * 0.65f,
                cx + tape.width * 0.65f, cy + tape.height * 0.65f)
            val tapePaint = AndroidPaint(AndroidPaint.ANTI_ALIAS_FLAG).apply {
                color = when (tape.pattern) {
                    "dots" -> android.graphics.Color.rgb(251, 207, 232)
                    "stripes", "caution" -> android.graphics.Color.rgb(253, 230, 138)
                    "kraft" -> android.graphics.Color.rgb(231, 211, 176)
                    "lavender" -> android.graphics.Color.rgb(221, 214, 254)
                    "cyan" -> android.graphics.Color.rgb(165, 243, 252)
                    "frosted" -> android.graphics.Color.rgb(235, 240, 245)
                    else -> android.graphics.Color.rgb(233, 213, 255)
                }
                alpha = (tape.opacity.coerceIn(0f, 1f) * 255).toInt()
            }
            canvas.save()
            canvas.rotate(tape.rotation, cx, cy)
            canvas.drawRoundRect(rect, 5f, 5f, tapePaint)
            val tapeTextPaint = AndroidPaint(AndroidPaint.ANTI_ALIAS_FLAG).apply {
                color = runCatching { android.graphics.Color.parseColor(tape.textColor) }.getOrDefault(android.graphics.Color.DKGRAY)
                textSize = 13f
                typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
                textAlign = AndroidPaint.Align.CENTER
            }
            canvas.drawText(tape.text.take(36), cx, cy + 4f, tapeTextPaint)
            canvas.restore()
        }

        entry.stickers.sortedBy { it.zIndex }.forEach { sticker ->
            val cx = sticker.x / 100f * 595f
            val cy = sticker.y / 100f * 842f
            val w = sticker.width * sticker.scale * 1.15f
            val h = sticker.height * sticker.scale * 1.15f
            canvas.save()
            canvas.rotate(sticker.rotation, cx, cy)
            if (sticker.src.startsWith("emoji:")) {
                val emojiPaint = AndroidPaint(AndroidPaint.ANTI_ALIAS_FLAG).apply {
                    textSize = minOf(w, h).coerceAtLeast(24f) * 0.8f
                    textAlign = AndroidPaint.Align.CENTER
                }
                canvas.drawText(sticker.src.removePrefix("emoji:"), cx, cy + emojiPaint.textSize * 0.32f, emojiPaint)
            } else {
                runCatching {
                    val stickerUri = Uri.parse(sticker.src)
                    if (stickerUri.scheme == "file") stickerUri.path?.let { BitmapFactory.decodeFile(it) }
                    else context.contentResolver.openInputStream(stickerUri)?.use { BitmapFactory.decodeStream(it) }
                }.getOrNull()?.let { bitmap ->
                    val dst = RectF(cx - w / 2f, cy - h / 2f, cx + w / 2f, cy + h / 2f)
                    canvas.drawBitmap(bitmap, null, dst, AndroidPaint(AndroidPaint.ANTI_ALIAS_FLAG))
                    bitmap.recycle()
                }
            }
            canvas.restore()
        }
        document.finishPage(page)
        context.contentResolver.openOutputStream(uri)?.use { output -> document.writeTo(output) }
            ?: throw IllegalStateException("Could not open the selected PDF destination.")
    } finally {
        document.close()
    }
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
    var processingStickerId by remember { mutableStateOf<String?>(null) }
    var processingAiStickerId by remember { mutableStateOf<String?>(null) }
    var generatingAiSticker by remember { mutableStateOf(false) }
    var aiStickerError by remember { mutableStateOf<String?>(null) }
    val coroutineScope = rememberCoroutineScope()
    var showStickerSheet by remember { mutableStateOf(false) }
    var showTapeSheet by remember { mutableStateOf(false) }
    var showMoodSheet by remember { mutableStateOf(false) }
    var showPageDesign by remember { mutableStateOf(false) }
    var canvasSize by remember { mutableStateOf(IntSize.Zero) }
    val context = LocalContext.current
    val stickerPreferences = remember { context.getSharedPreferences("stitch_scrap_sticker_library", Context.MODE_PRIVATE) }
    var aiServerUrl by remember {
        mutableStateOf(stickerPreferences.getString("ai_server_url", "").orEmpty())
    }
    var savedStickerPhotos by remember {
        mutableStateOf(stickerPreferences.getStringSet("saved_photos", emptySet())?.toList().orEmpty())
    }
    val pdfLauncher = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/pdf")) { uri ->
        if (uri != null) {
            runCatching { exportScrapbookPdf(context, uri, draft) }
                .onSuccess { android.widget.Toast.makeText(context, "Scrapbook PDF saved", android.widget.Toast.LENGTH_LONG).show() }
                .onFailure {
                    android.util.Log.e("StitchScrap", "PDF export failed", it)
                    android.widget.Toast.makeText(context, "Could not export PDF: ${it.message ?: "unknown error"}",
                        android.widget.Toast.LENGTH_LONG).show()
                }
        }
    }
    val textColors = listOf("#292524", "#7F1D1D", "#9D174D", "#6B21A8", "#1D4ED8", "#166534", "#FFFFFF")
    val papers = listOf(
        "lined" to "Notebook", "grid" to "Math grid", "dot" to "Dot grid",
        "blush" to "Blush", "kraft" to "Kraft", "night" to "Night",
        "lavender-grid-wavy" to "Lavender", "strawberry-gingham" to "Gingham",
        "vintage-torn-collage" to "Vintage"
    )

    fun save() = onSave(draft)

    // Persist edits shortly after typing so leaving the editor or an app interruption
    // does not discard the current page draft.
    LaunchedEffect(draft) {
        delay(500)
        onSave(draft)
    }

    val imagePicker = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri: Uri? ->
        uri?.let {
            runCatching {
                context.contentResolver.takePersistableUriPermission(it, android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            savedStickerPhotos = (savedStickerPhotos + it.toString()).distinct()
            stickerPreferences.edit().putStringSet("saved_photos", savedStickerPhotos.toSet()).apply()
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
                    TextButton(onClick = {
                        val safeName = draft.title.ifBlank { "scrapbook-page" }.replace(Regex("[^A-Za-z0-9 _-]"), "").trim().ifBlank { "scrapbook-page" }
                        pdfLauncher.launch("$safeName.pdf")
                    }) { Text("PDF", color = Color.White, fontWeight = FontWeight.Bold) }
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
                    Row(
                        Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(7.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        FilterChip(selected = draft.isBold, onClick = { draft = draft.copy(isBold = !draft.isBold) },
                            label = { Text("B", fontWeight = FontWeight.Bold) })
                        FilterChip(selected = draft.isItalic, onClick = { draft = draft.copy(isItalic = !draft.isItalic) },
                            label = { Text("I", fontStyle = FontStyle.Italic) })
                        FilterChip(selected = draft.isUnderlined, onClick = { draft = draft.copy(isUnderlined = !draft.isUnderlined) },
                            label = { Text("U", textDecoration = TextDecoration.Underline) })
                        Text("BODY STYLE", style = MaterialTheme.typography.labelSmall,
                            color = Color(0xFF8B756A), fontWeight = FontWeight.Bold)
                    }
                    OutlinedTextField(
                        value = draft.content,
                        onValueChange = { draft = draft.copy(content = it) },
                        placeholder = { Text("Start arranging your memory here…") },
                        modifier = Modifier.fillMaxWidth().defaultMinSize(minHeight = 320.dp),
                        textStyle = TextStyle(fontFamily = fontFor(draft.fontFamily),
                            fontSize = draft.fontSize.coerceIn(12, 36).sp,
                            fontWeight = if (draft.isBold) FontWeight.Bold else FontWeight.Normal,
                            fontStyle = if (draft.isItalic) FontStyle.Italic else FontStyle.Normal,
                            textDecoration = if (draft.isUnderlined) TextDecoration.Underline else TextDecoration.None,
                            color = parseColor(draft.textColor), lineHeight = (draft.fontSize.coerceIn(12, 36) * 1.65f).sp),
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedContainerColor = Color.White.copy(alpha = 0.12f),
                            focusedContainerColor = Color.White.copy(alpha = 0.2f),
                            unfocusedBorderColor = Color.Transparent, focusedBorderColor = Color(0xFFDB7093)
                        )
                    )
                    Spacer(Modifier.height(280.dp))
                }

                val layers = (draft.tapes.map { CanvasLayer(it.zIndex, it.id, true) } +
                    draft.stickers.map { CanvasLayer(it.zIndex, it.id, false) }).sortedBy { it.zIndex }
                layers.forEach { layer ->
                    if (layer.isTape) {
                        val tape = draft.tapes.find { it.id == layer.id }
                        if (tape != null) TapeItem(
                            tape = tape, selected = selectedTapeId == tape.id, canvasSize = canvasSize,
                            onSelect = { selectedTapeId = tape.id; selectedStickerId = null },
                            onMove = { dx, dy ->
                                draft = draft.copy(tapes = draft.tapes.map {
                                    if (it.id == tape.id) it.copy(x = (it.x + dx).coerceIn(2f, 98f), y = (it.y + dy).coerceIn(2f, 98f)) else it
                                })
                            }
                        )
                    } else {
                        val sticker = draft.stickers.find { it.id == layer.id }
                        if (sticker != null) StickerItem(
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
            }

            val selectedSticker = draft.stickers.find { it.id == selectedStickerId }
            if (selectedSticker != null) {
                StickerPropertiesPanel(
                    sticker = selectedSticker,
                    onChange = { updated -> draft = draft.copy(stickers = draft.stickers.map { if (it.id == updated.id) updated else it }) },
                    onDelete = { draft = draft.copy(stickers = draft.stickers.filterNot { it.id == selectedSticker.id }); selectedStickerId = null },
                    onDuplicate = {
                        val highest = (draft.stickers.map { it.zIndex } + draft.tapes.map { it.zIndex }).maxOrNull() ?: 10
                        val copy = selectedSticker.copy(id = newId("stk"),
                            x = (selectedSticker.x + 5f).coerceAtMost(95f),
                            y = (selectedSticker.y + 5f).coerceAtMost(95f), zIndex = highest + 1)
                        draft = draft.copy(stickers = draft.stickers + copy)
                        selectedStickerId = copy.id
                    },
                    onCutout = { threshold, borderWidth ->
                        coroutineScope.launch {
                            processingStickerId = selectedSticker.id
                            val processed = createDieCutSticker(context, selectedSticker.src, threshold, borderWidth)
                            if (processed != null) {
                                draft = draft.copy(stickers = draft.stickers.map {
                                    if (it.id == selectedSticker.id) it.copy(src = processed, borderStyle = "none", borderWidth = 0) else it
                                })
                                android.widget.Toast.makeText(context, "Background removed — sticker saved", android.widget.Toast.LENGTH_SHORT).show()
                            } else {
                                android.widget.Toast.makeText(context, "Could not cut out this image. Try a photo with a simpler background.",
                                    android.widget.Toast.LENGTH_LONG).show()
                            }
                            processingStickerId = null
                        }
                    },
                    isProcessing = processingStickerId == selectedSticker.id,
                    onAiCutout = {
                        coroutineScope.launch {
                            processingAiStickerId = selectedSticker.id
                            aiStickerError = null
                            runCatching { StickerAiClient.removeBackground(context, aiServerUrl, selectedSticker.src) }
                                .onSuccess { processed ->
                                    draft = draft.copy(stickers = draft.stickers.map {
                                        if (it.id == selectedSticker.id) it.copy(src = processed, borderStyle = "none", borderWidth = 0) else it
                                    })
                                    savedStickerPhotos = (savedStickerPhotos + processed).distinct()
                                    stickerPreferences.edit().putStringSet("saved_photos", savedStickerPhotos.toSet()).apply()
                                    android.widget.Toast.makeText(context, "Gemini cutout saved to your sticker collection", android.widget.Toast.LENGTH_LONG).show()
                                }
                                .onFailure {
                                    android.widget.Toast.makeText(context, it.message ?: "Gemini cutout failed", android.widget.Toast.LENGTH_LONG).show()
                                }
                            processingAiStickerId = null
                        }
                    },
                    isAiProcessing = processingAiStickerId == selectedSticker.id,
                    aiConfigured = aiServerUrl.startsWith("http"),
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
            savedPhotos = savedStickerPhotos,
            aiServerUrl = aiServerUrl,
            onAiServerUrlChange = {
                aiServerUrl = it
                stickerPreferences.edit().putString("ai_server_url", it.trim()).apply()
            },
            isGeneratingAi = generatingAiSticker,
            aiError = aiStickerError,
            onGenerateAi = { prompt ->
                coroutineScope.launch {
                    generatingAiSticker = true
                    aiStickerError = null
                    runCatching { StickerAiClient.generateSticker(context, aiServerUrl, prompt) }
                        .onSuccess { generated ->
                            val highest = (draft.stickers.map { it.zIndex } + draft.tapes.map { it.zIndex }).maxOrNull() ?: 10
                            val sticker = PlacedSticker(
                                id = newId("ai"), src = generated, alt = prompt.take(80),
                                x = 40f, y = 35f, width = 140f, height = 140f, zIndex = highest + 1,
                                borderStyle = "diecut", borderWidth = 4, borderColor = "#ffffff",
                                borderPattern = "solid", texture = "glossy"
                            )
                            draft = draft.copy(stickers = draft.stickers + sticker)
                            savedStickerPhotos = (savedStickerPhotos + generated).distinct()
                            stickerPreferences.edit().putStringSet("saved_photos", savedStickerPhotos.toSet()).apply()
                            selectedStickerId = sticker.id
                            selectedTapeId = null
                            showStickerSheet = false
                            android.widget.Toast.makeText(context, "AI sticker added to your page and collection", android.widget.Toast.LENGTH_LONG).show()
                        }
                        .onFailure { aiStickerError = it.message ?: "AI sticker generation failed" }
                    generatingAiSticker = false
                }
            },
            onAddSavedPhoto = { src ->
                val highest = (draft.stickers.map { it.zIndex } + draft.tapes.map { it.zIndex }).maxOrNull() ?: 10
                val sticker = PlacedSticker(
                    id = newId("stk"), src = src, alt = "Saved photo sticker",
                    x = 40f, y = 35f, width = 140f, height = 140f, zIndex = highest + 1,
                    borderStyle = "diecut", borderWidth = 4, borderColor = "#ffffff",
                    borderPattern = "solid", texture = "glossy"
                )
                draft = draft.copy(stickers = draft.stickers + sticker)
                selectedStickerId = sticker.id
                selectedTapeId = null
                showStickerSheet = false
            },
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
            onAdd = { pattern, text, textColor, fontFamily ->
                val highest = (draft.stickers.map { it.zIndex } + draft.tapes.map { it.zIndex }).maxOrNull() ?: 10
                val tape = PlacedTape(id = newId("tape"), x = 40f, y = 20f, width = 190f, height = 38f,
                    pattern = pattern, text = text, textColor = textColor, fontFamily = fontFamily, zIndex = highest + 1)
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
