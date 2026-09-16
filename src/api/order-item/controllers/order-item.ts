
import { factories } from "@strapi/strapi";

export default factories.createCoreController(
    "api::order-item.order-item",
    ({ strapi }) => ({


        // =====================================================
        // CREATE ORDER ITEM
        // =====================================================

        async create(ctx) {
            try {
                const { data } = ctx.request.body;

                console.log("=================================");
                console.log("ORDER ITEM REQUEST:", data);
                console.log("=================================");

                if (!data) {
                    return ctx.badRequest("Missing data");
                }

                const {
                    // Old / explicit fields
                    productId,
                    orderId,
                    productDocumentId,
                    orderDocumentId,

                    // Current POS fields
                    product,
                    order,

                    quantity,
                    price,
                    total,
                } = data;

                // =====================================================
                // RESOLVE PRODUCT IDENTIFIER
                // =====================================================

                const resolvedProductId =
                    productId || product || null;

                const resolvedProductDocumentId =
                    productDocumentId || null;

                console.log("PRODUCT IDENTIFIERS:", {
                    productId,
                    product,
                    productDocumentId,
                    resolvedProductId,
                    resolvedProductDocumentId,
                });

                // =====================================================
                // FIND PRODUCT
                // =====================================================

                let foundProduct = null;

                // -----------------------------------------------------
                // 1. Try documentId first
                // -----------------------------------------------------

                if (resolvedProductDocumentId) {
                    foundProduct = await strapi.db
                        .query("api::product.product")
                        .findOne({
                            where: {
                                documentId: resolvedProductDocumentId,
                            },
                        });
                }

                // -----------------------------------------------------
                // 2. Try numeric ID
                // -----------------------------------------------------

                if (!foundProduct && resolvedProductId) {
                    foundProduct = await strapi.db
                        .query("api::product.product")
                        .findOne({
                            where: {
                                id: Number(resolvedProductId),
                            },
                        });
                }

                // -----------------------------------------------------
                // Product not found
                // -----------------------------------------------------

                if (!foundProduct) {
                    console.error("❌ PRODUCT NOT FOUND:", {
                        productId,
                        product,
                        productDocumentId,
                    });

                    return ctx.notFound("Product not found");
                }

                console.log("✅ PRODUCT FOUND:", {
                    id: foundProduct.id,
                    documentId: foundProduct.documentId,
                    name: foundProduct.name,
                });

                // =====================================================
                // RESOLVE ORDER IDENTIFIER
                // =====================================================

                const resolvedOrderId =
                    orderId || order || null;

                const resolvedOrderDocumentId =
                    orderDocumentId || null;

                console.log("ORDER IDENTIFIERS:", {
                    orderId,
                    order,
                    orderDocumentId,
                    resolvedOrderId,
                    resolvedOrderDocumentId,
                });

                // =====================================================
                // FIND ORDER
                // =====================================================

                let foundOrder = null;

                // -----------------------------------------------------
                // 1. Try documentId first
                // -----------------------------------------------------

                if (resolvedOrderDocumentId) {
                    foundOrder = await strapi.db
                        .query("api::order.order")
                        .findOne({
                            where: {
                                documentId: resolvedOrderDocumentId,
                            },
                        });
                }

                // -----------------------------------------------------
                // 2. Try numeric ID
                // -----------------------------------------------------

                if (!foundOrder && resolvedOrderId) {
                    foundOrder = await strapi.db
                        .query("api::order.order")
                        .findOne({
                            where: {
                                id: Number(resolvedOrderId),
                            },
                        });
                }

                // -----------------------------------------------------
                // Order not found
                // -----------------------------------------------------

                if (!foundOrder) {
                    console.error("❌ ORDER NOT FOUND:", {
                        orderId,
                        order,
                        orderDocumentId,
                    });

                    return ctx.notFound("Order not found");
                }

                console.log("✅ ORDER FOUND:", {
                    id: foundOrder.id,
                    documentId: foundOrder.documentId,
                    orderNumber: foundOrder.orderNumber,
                });

                // =====================================================
                // CREATE ORDER ITEM
                // =====================================================

                const createdOrderItem = await strapi
                    .documents("api::order-item.order-item")
                    .create({
                        data: {
                            quantity: Number(quantity || 1),
                            price: Number(price || 0),
                            total: Number(
                                total ??
                                Number(price || 0) * Number(quantity || 1)
                            ),

                            // IMPORTANT:
                            // Strapi 5 Document Service relations
                            // should use documentId
                            product: foundProduct.documentId,
                            order: foundOrder.documentId,
                        },

                        populate: {
                            product: {
                                populate: {
                                    image: true,
                                },
                            },
                            order: true,
                        },
                    });

                console.log(
                    "✅ ORDER ITEM CREATED:",
                    JSON.stringify(
                        createdOrderItem,
                        null,
                        2
                    )
                );

                // =====================================================
                // VERIFY PRODUCT RELATION
                // =====================================================

                if (!createdOrderItem?.product) {
                    console.error(
                        "❌ PRODUCT RELATION WAS NOT SAVED"
                    );

                    return ctx.internalServerError(
                        "Order item created but product relation was not saved"
                    );
                }

                // =====================================================
                // VERIFY ORDER RELATION
                // =====================================================

                if (!createdOrderItem?.order) {
                    console.error(
                        "❌ ORDER RELATION WAS NOT SAVED"
                    );

                    return ctx.internalServerError(
                        "Order item created but order relation was not saved"
                    );
                }

                // =====================================================
                // SUCCESS LOGS
                // =====================================================

                console.log(
                    "================================="
                );

                console.log(
                    "✅ PRODUCT RELATION SAVED:",
                    createdOrderItem.product
                );

                console.log(
                    "✅ ORDER RELATION SAVED:",
                    createdOrderItem.order
                );

                console.log(
                    "✅ ORDER ITEM CREATED SUCCESSFULLY"
                );

                console.log(
                    "================================="
                );

                // =====================================================
                // RETURN
                // =====================================================

                return ctx.created(createdOrderItem);

            } catch (error) {

                console.error(
                    "❌ ORDER ITEM CREATE ERROR:",
                    error
                );

                if (error instanceof Error) {

                    console.error(
                        "ERROR MESSAGE:",
                        error.message
                    );

                    console.error(
                        "ERROR STACK:",
                        error.stack
                    );
                }

                const message =
                    error instanceof Error
                        ? error.message
                        : "Failed to create order item";

                return ctx.internalServerError(message);
            }
        },

        // =====================================================
        // FIND ALL ORDER ITEMS
        // =====================================================

        async find(ctx) {
            try {

                const orderItems = await strapi
                    .documents("api::order-item.order-item")
                    .findMany({
                        sort: "createdAt:desc",

                        populate: {
                            product: {
                                populate: {
                                    image: true,
                                },
                            },
                            order: true,
                        },
                    });

                console.log(
                    "ALL ORDER ITEMS:",
                    JSON.stringify(
                        orderItems,
                        null,
                        2
                    )
                );

                return {
                    data: orderItems,
                };

            } catch (error) {

                console.error(
                    "❌ ORDER ITEMS FIND ERROR:",
                    error
                );

                if (error instanceof Error) {

                    console.error(
                        "ERROR MESSAGE:",
                        error.message
                    );

                    console.error(
                        "ERROR STACK:",
                        error.stack
                    );
                }

                return ctx.internalServerError(
                    "Failed to fetch order items"
                );
            }
        },

        // =====================================================
        // FIND ONE ORDER ITEM
        // =====================================================




        async findOne(ctx) {
            try {
                const { id } = ctx.params;

                console.log("=================================");
                console.log("FIND ORDER ITEM ID:", id);
                console.log("=================================");

                // -------------------------------------------------
                // First try numeric database ID
                // -------------------------------------------------

                let orderItem = null;

                if (!isNaN(Number(id))) {
                    orderItem = await strapi.db
                        .query("api::order-item.order-item")
                        .findOne({
                            where: {
                                id: Number(id),
                            },
                            populate: {
                                product: {
                                    populate: {
                                        image: true,
                                    },
                                },
                                order: true,
                            },
                        });
                }

                // -------------------------------------------------
                // If not found, try documentId
                // -------------------------------------------------

                if (!orderItem) {
                    orderItem = await strapi
                        .documents("api::order-item.order-item")
                        .findOne({
                            documentId: id,

                            populate: {
                                product: {
                                    populate: {
                                        image: true,
                                    },
                                },
                                order: true,
                            },
                        });
                }

                // -------------------------------------------------
                // Not found
                // -------------------------------------------------

                if (!orderItem) {
                    console.error(
                        "❌ ORDER ITEM NOT FOUND:",
                        id
                    );

                    return ctx.notFound(
                        "Order item not found"
                    );
                }

                // -------------------------------------------------
                // Debug
                // -------------------------------------------------

                console.log(
                    "SINGLE ORDER ITEM:",
                    JSON.stringify(
                        orderItem,
                        null,
                        2
                    )
                );

                console.log(
                    "PRODUCT:",
                    JSON.stringify(
                        orderItem.product,
                        null,
                        2
                    )
                );

                console.log(
                    "ORDER:",
                    JSON.stringify(
                        orderItem.order,
                        null,
                        2
                    )
                );

                console.log(
                    "================================="
                );

                return {
                    data: orderItem,
                };

            } catch (error) {

                console.error(
                    "❌ ORDER ITEM FIND ONE ERROR:",
                    error
                );

                if (error instanceof Error) {

                    console.error(
                        "ERROR MESSAGE:",
                        error.message
                    );

                    console.error(
                        "ERROR STACK:",
                        error.stack
                    );
                }

                return ctx.internalServerError(
                    "Failed to fetch order item"
                );
            }
        }


    })
);

