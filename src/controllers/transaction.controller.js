const ExchangeService = require('../services/exchange.service');
const PurchaseService = require('../services/purchase.service');
const TransactionService = require('../services/transaction.service');
const { successResponse, errorResponse } = require('../utils/response');

const ERROR_MAP = {
  INITIATOR_PRODUCT_NOT_AVAILABLE: [409, 'Your product is not available for exchange'],
  TARGET_PRODUCT_NOT_AVAILABLE: [409, 'Target product is not available'],
  PRODUCT_NOT_AVAILABLE: [409, 'Product is not available for purchase'],
  CANNOT_EXCHANGE_WITH_SELF: [400, 'You cannot exchange with yourself'],
  CANNOT_BUY_OWN_PRODUCT: [400, 'You cannot purchase your own product'],
  EXCHANGE_REQUEST_EXISTS: [409, 'A pending exchange request already exists'],
  PURCHASE_REQUEST_EXISTS: [409, 'A pending purchase request already exists'],
  EXCHANGE_REQUEST_NOT_FOUND: [404, 'Exchange request not found'],
  PURCHASE_REQUEST_NOT_FOUND: [404, 'Purchase request not found'],
  TRANSACTION_NOT_FOUND: [404, 'Transaction not found'],
};

function handleError(error, res, next) {
  const mapped = ERROR_MAP[error.message];
  if (mapped) return errorResponse(res, mapped[0], mapped[1]);
  return next(error);
}

class TransactionController {
  static async createExchange(req, res, next) {
    try {
      const result = await ExchangeService.createExchangeRequest({ ...req.body, initiatorUserId: req.user.user_id });
      return successResponse(res, 201, result, 'Exchange request created successfully');
    } catch (error) { return handleError(error, res, next); }
  }

  static async listExchanges(req, res, next) {
    try { return successResponse(res, 200, await ExchangeService.getUserExchangeRequests(req.user.user_id, req.query), 'Exchange requests retrieved successfully'); }
    catch (error) { return handleError(error, res, next); }
  }

  static async getExchange(req, res, next) {
    try { return successResponse(res, 200, await ExchangeService.getExchangeRequestById(req.params.id, req.user.user_id), 'Exchange request retrieved successfully'); }
    catch (error) { return handleError(error, res, next); }
  }

  static async acceptExchange(req, res, next) {
    try { return successResponse(res, 200, await ExchangeService.acceptExchangeRequest(req.params.id, req.user.user_id), 'Exchange request accepted successfully'); }
    catch (error) { return handleError(error, res, next); }
  }

  static async rejectExchange(req, res, next) {
    try { return successResponse(res, 200, await ExchangeService.rejectExchangeRequest(req.params.id, req.user.user_id, req.body.reason), 'Exchange request rejected successfully'); }
    catch (error) { return handleError(error, res, next); }
  }

  static async completeExchange(req, res, next) {
    try { return successResponse(res, 200, await ExchangeService.completeExchangeRequest(req.params.id, req.user.user_id), 'Exchange completed successfully'); }
    catch (error) { return handleError(error, res, next); }
  }

  static async cancelExchange(req, res, next) {
    try { return successResponse(res, 200, await ExchangeService.cancelExchangeRequest(req.params.id, req.user.user_id), 'Exchange cancelled successfully'); }
    catch (error) { return handleError(error, res, next); }
  }

  static async createPurchase(req, res, next) {
    try {
      const result = await PurchaseService.createPurchaseRequest({ ...req.body, initiatorUserId: req.user.user_id });
      return successResponse(res, 201, result, 'Purchase request created successfully');
    } catch (error) { return handleError(error, res, next); }
  }

  static async listPurchases(req, res, next) {
    try { return successResponse(res, 200, await PurchaseService.getUserPurchaseRequests(req.user.user_id, req.query), 'Purchase requests retrieved successfully'); }
    catch (error) { return handleError(error, res, next); }
  }

  static async getPurchase(req, res, next) {
    try { return successResponse(res, 200, await PurchaseService.getPurchaseRequestById(req.params.id, req.user.user_id), 'Purchase request retrieved successfully'); }
    catch (error) { return handleError(error, res, next); }
  }

  static async acceptPurchase(req, res, next) {
    try { return successResponse(res, 200, await PurchaseService.acceptPurchaseRequest(req.params.id, req.user.user_id), 'Purchase request accepted successfully'); }
    catch (error) { return handleError(error, res, next); }
  }

  static async rejectPurchase(req, res, next) {
    try { return successResponse(res, 200, await PurchaseService.rejectPurchaseRequest(req.params.id, req.user.user_id, req.body.reason), 'Purchase request rejected successfully'); }
    catch (error) { return handleError(error, res, next); }
  }

  static async completePurchase(req, res, next) {
    try { return successResponse(res, 200, await PurchaseService.completePurchaseRequest(req.params.id, req.user.user_id), 'Purchase completed successfully'); }
    catch (error) { return handleError(error, res, next); }
  }

  static async cancelPurchase(req, res, next) {
    try { return successResponse(res, 200, await PurchaseService.cancelPurchaseRequest(req.params.id, req.user.user_id), 'Purchase cancelled successfully'); }
    catch (error) { return handleError(error, res, next); }
  }

  static async listTransactions(req, res, next) {
    try { return successResponse(res, 200, await TransactionService.getUserTransactions(req.user.user_id, req.query), 'Transactions retrieved successfully'); }
    catch (error) { return next(error); }
  }

  static async getStats(req, res, next) {
    try { return successResponse(res, 200, await TransactionService.getTransactionStats(req.user.user_id), 'Transaction statistics retrieved successfully'); }
    catch (error) { return next(error); }
  }
}

module.exports = TransactionController;
