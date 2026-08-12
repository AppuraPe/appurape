package com.appurape.app.core.data.local

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore by preferencesDataStore(name = "appurape_prefs")

@Singleton
class SessionManager @Inject constructor(
    private val context: Context
) {
    companion object {
        private val JWT_TOKEN_KEY = stringPreferencesKey("jwt_token")
        private val USER_ROLE_KEY = stringPreferencesKey("user_role")
        private val USER_EMAIL_KEY = stringPreferencesKey("user_email")
    }

    val tokenFlow: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[JWT_TOKEN_KEY]
    }

    val roleFlow: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[USER_ROLE_KEY]
    }

    val emailFlow: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[USER_EMAIL_KEY]
    }

    suspend fun saveSession(token: String, role: String, email: String) {
        context.dataStore.edit { preferences ->
            preferences[JWT_TOKEN_KEY] = token
            preferences[USER_ROLE_KEY] = role
            preferences[USER_EMAIL_KEY] = email
        }
    }

    suspend fun clearSession() {
        context.dataStore.edit { preferences ->
            preferences.remove(JWT_TOKEN_KEY)
            preferences.remove(USER_ROLE_KEY)
            preferences.remove(USER_EMAIL_KEY)
        }
    }
}
