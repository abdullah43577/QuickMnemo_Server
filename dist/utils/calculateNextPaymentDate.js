"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateNextPaymentDate = void 0;
const calculateNextPaymentDate = (subscribedAt) => {
    const date = new Date(subscribedAt);
    date.setMonth(date.getMonth() + 1);
    return date;
};
exports.calculateNextPaymentDate = calculateNextPaymentDate;
