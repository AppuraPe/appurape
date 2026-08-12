package com.appurape.app.features.auth.data

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String
)

data class GoogleLoginRequest(
    @SerializedName("idToken") val idToken: String
)

data class AuthResponse(
    @SerializedName("token") val token: String,
    @SerializedName("userId") val userId: String,
    @SerializedName("fullName") val fullName: String,
    @SerializedName("email") val email: String,
    @SerializedName("role") val role: String,
    @SerializedName("status") val status: String,
    @SerializedName("hasCustomerProfile") val hasCustomerProfile: Boolean? = false,
    @SerializedName("hasBusinessProfile") val hasBusinessProfile: Boolean? = false,
    @SerializedName("hasDriverProfile") val hasDriverProfile: Boolean? = false,
    @SerializedName("hasCollaboratorProfile") val hasCollaboratorProfile: Boolean? = false
)
