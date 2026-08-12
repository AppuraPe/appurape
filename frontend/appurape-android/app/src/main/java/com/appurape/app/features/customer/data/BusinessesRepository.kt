package com.appurape.app.features.customer.data

import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BusinessesRepository @Inject constructor(
    private val businessesApi: BusinessesApi
) {
    suspend fun getBusinesses(
        query: String? = null,
        zoneId: String? = null,
        businessTypeId: String? = null,
        openNow: Boolean? = null,
        sort: String? = null
    ): Result<List<BusinessListItemResponse>> {
        return try {
            val response = businessesApi.getBusinesses(query, zoneId, businessTypeId, openNow, sort)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Error al cargar negocios"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getMobileHome(): Result<PublicBusinessMobileHomeResponse> {
        return try {
            val response = businessesApi.getMobileHome()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Error al cargar portada móvil"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getBusiness(id: String): Result<BusinessDetailResponse> {
        return try {
            val response = businessesApi.getBusiness(id)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Negocio no disponible"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getBusinessCatalog(id: String, query: String? = null): Result<CatalogResponse> {
        return try {
            val response = businessesApi.getBusinessCatalog(id, query)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("No se pudo cargar el menú"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
