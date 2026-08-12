package com.appurape.app.features.customer.data

import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface BusinessesApi {

    @GET("api/businesses")
    suspend fun getBusinesses(
        @Query("q") query: String? = null,
        @Query("zoneId") zoneId: String? = null,
        @Query("businessTypeId") businessTypeId: String? = null,
        @Query("openNow") openNow: Boolean? = null,
        @Query("sort") sort: String? = null
    ): Response<List<BusinessListItemResponse>>

    @GET("api/businesses/mobile-home")
    suspend fun getMobileHome(): Response<PublicBusinessMobileHomeResponse>

    @GET("api/businesses/{id}")
    suspend fun getBusiness(
        @Path("id") id: String
    ): Response<BusinessDetailResponse>

    @GET("api/businesses/{id}/catalog")
    suspend fun getBusinessCatalog(
        @Path("id") id: String,
        @Query("q") query: String? = null
    ): Response<CatalogResponse>
}
