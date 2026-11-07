package com.stitchandscrap.nativeapp.ui

import android.content.Context
import android.content.Intent
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.stitchandscrap.nativeapp.data.FirebaseAccountRepository
import com.stitchandscrap.nativeapp.data.ScrapbookRepository
import com.stitchandscrap.nativeapp.data.model.Journal
import com.stitchandscrap.nativeapp.data.model.JournalEntry
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class AppViewModel(
    private val repo: ScrapbookRepository,
    context: Context,
) : ViewModel() {
    private val account = FirebaseAccountRepository(context.applicationContext)
    val journals: StateFlow<List<Journal>> = repo.journals
    val entries: StateFlow<List<JournalEntry>> = repo.entries
    val ready: StateFlow<Boolean> = repo.ready

    private val _userEmail = MutableStateFlow(account.currentEmail())
    val userEmail: StateFlow<String?> = _userEmail.asStateFlow()
    private val _syncMessage = MutableStateFlow("Your journals are stored on this device.")
    val syncMessage: StateFlow<String> = _syncMessage.asStateFlow()
    private val _working = MutableStateFlow(false)
    val working: StateFlow<Boolean> = _working.asStateFlow()

    fun googleSignInIntent(context: Context) = account.googleSignInIntent()

    fun completeGoogleSignIn(data: Intent?) {
        viewModelScope.launch {
            _working.value = true
            _syncMessage.value = "Signing in…"
            runCatching { account.completeGoogleSignIn(data) }
                .onSuccess {
                    _userEmail.value = it
                    _syncMessage.value = "Signed in. Your local journals are unchanged."
                }
                .onFailure { _syncMessage.value = "Sign-in failed: ${it.message ?: "Please try again."}" }
            _working.value = false
        }
    }

    fun signOut() {
        viewModelScope.launch {
            _working.value = true
            runCatching { account.signOut() }
                .onSuccess {
                    _userEmail.value = null
                    _syncMessage.value = "Signed out. Your journals remain on this device."
                }
                .onFailure { _syncMessage.value = "Couldn't sign out: ${it.message ?: "Please try again."}" }
            _working.value = false
        }
    }

    fun backupToCloud() {
        viewModelScope.launch {
            _working.value = true
            _syncMessage.value = "Backing up journals…"
            runCatching { account.upload(journals.value, entries.value) }
                .onSuccess { _syncMessage.value = "Backup complete: ${journals.value.size} journals and ${entries.value.size} entries." }
                .onFailure { _syncMessage.value = "Backup failed: ${it.message ?: "Please try again."}" }
            _working.value = false
        }
    }

    fun restoreFromCloud() {
        viewModelScope.launch {
            _working.value = true
            _syncMessage.value = "Checking your cloud backup…"
            runCatching { account.download() }
                .onSuccess { (cloudJournals, cloudEntries) ->
                    if (cloudJournals.isEmpty() && cloudEntries.isEmpty()) {
                        _syncMessage.value = "No cloud backup was found. Your device data was not changed."
                    } else {
                        repo.replaceAll(cloudJournals, cloudEntries)
                        _syncMessage.value = "Restore complete: ${cloudJournals.size} journals and ${cloudEntries.size} entries."
                    }
                }
                .onFailure { _syncMessage.value = "Restore failed: ${it.message ?: "Please try again."}" }
            _working.value = false
        }
    }

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

class AppViewModelFactory(
    private val repo: ScrapbookRepository,
    private val context: Context,
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(AppViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return AppViewModel(repo, context) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
