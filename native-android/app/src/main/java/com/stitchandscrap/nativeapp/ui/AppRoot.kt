package com.stitchandscrap.nativeapp.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.stitchandscrap.nativeapp.ui.screens.EditorScreen
import com.stitchandscrap.nativeapp.ui.screens.EntriesScreen
import com.stitchandscrap.nativeapp.ui.screens.JournalsScreen

@Composable
fun AppRoot(vm: AppViewModel) {
    val nav = rememberNavController()
    val journals by vm.journals.collectAsState()
    val entries by vm.entries.collectAsState()
    val ready by vm.ready.collectAsState()

    NavHost(navController = nav, startDestination = "journals") {
        composable("journals") {
            JournalsScreen(
                journals = journals,
                ready = ready,
                onOpen = { id -> nav.navigate("entries/$id") },
                onCreate = { name, desc, color -> vm.createJournal(name, desc, color) },
                onDelete = { vm.deleteJournal(it) },
            )
        }
        composable(
            "entries/{journalId}",
            arguments = listOf(navArgument("journalId") { type = NavType.StringType })
        ) { back ->
            val journalId = back.arguments?.getString("journalId").orEmpty()
            val journal = vm.getJournal(journalId) ?: journals.find { it.id == journalId }
            EntriesScreen(
                journal = journal,
                entries = entries.filter { it.journalId == journalId }
                    .sortedByDescending { it.updatedAt.ifBlank { it.createdAt } },
                onBack = { nav.popBackStack() },
                onOpenEntry = { entryId -> nav.navigate("editor/$entryId") },
                onCreateEntry = {
                    val e = vm.createEntry(journalId, journal?.defaultPaper ?: "lined")
                    nav.navigate("editor/${e.id}")
                },
                onDeleteEntry = { vm.deleteEntry(it) },
            )
        }
        composable(
            "editor/{entryId}",
            arguments = listOf(navArgument("entryId") { type = NavType.StringType })
        ) { back ->
            val entryId = back.arguments?.getString("entryId").orEmpty()
            val entry = vm.getEntry(entryId) ?: entries.find { it.id == entryId }
            if (entry != null) {
                EditorScreen(
                    entry = entry,
                    journal = vm.getJournal(entry.journalId),
                    onBack = { nav.popBackStack() },
                    onSave = { vm.saveEntry(it) },
                    onDelete = {
                        vm.deleteEntry(entry.id)
                        nav.popBackStack()
                    },
                )
            }
        }
    }
}
