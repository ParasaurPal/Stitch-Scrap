package com.stitchandscrap.nativeapp.data

import android.content.Context
import com.stitchandscrap.nativeapp.data.local.JsonStore
import com.stitchandscrap.nativeapp.data.model.Journal
import com.stitchandscrap.nativeapp.data.model.JournalEntry
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.time.Instant
import java.util.UUID

class ScrapbookRepository(context: Context) {
    private val store = JsonStore(context.applicationContext)
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val mutex = Mutex()

    private val _journals = MutableStateFlow<List<Journal>>(emptyList())
    val journals: StateFlow<List<Journal>> = _journals.asStateFlow()

    private val _entries = MutableStateFlow<List<JournalEntry>>(emptyList())
    val entries: StateFlow<List<JournalEntry>> = _entries.asStateFlow()

    private val _ready = MutableStateFlow(false)
    val ready: StateFlow<Boolean> = _ready.asStateFlow()

    init {
        scope.launch { load() }
    }

    private suspend fun load() = mutex.withLock {
        val journals = store.read("journals.json") { DefaultContent.journals() }
        val entries = store.read("entries.json") { DefaultContent.entries() }
        _journals.value = journals
        _entries.value = entries
        // Persist defaults if first run created them
        store.write("journals.json", journals)
        store.write("entries.json", entries)
        _ready.value = true
    }

    private suspend fun persist() {
        store.write("journals.json", _journals.value)
        store.write("entries.json", _entries.value)
    }

    fun entriesForJournal(journalId: String): List<JournalEntry> =
        _entries.value.filter { it.journalId == journalId }
            .sortedByDescending { it.updatedAt.ifBlank { it.createdAt } }

    fun getEntry(id: String): JournalEntry? = _entries.value.find { it.id == id }
    fun getJournal(id: String): Journal? = _journals.value.find { it.id == id }

    fun newId(prefix: String): String = "$prefix-${UUID.randomUUID().toString().take(10)}"
    fun now(): String = Instant.now().toString()

    fun upsertJournal(journal: Journal) {
        scope.launch {
            mutex.withLock {
                val list = _journals.value.toMutableList()
                val idx = list.indexOfFirst { it.id == journal.id }
                if (idx >= 0) list[idx] = journal else list.add(0, journal)
                _journals.value = list
                persist()
            }
        }
    }

    fun deleteJournal(id: String) {
        scope.launch {
            mutex.withLock {
                _journals.value = _journals.value.filterNot { it.id == id }
                _entries.value = _entries.value.filterNot { it.journalId == id }
                persist()
            }
        }
    }

    fun upsertEntry(entry: JournalEntry) {
        scope.launch {
            mutex.withLock {
                val updated = entry.copy(updatedAt = now())
                val list = _entries.value.toMutableList()
                val idx = list.indexOfFirst { it.id == updated.id }
                if (idx >= 0) list[idx] = updated else list.add(0, updated)
                _entries.value = list
                persist()
            }
        }
    }

    fun deleteEntry(id: String) {
        scope.launch {
            mutex.withLock {
                _entries.value = _entries.value.filterNot { it.id == id }
                persist()
            }
        }
    }

    fun createEntry(journalId: String, paperTexture: String): JournalEntry {
        val entry = JournalEntry(
            id = newId("entry"),
            journalId = journalId,
            title = "New Entry",
            date = java.time.LocalDate.now().toString(),
            content = "",
            paperTexture = paperTexture,
            createdAt = now(),
            updatedAt = now(),
        )
        upsertEntry(entry)
        return entry
    }

    fun createJournal(name: String, description: String, themeColor: String): Journal {
        val journal = Journal(
            id = newId("journal"),
            name = name.ifBlank { "My Journal" },
            description = description,
            themeColor = themeColor,
            defaultPaper = "lined",
            coverPattern = "📓",
            createdAt = now(),
        )
        upsertJournal(journal)
        return journal
    }
}
