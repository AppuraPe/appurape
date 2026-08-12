package com.appurape.app.features.customer.data

import com.google.gson.annotations.SerializedName

data class BusinessListItemResponse(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("description") val description: String,
    @SerializedName("address") val address: String,
    @SerializedName("reference") val reference: String,
    @SerializedName("zoneId") val zoneId: String,
    @SerializedName("zoneName") val zoneName: String,
    @SerializedName("businessTypeId") val businessTypeId: String?,
    @SerializedName("businessTypeName") val businessTypeName: String?,
    @SerializedName("openTime") val openTime: String,
    @SerializedName("closeTime") val closeTime: String,
    @SerializedName("logoUrl") val logoUrl: String?,
    @SerializedName("isOpenNow") val isOpenNow: Boolean
)

data class BusinessTypeListItemResponse(
    @SerializedName("id") val id: String,
    @SerializedName("code") val code: String,
    @SerializedName("name") val name: String,
    @SerializedName("slug") val slug: String,
    @SerializedName("iconKey") val iconKey: String?,
    @SerializedName("sortOrder") val sortOrder: Int,
    @SerializedName("businessCount") val businessCount: Int
)

data class BusinessCategorySectionResponse(
    @SerializedName("category") val category: BusinessTypeListItemResponse,
    @SerializedName("totalBusinesses") val totalBusinesses: Int,
    @SerializedName("businesses") val businesses: List<BusinessListItemResponse>
)

data class PublicBusinessMobileHomeResponse(
    @SerializedName("categories") val categories: List<BusinessTypeListItemResponse>,
    @SerializedName("popularCategories") val popularCategories: List<BusinessTypeListItemResponse>,
    @SerializedName("sections") val sections: List<BusinessCategorySectionResponse>
)

data class MenuItemResponse(
    @SerializedName("id") val id: String,
    @SerializedName("restaurantId") val restaurantId: String,
    @SerializedName("categoryId") val categoryId: String,
    @SerializedName("categoryName") val categoryName: String,
    @SerializedName("name") val name: String,
    @SerializedName("description") val description: String,
    @SerializedName("price") val price: Double,
    @SerializedName("imageUrl") val imageUrl: String?,
    @SerializedName("trackStock") val trackStock: Boolean,
    @SerializedName("stockQuantity") val stockQuantity: Int?,
    @SerializedName("hasStock") val hasStock: Boolean,
    @SerializedName("isAvailable") val isAvailable: Boolean,
    @SerializedName("isActive") val isActive: Boolean
)

data class PublicMenuCategoryResponse(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("sortOrder") val sortOrder: Int,
    @SerializedName("items") val items: List<MenuItemResponse>
)

data class CatalogResponse(
    @SerializedName("restaurantId") val restaurantId: String,
    @SerializedName("restaurantName") val restaurantName: String,
    @SerializedName("categories") val categories: List<PublicMenuCategoryResponse>
)

data class BusinessDetailResponse(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("description") val description: String,
    @SerializedName("address") val address: String,
    @SerializedName("reference") val reference: String,
    @SerializedName("zoneId") val zoneId: String,
    @SerializedName("zoneName") val zoneName: String,
    @SerializedName("businessTypeId") val businessTypeId: String?,
    @SerializedName("businessTypeName") val businessTypeName: String?,
    @SerializedName("openTime") val openTime: String,
    @SerializedName("closeTime") val closeTime: String,
    @SerializedName("logoUrl") val logoUrl: String?,
    @SerializedName("isActive") val isActive: Boolean,
    @SerializedName("approvalStatus") val approvalStatus: String
)
