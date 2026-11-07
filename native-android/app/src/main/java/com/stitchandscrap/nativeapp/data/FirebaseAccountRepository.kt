package com.stitchandscrap.nativeapp.data

import android.content.Context
import android.content.Intent
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.firebase.FirebaseApp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.tasks.await
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.*
import com.stitchandscrap.nativeapp.BuildConfig
import com.stitchandscrap.nativeapp.R
import com.stitchandscrap.nativeapp.data.model.Journal
import com.stitchandscrap.nativeapp.data.model.JournalEntry

class FirebaseAccountRepository(private val context: Context) {
    private val auth = FirebaseAuth.getInstance()
    private val firestore = FirebaseFirestore.getInstance(
        FirebaseApp.getInstance(),
        BuildConfig.FIRESTORE_DATABASE_ID
    )
    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
        coerceInputValues = true
    }

    fun googleSignInIntent(): Intent {
        val options = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(context.getString(R.string.default_web_client_id))
            .requestEmail()
            .build()
        return GoogleSignIn.getClient(context, options).signInIntent
    }

    suspend fun completeGoogleSignIn(data: Intent?) = withContext(Dispatchers.IO) {
        val account = GoogleSignIn.getSignedInAccountFromIntent(data).await()
        val token = account.idToken ?: error("Google did not return an ID token. Check the Firebase Android app and OAuth setup.")
        val credential = GoogleAuthProvider.getCredential(token, null)
        auth.signInWithCredential(credential).await()
        auth.currentUser?.email ?: account.email ?: "Signed in"
    }

    suspend fun signOut() = withContext(Dispatchers.IO) {
        auth.signOut()
        GoogleSignIn.getClient(
            context,
            GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(context.getString(R.string.default_web_client_id))
                .requestEmail()
                .build()
        ).signOut().await()
    }

    fun currentEmail(): String? = auth.currentUser?.email

    suspend fun upload(journals: List<Journal>, entries: List<JournalEntry>) = withContext(Dispatchers.IO) {
        val uid = auth.currentUser?.uid ?: error("Sign in before backing up.")
        val batch = firestore.batch()
        journals.forEach { journal ->
            val ref = firestore.collection("users").document(uid).collection("journals").document(journal.id)
            batch.set(ref, toFirestoreMap(json.encodeToJsonElement(journal).jsonObject))
        }
        entries.forEach { entry ->
            val ref = firestore.collection("users").document(uid).collection("entries").document(entry.id)
            batch.set(ref, toFirestoreMap(json.encodeToJsonElement(entry).jsonObject))
        }
        batch.commit().await()
    }

    suspend fun download(): Pair<List<Journal>, List<JournalEntry>> = withContext(Dispatchers.IO) {
        val uid = auth.currentUser?.uid ?: error("Sign in before restoring.")
        val root = firestore.collection("users").document(uid)
        val journalDocs = root.collection("journals").get().await().documents
        val entryDocs = root.collection("entries").get().await().documents
        val journals = journalDocs.mapNotNull { doc ->
            runCatching {
                val fields = doc.data ?: return@runCatching null
                val withId = fields + ("id" to doc.id)
                json.decodeFromJsonElement<Journal>(fromFirestoreValue(withId))
            }.getOrNull()
        }
        val entries = entryDocs.mapNotNull { doc ->
            runCatching {
                val fields = doc.data ?: return@runCatching null
                val withId = fields + ("id" to doc.id)
                json.decodeFromJsonElement<JournalEntry>(fromFirestoreValue(withId))
            }.getOrNull()
        }
        journals to entries
    }

    private fun toFirestoreMap(value: JsonObject): Map<String, Any?> =
        value.mapValues { (_, element) -> toFirestoreValue(element) }

    private fun toFirestoreValue(value: JsonElement): Any? = when (value) {
        JsonNull -> null
        is JsonObject -> toFirestoreMap(value)
        is JsonArray -> value.map { toFirestoreValue(it) }
        is JsonPrimitive -> when {
            value.isString -> value.content
            value.booleanOrNull != null -> value.boolean
            value.longOrNull != null -> value.long
            value.doubleOrNull != null -> value.double
            else -> value.content
        }
    }

    private fun fromFirestoreValue(value: Any?): JsonElement = when (value) {
        null -> JsonNull
        is Map<*, *> -> JsonObject(value.entries.associate { (key, item) ->
            key.toString() to fromFirestoreValue(item)
        })
        is List<*> -> JsonArray(value.map { fromFirestoreValue(it) })
        is Boolean -> JsonPrimitive(value)
        is Number -> JsonPrimitive(value)
        else -> JsonPrimitive(value.toString())
    }
}
