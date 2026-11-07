package com.stitchandscrap.nativeapp.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.stitchandscrap.nativeapp.data.ScrapbookRepository
import com.stitchandscrap.nativeapp.data.model.Journal
import com.stitchandscrap.nativeapp.data.model.JournalEntry
import kotlinx.coroutines.flow.StateFlow

class AppViewModel(private val repo: ScrapbookRepository) : ViewModel() {
    val journals: StateFlow<List<Journal>> = repo.journals
    val entries: StateFlow<List<JournalEntry>> = repo.entries
    val ready: StateFlow<Boolean> = repo.ready

    fun entriesForJournal(journalId: String) = repo.entriesForJournal(journalId)
    fun getJournal(id: String) = repo.getJournal(id)
    fun getEntry(id: String) = repo.getEntry(id)

    fun createJournal(name: String, description: String, themeColor: String): Journal =
        repo.createJournal(name, description, themeColor)

    fun upsertJournal(journal: Journal) = repo.upsertJournal(journal)
    fun deleteJournal(id: String) = repo.deleteJournal(id)

    fun createEntry(journalId: String, paperTexture: String): JournalEntry =
        repo.createEntry(journalId, paperTexture)

    fun saveEntry(entry: JournalEntry) = repo.upsertEntry(entry)
    fun deleteEntry(id: String) = repo.deleteEntry(id)
}

class AppViewModelFactory(private val repo: ScrapbookRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(AppViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return AppViewModel(repo) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
